use crate::error::ProtocolError;
use crate::ledger::Ledger;
use crate::types::{Address, Request, RequestStatus};

pub fn provider_reveal(
    _ledger: &mut Ledger,
    request: &mut Request,
    provider: Address,
    prediction: f64,
    salt: [u8; 32],
    current_time: u64,
) -> Result<(), ProtocolError> {
    if request.status() != RequestStatus::Revealing {
        return Err(ProtocolError::WrongPhase);
    }
    if current_time >= request.phase_deadline() {
        return Err(ProtocolError::DeadlineExpired);
    }
    let participant = request
        .provider_participations
        .iter_mut()
        .find(|p| p.address() == provider)
        .ok_or(ProtocolError::ProviderNotAccepted)?;
    participant
        .commitment()
        .ok_or(ProtocolError::MissingCommitment)?;
    if participant.prediction().is_some() {
        return Err(ProtocolError::DuplicateReveal);
    }
    participant.prediction = Some(prediction);
    participant.salt = Some(salt);
    Ok(())
}
