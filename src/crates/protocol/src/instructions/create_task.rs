use crate::types::{TaskId, Task, Requester, EvaluationMetric, Category};
use crate::ledger::Ledger;
use crate::error::ProtocolError;

pub fn create_task(
    ledger: &mut Ledger,
    requester: &Requester,
    task_id: TaskId,
    description: String,
    category: Category,
    evaluation_metric: EvaluationMetric,
    max_providers: u32,
) -> Result<Task, ProtocolError> {
    // TODO: Validate task settings and persist the task in protocol state.
    let _ = (ledger, requester);
    Ok(Task::new(task_id, description, category, evaluation_metric, max_providers))
}
