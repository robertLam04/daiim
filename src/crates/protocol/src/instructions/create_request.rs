use crate::types::{Request, RequestId, Requester, Task};
use crate::ledger::Ledger;
use crate::error::ProtocolError;

pub fn create_request(
    ledger: &mut Ledger,
    request_id: RequestId,
    task: &Task,
    requester: &Requester,
    input: f64,
    payment: u64,
) -> Result<Request, ProtocolError> {
    // TODO: Validate payment and input, escrow funds, and persist the request.
    let _ = ledger;
    Ok(Request::new(request_id, task.id(), input, requester.address(), payment))
}
