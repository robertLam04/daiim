use crate::error::ProtocolError;
use crate::ledger::Ledger;
use crate::params::Params;
use crate::types::{Request, Task};

pub fn advance_request(
    ledger: &mut Ledger,
    task: &mut Task,
    request: &mut Request,
    params: &Params,
    current_time: u64,
) -> Result<(), ProtocolError> {
    Err(ProtocolError::NotImplemented)
}
