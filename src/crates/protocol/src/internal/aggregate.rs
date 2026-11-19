use crate::error::ProtocolError;
use crate::types::IncludedPrediction;

pub(crate) fn weighted_median(predictions: &[IncludedPrediction]) -> Result<f64, ProtocolError> {
    if predictions.len() < 2 {
        return Err(ProtocolError::InsufficientPredictions);
    }

    let mut sorted = predictions.to_vec();
    sorted.sort_by(|a, b| a.value().total_cmp(&b.value()));

    let total: f64 = sorted.iter().map(IncludedPrediction::reputation).sum();
    if !total.is_finite() || total <= 0.0 {
        return Err(ProtocolError::ArithmeticError);
    }

    let mut cumulative = 0.0;
    let mut previous: Option<f64> = None;
    for prediction in sorted {
        let before = cumulative;
        cumulative += prediction.reputation();
        if !cumulative.is_finite() {
            return Err(ProtocolError::ArithmeticError);
        }
        if cumulative > total / 2.0 {
            return match previous {
                Some(value) if before == total / 2.0 => {
                    let midpoint = value / 2.0 + prediction.value() / 2.0;
                    midpoint
                        .is_finite()
                        .then_some(midpoint)
                        .ok_or(ProtocolError::ArithmeticError)
                }
                _ => Ok(prediction.value()),
            };
        }
        previous = Some(prediction.value());
    }
    Err(ProtocolError::ArithmeticError)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::Address;

    fn prediction(id: u8, value: f64, reputation: f64) -> IncludedPrediction {
        IncludedPrediction::new(Address([id; 32]), value, reputation).unwrap()
    }

    #[test]
    fn larger_reputation_can_move_median_away_from_middle_value() {
        let values = [
            prediction(1, 1.0, 10.0),
            prediction(2, 2.0, 10.0),
            prediction(3, 3.0, 30.0),
        ];
        assert_eq!(weighted_median(&values), Ok(3.0));
    }

    #[test]
    fn exact_half_uses_midpoint() {
        let values = [prediction(1, 4.0, 1.0), prediction(2, 10.0, 1.0)];
        assert_eq!(weighted_median(&values), Ok(7.0));
    }
}
