use crate::error::ProtocolError;
use crate::ledger::Ledger;
use crate::params::Params;
use crate::types::{Address, ProviderParticipation, Request, RequestStatus, Task};

pub fn provider_accept(
    _ledger: &mut Ledger,
    task: &Task,
    request: &mut Request,
    provider: Address,
    _params: &Params,
    current_time: u64,
) -> Result<(), ProtocolError> {
    if request.task_id() != task.id() {
        return Err(ProtocolError::TaskMismatch);
    }
    if request.status() != RequestStatus::Accepting {
        return Err(ProtocolError::WrongPhase);
    }
    if current_time >= request.phase_deadline() {
        return Err(ProtocolError::DeadlineExpired);
    }
    if request
        .provider_participations()
        .iter()
        .any(|p| p.address() == provider)
    {
        return Err(ProtocolError::DuplicateAcceptance);
    }
    if request.provider_participations().len() >= task.max_providers() as usize {
        return Err(ProtocolError::MaxProvidersReached);
    }
    if !task
        .registered_providers()
        .iter()
        .any(|p| p.address() == provider)
    {
        return Err(ProtocolError::ProviderNotRegistered);
    }
    request
        .provider_participations
        .push(ProviderParticipation::new(provider));
    request.last_accept_time = Some(
        request
            .last_accept_time
            .map_or(current_time, |last| last.max(current_time)),
    );
    Ok(())
}
