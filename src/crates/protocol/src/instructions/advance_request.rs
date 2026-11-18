use super::settle_request::settle_request;
use crate::commitment::commitment_hash;
use crate::error::ProtocolError;
use crate::ledger::Ledger;
use crate::params::Params;
use crate::types::{IncludedPrediction, Request, RequestStatus, Task};

pub fn advance_request(
    ledger: &mut Ledger,
    task: &mut Task,
    request: &mut Request,
    params: &Params,
    current_time: u64,
) -> Result<(), ProtocolError> {
    if request.task_id() != task.id() {
        return Err(ProtocolError::TaskMismatch);
    }
    match request.status() {
        RequestStatus::Accepting => {
            if request.provider_participations().len() < task.max_providers() as usize
                && current_time < request.phase_deadline()
            {
                return Ok(());
            }
            let phase_end =
                if request.provider_participations().len() >= task.max_providers() as usize {
                    request
                        .last_accept_time()
                        .expect("capacity reached through acceptance")
                } else {
                    request.phase_deadline()
                };
            if request.provider_participations().len() < task.min_providers() as usize {
                request.status = RequestStatus::Cancelled;
                request.phase_deadline = phase_end;
            } else {
                let deadline = phase_end
                    .checked_add(params.commit_period)
                    .ok_or(ProtocolError::ArithmeticError)?;
                request.status = RequestStatus::Committing;
                request.phase_deadline = deadline;
            }
        }
        RequestStatus::Committing => {
            let all_committed = request
                .provider_participations()
                .iter()
                .all(|p| p.commitment().is_some());
            if !all_committed && current_time < request.phase_deadline() {
                return Ok(());
            }
            let phase_end = if all_committed {
                request
                    .last_commit_time()
                    .expect("all accepted providers committed")
            } else {
                request.phase_deadline()
            };
            let deadline = phase_end
                .checked_add(params.reveal_period)
                .ok_or(ProtocolError::ArithmeticError)?;
            request.status = RequestStatus::Revealing;
            request.phase_deadline = deadline;
        }
        RequestStatus::Revealing => {
            if !request
                .provider_participations()
                .iter()
                .filter(|p| p.commitment().is_some())
                .all(|p| p.prediction().is_some())
                && current_time < request.phase_deadline()
            {
                return Ok(());
            }
            let request_id = request.id();
            let mut included = Vec::new();
            for participation in request.provider_participations() {
                let (Some(prediction), Some(salt), Some(stored)) = (
                    participation.prediction(),
                    participation.salt(),
                    participation.commitment(),
                ) else {
                    continue;
                };
                // Exclude malformed or mismatched reveals from aggregation. When penalties
                // are implemented, handle the invalid reveal before these skips (including
                // slashing the provider), while still excluding its prediction.
                let Ok(revealed_commitment) =
                    commitment_hash(&request_id, participation.address(), prediction, salt)
                else {
                    continue;
                };
                if revealed_commitment != stored {
                    continue;
                }
                let Some(provider) = task
                    .registered_providers()
                    .iter()
                    .find(|provider| provider.address() == participation.address())
                else {
                    continue;
                };
                if provider.reputation() > 0.0 {
                    included.push(IncludedPrediction::new(
                        participation.address(),
                        prediction,
                        provider.reputation(),
                    )?);
                }
            }
            if included.len() < task.min_providers() as usize {
                request.status = RequestStatus::Cancelled;
                request.phase_deadline = current_time;
            } else {
                request.included_predictions = included;
                request.status = RequestStatus::Ready;
            }
        }
        RequestStatus::Ready => settle_request(ledger, task, request, params)?,
        RequestStatus::Settled | RequestStatus::Cancelled => {}
    }
    Ok(())
}
