use crate::error::ProtocolError;
use crate::ledger::Ledger;
use crate::params::ACCEPTANCE_PERIOD;
use crate::types::{Request, RequestId, Requester, Task};

pub fn create_request(
    ledger: &mut Ledger,
    request_id: RequestId,
    task: &Task,
    requester: &Requester,
    input: f64,
    payment: u64,
    current_time: u64,
) -> Result<Request, ProtocolError> {
    // TODO: Validate payment and input, escrow funds, and persist the request.
    let _ = ledger;
    if !input.is_finite() {
        return Err(ProtocolError::InvalidPrediction);
    }
    let deadline = current_time
        .checked_add(ACCEPTANCE_PERIOD)
        .ok_or(ProtocolError::ArithmeticError)?;
    Ok(Request::new(
        request_id,
        task.id(),
        input,
        requester.address(),
        payment,
        deadline,
    ))
}
