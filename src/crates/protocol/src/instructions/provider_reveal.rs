use crate::error::ProtocolError;
use crate::ledger::Ledger;
use crate::types::{Address, Request};

pub fn provider_reveal(
    ledger: &mut Ledger,
    request: &mut Request,
    provider: Address,
    prediction: f64,
    salt: [u8; 32],
) -> Result<(), ProtocolError> {
    Err(ProtocolError::NotImplemented)
}
