use crate::error::ProtocolError;
use crate::ledger::Ledger;
use crate::params::Params;
use crate::types::{Request, Task};

pub fn settle_request(
    ledger: &mut Ledger,
    task: &mut Task,
    request: &mut Request,
    params: &Params,
) -> Result<(), ProtocolError> {
    Err(ProtocolError::NotImplemented)
}
