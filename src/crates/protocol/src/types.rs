#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RequestStatus {
    Accepting,
    Committing,
    Revealing,
    Settled,
    Cancelled,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Category {
    Regression,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EvaluationMetric {
    Accuracy,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct Address(pub [u8; 32]);

#[derive(Debug, Clone, PartialEq)]
pub struct TaskId(pub u32);

#[derive(Debug, Clone, PartialEq)]
pub struct RequestId(pub u32);

#[derive(Debug, Clone, PartialEq)]
pub struct Task {
    id: TaskId,
    description: String,
    category: Category,
    evaluation_metric: EvaluationMetric,
    registered_providers: Vec<Provider>,
    max_providers: u32,
}

impl Task {
    pub fn new(id: TaskId, description: String, category: Category, evaluation_metric: EvaluationMetric, max_providers: u32) -> Self {
        Self {
            id,
            description,
            category,
            evaluation_metric,
            registered_providers: Vec::new(),
            max_providers,
        }
    }

    pub fn id(&self) -> TaskId {
        self.id.clone()
    }

    pub fn max_providers(&self) -> u32 {
        self.max_providers
    }

    pub fn add_provider(&mut self, provider: Provider) {
        self.registered_providers.push(provider);
    }

    pub fn remove_provider(&mut self, address: Address) -> Option<Provider> {
    let pos = self.registered_providers
        .iter()
        .position(|p| p.address == address)?;

    Some(self.registered_providers.remove(pos))
}

    pub fn registered_providers(&self) -> &[Provider] {
        &self.registered_providers
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Provider {
    address: Address,
    reputation: f64,
    stake: u64,
}

impl Provider {
    pub fn new(address: Address, reputation: f64, stake: u64) -> Self {
        Self {
            address,
            reputation,
            stake,
        }
    }

    pub fn address(&self) -> Address {
        self.address
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Requester {
    address: Address
}

impl Requester {
    pub fn new(address: Address) -> Self {
        Self { address }
    }

    pub fn address(&self) -> Address {
        self.address
    }
}

type Salt = [u8; 32];

#[derive(Debug, Clone, PartialEq)]
pub struct Request {
    id: RequestId,
    task_id: TaskId,
    input: f64,
    requester: Address,
    status: RequestStatus,
    payment: u64,
    accepted_providers: Vec<Provider>,
    provider_commit: String,
    provider_prediction: f64,
    provider_salt: Salt,
    aggregated_prediction: f64,
}

impl Request {
    pub fn new(id: RequestId, task_id: TaskId, input: f64, requester: Address, payment: u64) -> Self {
        Self {
            id,
            task_id,
            input,
            requester,
            status: RequestStatus::Accepting,
            payment,
            accepted_providers: Vec::new(),
            // TODO: Store each provider's commitment and reveal separately.
            provider_commit: String::new(),
            provider_prediction: 0.0,
            provider_salt: [0; 32],
            aggregated_prediction: 0.0,
        }
    }
}
