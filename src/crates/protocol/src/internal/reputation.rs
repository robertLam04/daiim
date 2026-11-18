use crate::error::ProtocolError;
use crate::params::{MAX_REPUTATION, MIN_REPUTATION};
use crate::types::IncludedPrediction;

pub fn updated_reputations(
    predictions: &[IncludedPrediction],
    aggregate: f64,
    adjustment_factor: f64,
) -> Result<Vec<f64>, ProtocolError> {
    if !aggregate.is_finite() {
        return Err(ProtocolError::ArithmeticError);
    }
    if !adjustment_factor.is_finite() || adjustment_factor < 0.0 {
        return Err(ProtocolError::InvalidParameter);
    }

    let total: f64 = predictions.iter().map(IncludedPrediction::reputation).sum();
    if !total.is_finite() || total <= 0.0 {
        return Err(ProtocolError::ArithmeticError);
    }

    let mut weighted_squared_error = 0.0;
    let mut distances = Vec::with_capacity(predictions.len());
    for prediction in predictions {
        let distance = (prediction.value() - aggregate).abs();
        if !distance.is_finite() {
            return Err(ProtocolError::ArithmeticError);
        }
        let weighted_squared_deviation = prediction.reputation() * distance * distance;
        weighted_squared_error += weighted_squared_deviation;
        if !weighted_squared_error.is_finite() {
            return Err(ProtocolError::ArithmeticError);
        }
        distances.push(distance);
    }
    let variance = weighted_squared_error / total;
    if !variance.is_finite() {
        return Err(ProtocolError::ArithmeticError);
    }
    if variance == 0.0 {
        // SRS Appendix A: identical included predictions produce no updates.
        return Ok(predictions
            .iter()
            .map(IncludedPrediction::reputation)
            .collect());
    }

    let sigma = variance.sqrt();
    predictions
        .iter()
        .zip(distances)
        .map(|(prediction, distance)| {
            let delta = adjustment_factor * (1.0 - distance / sigma);
            let next = prediction.reputation() + delta;
            if !next.is_finite() {
                return Err(ProtocolError::ArithmeticError);
            }
            Ok(next.clamp(MIN_REPUTATION, MAX_REPUTATION))
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::Address;

    fn prediction(id: u8, value: f64, reputation: f64) -> IncludedPrediction {
        IncludedPrediction::new(Address([id; 32]), value, reputation).unwrap()
    }

    #[test]
    fn reputation_updates_use_weighted_variance_around_median() {
        let values = [
            prediction(1, 0.0, 10.0),
            prediction(2, 1.0, 10.0),
            prediction(3, 2.0, 10.0),
        ];
        let updated = updated_reputations(&values, 1.0, 1.0).unwrap();
        let edge = 10.0 + 1.0 - (3.0_f64 / 2.0).sqrt();
        assert!((updated[0] - edge).abs() < 1e-12);
        assert_eq!(updated[1], 11.0);
        assert!((updated[2] - edge).abs() < 1e-12);
    }

    #[test]
    fn identical_predictions_leave_reputations_unchanged() {
        let values = [prediction(1, 5.0, 10.0), prediction(2, 5.0, 20.0)];
        assert_eq!(updated_reputations(&values, 5.0, 1.0), Ok(vec![10.0, 20.0]));
    }

    #[test]
    fn reputation_is_clamped_to_declared_range() {
        let values = [prediction(1, 0.0, 99.8), prediction(2, 1.0, 1.0)];
        let updated = updated_reputations(&values, 0.0, 1.0).unwrap();
        assert_eq!(updated[0], 100.0);
        assert_eq!(updated[1], 0.0);
    }
}
