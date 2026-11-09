#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum RequestStatus {
    Accepting,
    Committing,
    Revealing,
    Settled,
    Cancelled,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Category {
    Regression,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum EvaluationMetric {
    Accuracy,
}

#[derive(Debug, Clone, PartialEq)]
struct Task {
    id: u32,
    description: String,
    category: Category,
    evaluation_metric: EvaluationMetric,
    registered_providers: Vec<Provider>,
    max_providers: u32,
}

#[derive(Debug, Clone, PartialEq)]
struct Provider {
    address: i64,
    reputation: f64,
    stake: u32,
}

type Salt = [u8; 32];

#[derive(Debug, Clone, PartialEq)]
struct Request {
    id: u32,
    task_id: u32,
    input: f64,
    requester: i64,
    status: RequestStatus,
    payment: u64,
    accepted_providers: Vec<Provider>,
    provider_commit: String,
    provider_prediction: f64,
    provider_salt: Salt,
    aggregated_prediction: f64,
}