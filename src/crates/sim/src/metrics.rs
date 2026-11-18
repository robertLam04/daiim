use protocol::types::RequestStatus;

pub fn unweighted_median(predictions: impl IntoIterator<Item = f64>) -> Option<f64> {
    let mut values: Vec<f64> = predictions.into_iter().collect();
    if values.is_empty() {
        return None;
    }
    values.sort_by(f64::total_cmp);
    let middle = values.len() / 2;
    Some(if values.len() % 2 == 0 {
        values[middle - 1] / 2.0 + values[middle] / 2.0
    } else {
        values[middle]
    })
}

#[derive(Default)]
pub struct RunMetrics {
    pub rounds: Vec<RequestResult>,
    pub providers: Vec<ProviderParticipationResult>,
}

pub struct RequestResult {
    pub round: u32,
    pub input: f64,
    pub truth: f64,
    pub aggregate: Option<f64>,
    pub unweighted_median: Option<f64>,
    pub status: RequestStatus,
}

impl RequestResult {
    pub fn absolute_error(&self) -> Option<f64> {
        self.aggregate
            .map(|aggregate| (aggregate - self.truth).abs())
    }

    pub fn unweighted_absolute_error(&self) -> Option<f64> {
        self.unweighted_median
            .map(|median| (median - self.truth).abs())
    }

    pub fn relative_error_percent(&self) -> Option<f64> {
        if self.truth == 0.0 {
            return None;
        }
        self.absolute_error()
            .map(|error| error / self.truth.abs() * 100.0)
    }

    pub fn unweighted_relative_error_percent(&self) -> Option<f64> {
        if self.truth == 0.0 {
            return None;
        }
        self.unweighted_absolute_error()
            .map(|error| error / self.truth.abs() * 100.0)
    }
}

pub struct ProviderParticipationResult {
    pub round: u32,
    pub provider_id: u8,
    pub prediction: Option<f64>,
    pub truth: f64,
    pub included: bool,
    pub weight: Option<f64>,
    pub reputation_before: f64,
    pub reputation_after: f64,
}

impl ProviderParticipationResult {
    pub fn absolute_error(&self) -> Option<f64> {
        self.prediction
            .map(|prediction| (prediction - self.truth).abs())
    }

    pub fn reputation_change(&self) -> f64 {
        self.reputation_after - self.reputation_before
    }
}

impl RunMetrics {
    pub fn settled_count(&self) -> usize {
        self.rounds
            .iter()
            .filter(|round| round.status == RequestStatus::Settled)
            .count()
    }

    pub fn cancelled_count(&self) -> usize {
        self.rounds
            .iter()
            .filter(|round| round.status == RequestStatus::Cancelled)
            .count()
    }

    pub fn mean_absolute_error(&self) -> Option<f64> {
        let errors: Vec<f64> = self
            .rounds
            .iter()
            .filter_map(RequestResult::absolute_error)
            .collect();
        (!errors.is_empty()).then(|| errors.iter().sum::<f64>() / errors.len() as f64)
    }

    pub fn mean_unweighted_absolute_error(&self) -> Option<f64> {
        let errors: Vec<f64> = self
            .rounds
            .iter()
            .filter_map(RequestResult::unweighted_absolute_error)
            .collect();
        (!errors.is_empty()).then(|| errors.iter().sum::<f64>() / errors.len() as f64)
    }

    pub fn mean_relative_error_percent(&self) -> Option<f64> {
        let errors: Vec<f64> = self
            .rounds
            .iter()
            .filter_map(RequestResult::relative_error_percent)
            .collect();
        (!errors.is_empty()).then(|| errors.iter().sum::<f64>() / errors.len() as f64)
    }

    pub fn mean_unweighted_relative_error_percent(&self) -> Option<f64> {
        let errors: Vec<f64> = self
            .rounds
            .iter()
            .filter_map(RequestResult::unweighted_relative_error_percent)
            .collect();
        (!errors.is_empty()).then(|| errors.iter().sum::<f64>() / errors.len() as f64)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mean_error_uses_only_settled_rounds() {
        let metrics = RunMetrics {
            rounds: vec![
                RequestResult {
                    round: 1,
                    input: 0.0,
                    truth: 2.0,
                    aggregate: Some(3.0),
                    unweighted_median: Some(2.5),
                    status: RequestStatus::Settled,
                },
                RequestResult {
                    round: 2,
                    input: 0.0,
                    truth: 2.0,
                    aggregate: None,
                    unweighted_median: None,
                    status: RequestStatus::Cancelled,
                },
            ],
            providers: Vec::new(),
        };
        assert_eq!(metrics.mean_absolute_error(), Some(1.0));
        assert_eq!(metrics.mean_unweighted_absolute_error(), Some(0.5));
        assert_eq!(metrics.mean_relative_error_percent(), Some(50.0));
        assert_eq!(metrics.mean_unweighted_relative_error_percent(), Some(25.0));
        assert_eq!(metrics.cancelled_count(), 1);
    }

    #[test]
    fn relative_error_is_unavailable_at_zero_truth() {
        let result = RequestResult {
            round: 1,
            input: 0.0,
            truth: 0.0,
            aggregate: Some(1.0),
            unweighted_median: Some(1.0),
            status: RequestStatus::Settled,
        };
        assert_eq!(result.relative_error_percent(), None);
        assert_eq!(result.unweighted_relative_error_percent(), None);
    }

    #[test]
    fn unweighted_median_handles_even_and_odd_counts() {
        assert_eq!(unweighted_median([9.0, 1.0, 5.0, 3.0]), Some(4.0));
        assert_eq!(unweighted_median([9.0, 1.0, 3.0]), Some(3.0));
    }
}
