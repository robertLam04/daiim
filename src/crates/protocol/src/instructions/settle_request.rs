use crate::error::ProtocolError;
use crate::internal::{aggregate, reputation};
use crate::ledger::Ledger;
use crate::params::Params;
use crate::types::{Address, IncludedPrediction, Request, RequestStatus, Task};
use std::collections::HashSet;

pub fn settle_request(
    _ledger: &mut Ledger,
    task: &mut Task,
    request: &mut Request,
    params: &Params,
    predictions: &[(Address, f64)],
) -> Result<(), ProtocolError> {
    if matches!(
        request.status(),
        RequestStatus::Settled | RequestStatus::Cancelled
    ) {
        return Err(ProtocolError::RequestAlreadyFinalized);
    }
    if request.task_id() != task.id() {
        return Err(ProtocolError::TaskMismatch);
    }
    if predictions.len() < 2 {
        return Err(ProtocolError::InsufficientPredictions);
    }

    let mut seen = HashSet::new();
    let mut included = Vec::with_capacity(predictions.len());
    for &(address, value) in predictions {
        if !seen.insert(address) {
            return Err(ProtocolError::DuplicatePrediction);
        }
        let provider = task
            .registered_providers()
            .iter()
            .find(|provider| provider.address() == address)
            .ok_or(ProtocolError::ProviderNotRegistered)?;
        let score = provider.reputation();
        if score != 0.0 {
            included.push(IncludedPrediction::new(address, value, score)?);
        }
    }
    if included.len() < 2 {
        return Err(ProtocolError::InsufficientPredictions);
    }
    let aggregate = aggregate::weighted_median(&included)?;
    let next_scores =
        reputation::updated_reputations(&included, aggregate, params.reputation_adjustment_factor)?;
    for (prediction, next) in included.iter().zip(next_scores) {
        task.set_provider_reputation(prediction.address(), next)
            .expect("included provider and updated reputation were validated above");
    }
    request.record_settlement(included, aggregate);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{Category, EvaluationMetric, Provider, RequestId, TaskId};

    fn fixture() -> (Ledger, Task, Params) {
        let mut task = Task::new(
            TaskId(1),
            "regression".into(),
            Category::Regression,
            EvaluationMetric::Accuracy,
            3,
        );
        for id in 1..=3 {
            task.add_provider(Provider::new(Address([id; 32]), 10.0, 50));
        }
        (Ledger::default(), task, Params::default())
    }

    #[test]
    fn successive_requests_use_updated_reputations() {
        let (mut ledger, mut task, params) = fixture();
        let predictions = [
            (Address([1; 32]), 0.0),
            (Address([2; 32]), 1.0),
            (Address([3; 32]), 2.0),
        ];
        let mut first = Request::new(RequestId(1), TaskId(1), 5.0, Address([0; 32]), 0);
        settle_request(&mut ledger, &mut task, &mut first, &params, &predictions).unwrap();
        assert_eq!(first.aggregated_prediction(), Some(1.0));
        assert_eq!(first.status(), RequestStatus::Settled);
        let score_after_first = task.registered_providers()[1].reputation();
        assert_eq!(score_after_first, 11.0);

        let mut second = Request::new(RequestId(2), TaskId(1), 6.0, Address([0; 32]), 0);
        settle_request(&mut ledger, &mut task, &mut second, &params, &predictions).unwrap();
        assert_eq!(
            second.included_predictions()[1].reputation(),
            score_after_first
        );
        assert!(task.registered_providers()[1].reputation() > score_after_first);
        assert_eq!(
            settle_request(&mut ledger, &mut task, &mut second, &params, &predictions),
            Err(ProtocolError::RequestAlreadyFinalized)
        );
    }

    #[test]
    fn invalid_submission_does_not_change_state() {
        let (mut ledger, mut task, params) = fixture();
        let mut request = Request::new(RequestId(1), TaskId(1), 5.0, Address([0; 32]), 0);
        let original = task.clone();
        let duplicate = [(Address([1; 32]), 0.0), (Address([1; 32]), 1.0)];
        assert_eq!(
            settle_request(&mut ledger, &mut task, &mut request, &params, &duplicate),
            Err(ProtocolError::DuplicatePrediction)
        );
        assert_eq!(task, original);
        assert_eq!(request.status(), RequestStatus::Accepting);
        assert_eq!(request.aggregated_prediction(), None);
    }

    #[test]
    fn zero_reputation_prediction_is_excluded() {
        let (mut ledger, mut task, params) = fixture();
        task.set_provider_reputation(Address([3; 32]), 0.0).unwrap();
        let mut request = Request::new(RequestId(1), TaskId(1), 5.0, Address([0; 32]), 0);
        let predictions = [
            (Address([1; 32]), 0.0),
            (Address([2; 32]), 10.0),
            (Address([3; 32]), 100.0),
        ];
        settle_request(&mut ledger, &mut task, &mut request, &params, &predictions).unwrap();
        assert_eq!(request.included_predictions().len(), 2);
        assert_eq!(request.aggregated_prediction(), Some(5.0));
        assert_eq!(task.registered_providers()[2].reputation(), 0.0);
    }

    #[test]
    fn arithmetic_error_keeps_reputations_and_request_unchanged() {
        let (mut ledger, mut task, params) = fixture();
        let mut request = Request::new(RequestId(1), TaskId(1), 5.0, Address([0; 32]), 0);
        let original = task.clone();
        let predictions = [
            (Address([1; 32]), -f64::MAX),
            (Address([2; 32]), 0.0),
            (Address([3; 32]), f64::MAX),
        ];
        assert_eq!(
            settle_request(&mut ledger, &mut task, &mut request, &params, &predictions),
            Err(ProtocolError::ArithmeticError)
        );
        assert_eq!(task, original);
        assert_eq!(request.status(), RequestStatus::Accepting);
        assert_eq!(request.aggregated_prediction(), None);
    }
}
