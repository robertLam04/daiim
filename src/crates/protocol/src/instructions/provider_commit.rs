use crate::error::ProtocolError;
use crate::ledger::Ledger;
use crate::types::{Address, Request};

pub fn provider_commit(
    ledger: &mut Ledger,
    request: &mut Request,
    provider: Address,
    commitment: [u8; 32],
) -> Result<(), ProtocolError> {
    Err(ProtocolError::NotImplemented)
}
