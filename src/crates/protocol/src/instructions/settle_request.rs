use crate::error::ProtocolError;
use crate::internal::{aggregate, reputation};
use crate::ledger::Ledger;
use crate::params::Params;
use crate::types::{Request, RequestStatus, Task};

pub fn settle_request(
    _ledger: &mut Ledger,
    task: &mut Task,
    request: &mut Request,
    params: &Params,
) -> Result<(), ProtocolError> {
    if request.task_id() != task.id() {
        return Err(ProtocolError::TaskMismatch);
    }
    if matches!(
        request.status(),
        RequestStatus::Settled | RequestStatus::Cancelled
    ) {
        return Err(ProtocolError::RequestAlreadyFinalized);
    }
    if request.status() != RequestStatus::Ready {
        return Err(ProtocolError::WrongPhase);
    }

    let included = request.included_predictions();
    if included.len() < task.min_providers() as usize {
        return Err(ProtocolError::InsufficientPredictions);
    }
    let aggregate = aggregate::weighted_median(included)?;
    let next_scores =
        reputation::updated_reputations(included, aggregate, params.reputation_adjustment_factor)?;
    if included.iter().any(|prediction| {
        !task
            .registered_providers()
            .iter()
            .any(|provider| provider.address() == prediction.address())
    }) {
        return Err(ProtocolError::ProviderNotRegistered);
    }
    for (prediction, next) in included.iter().zip(next_scores) {
        task.set_provider_reputation(prediction.address(), next)
            .expect("included provider and updated reputation were validated at reveal end");
    }
    request.aggregated_prediction = Some(aggregate);
    request.status = RequestStatus::Settled;
    Ok(())
}
