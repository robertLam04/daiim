use crate::error::ProtocolError;
use crate::ledger::Ledger;
use crate::params::Params;
use crate::types::{Address, Task};

pub fn unregister_provider(
    ledger: &mut Ledger,
    task: &mut Task,
    provider: Address,
    params: &Params,
) -> Result<(), ProtocolError> {
    Err(ProtocolError::NotImplemented)
}
