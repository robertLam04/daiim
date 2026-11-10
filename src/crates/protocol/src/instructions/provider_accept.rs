use crate::error::ProtocolError;
use crate::ledger::Ledger;
use crate::params::Params;
use crate::types::{Address, Request};

pub fn provider_accept(
    ledger: &mut Ledger,
    request: &mut Request,
    provider: Address,
    params: &Params,
) -> Result<(), ProtocolError> {
    Err(ProtocolError::NotImplemented)
}
