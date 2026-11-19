use sha2::{Digest, Sha256};

use crate::error::ProtocolError;
use crate::types::{Address, RequestId, Salt};

/// Hash the request, provider, prediction and 256-bit salt in a fixed byte order.
pub fn commitment_hash(
    request_id: &RequestId,
    provider: Address,
    prediction: f64,
    salt: Salt,
) -> Result<[u8; 32], ProtocolError> {
    if !prediction.is_finite() {
        return Err(ProtocolError::InvalidPrediction);
    }
    let mut hash = Sha256::new();
    hash.update(b"DAIIM prediction commitment v1");
    hash.update(request_id.0.to_be_bytes());
    hash.update(provider.0);
    hash.update(prediction.to_bits().to_be_bytes());
    hash.update(salt);
    Ok(hash.finalize().into())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn binds_all_fields() {
        let salt = [7; 32];
        let original = commitment_hash(&RequestId(1), Address([2; 32]), 3.0, salt).unwrap();
        assert_ne!(
            original,
            commitment_hash(&RequestId(2), Address([2; 32]), 3.0, salt).unwrap()
        );
        assert_ne!(
            original,
            commitment_hash(&RequestId(1), Address([3; 32]), 3.0, salt).unwrap()
        );
        assert_ne!(
            original,
            commitment_hash(&RequestId(1), Address([2; 32]), 4.0, salt).unwrap()
        );
        assert_ne!(
            original,
            commitment_hash(&RequestId(1), Address([2; 32]), 3.0, [8; 32]).unwrap()
        );
    }
}
