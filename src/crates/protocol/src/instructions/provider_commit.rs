use crate::error::ProtocolError;
use crate::ledger::Ledger;
use crate::types::{Address, Request, RequestStatus};

pub fn provider_commit(
    _ledger: &mut Ledger,
    request: &mut Request,
    provider: Address,
    commitment: [u8; 32],
    current_time: u64,
) -> Result<(), ProtocolError> {
    if request.status() != RequestStatus::Committing {
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
    if participant.commitment().is_some() {
        return Err(ProtocolError::DuplicateCommitment);
    }
    participant.commitment = Some(commitment);
    request.last_commit_time = Some(
        request
            .last_commit_time
            .map_or(current_time, |last| last.max(current_time)),
    );
    Ok(())
}
