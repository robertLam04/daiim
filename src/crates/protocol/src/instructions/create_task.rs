use crate::error::ProtocolError;
use crate::ledger::Ledger;
use crate::types::{Category, EvaluationMetric, Requester, Task, TaskId};

pub fn create_task(
    ledger: &mut Ledger,
    requester: &Requester,
    task_id: TaskId,
    description: String,
    category: Category,
    evaluation_metric: EvaluationMetric,
    min_providers: u32,
    max_providers: u32,
) -> Result<Task, ProtocolError> {
    if min_providers < 2 || max_providers < min_providers {
        return Err(ProtocolError::InvalidTaskSettings);
    }
    // TODO: Validate task settings and persist the task in protocol state.
    let _ = (ledger, requester);
    Ok(Task::new(
        task_id,
        description,
        category,
        evaluation_metric,
        min_providers,
        max_providers,
    ))
}
