use crate::error::ProtocolError;
use crate::params::{MAX_REPUTATION, MIN_REPUTATION};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RequestStatus {
    Accepting,
    Committing,
    Revealing,
    Ready,
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
    min_providers: u32,
    max_providers: u32,
}

impl Task {
    pub fn new(
        id: TaskId,
        description: String,
        category: Category,
        evaluation_metric: EvaluationMetric,
        min_providers: u32,
        max_providers: u32,
    ) -> Self {
        Self {
            id,
            description,
            category,
            evaluation_metric,
            registered_providers: Vec::new(),
            min_providers,
            max_providers,
        }
    }

    pub fn id(&self) -> TaskId {
        self.id.clone()
    }

    pub fn max_providers(&self) -> u32 {
        self.max_providers
    }

    pub fn min_providers(&self) -> u32 {
        self.min_providers
    }

    pub fn add_provider(&mut self, provider: Provider) {
        self.registered_providers.push(provider);
    }

    pub fn remove_provider(&mut self, address: Address) -> Option<Provider> {
        let pos = self
            .registered_providers
            .iter()
            .position(|p| p.address == address)?;

        Some(self.registered_providers.remove(pos))
    }

    pub fn registered_providers(&self) -> &[Provider] {
        &self.registered_providers
    }

    pub fn set_provider_reputation(
        &mut self,
        address: Address,
        reputation: f64,
    ) -> Result<(), ProtocolError> {
        if !reputation.is_finite() || !(MIN_REPUTATION..=MAX_REPUTATION).contains(&reputation) {
            return Err(ProtocolError::InvalidReputation);
        }
        let provider = self
            .registered_providers
            .iter_mut()
            .find(|p| p.address == address)
            .ok_or(ProtocolError::ProviderNotRegistered)?;
        provider.reputation = reputation;
        Ok(())
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

    pub fn reputation(&self) -> f64 {
        self.reputation
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Requester {
    address: Address,
}

impl Requester {
    pub fn new(address: Address) -> Self {
        Self { address }
    }

    pub fn address(&self) -> Address {
        self.address
    }
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct IncludedPrediction {
    address: Address,
    value: f64,
    reputation: f64,
}

impl IncludedPrediction {
    pub(crate) fn new(
        address: Address,
        value: f64,
        reputation: f64,
    ) -> Result<Self, ProtocolError> {
        if !value.is_finite() {
            return Err(ProtocolError::InvalidPrediction);
        }
        if !reputation.is_finite() || reputation <= MIN_REPUTATION || reputation > MAX_REPUTATION {
            return Err(ProtocolError::InvalidReputation);
        }
        Ok(Self {
            address,
            value,
            reputation,
        })
    }

    pub fn address(&self) -> Address {
        self.address
    }

    pub fn value(&self) -> f64 {
        self.value
    }

    pub fn reputation(&self) -> f64 {
        self.reputation
    }
}

#[cfg(test)]
mod included_prediction_tests {
    use super::*;

    #[test]
    fn rejects_non_finite_predictions_and_non_positive_or_out_of_range_reputation() {
        let address = Address([1; 32]);
        for value in [f64::NAN, f64::INFINITY, f64::NEG_INFINITY] {
            assert_eq!(
                IncludedPrediction::new(address, value, 10.0),
                Err(ProtocolError::InvalidPrediction)
            );
        }
        for score in [0.0, -1.0, 101.0, f64::INFINITY, f64::NAN] {
            assert_eq!(
                IncludedPrediction::new(address, 1.0, score),
                Err(ProtocolError::InvalidReputation)
            );
        }
    }
}

pub type Salt = [u8; 32];

#[derive(Debug, Clone, PartialEq)]
pub struct ProviderParticipation {
    pub(crate) address: Address,
    pub(crate) commitment: Option<[u8; 32]>,
    pub(crate) prediction: Option<f64>,
    pub(crate) salt: Option<Salt>,
}

impl ProviderParticipation {
    pub(crate) fn new(address: Address) -> Self {
        Self {
            address,
            commitment: None,
            prediction: None,
            salt: None,
        }
    }

    pub fn address(&self) -> Address {
        self.address
    }
    pub fn commitment(&self) -> Option<[u8; 32]> {
        self.commitment
    }
    pub fn prediction(&self) -> Option<f64> {
        self.prediction
    }
    pub fn salt(&self) -> Option<Salt> {
        self.salt
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Request {
    id: RequestId,
    task_id: TaskId,
    input: f64,
    requester: Address,
    pub(crate) status: RequestStatus,
    payment: u64,
    pub(crate) provider_participations: Vec<ProviderParticipation>,
    pub(crate) phase_deadline: u64,
    pub(crate) last_accept_time: Option<u64>,
    pub(crate) last_commit_time: Option<u64>,
    pub(crate) included_predictions: Vec<IncludedPrediction>,
    pub(crate) aggregated_prediction: Option<f64>,
}

impl Request {
    pub fn new(
        id: RequestId,
        task_id: TaskId,
        input: f64,
        requester: Address,
        payment: u64,
        acceptance_deadline: u64,
    ) -> Self {
        Self {
            id,
            task_id,
            input,
            requester,
            status: RequestStatus::Accepting,
            payment,
            provider_participations: Vec::new(),
            phase_deadline: acceptance_deadline,
            last_accept_time: None,
            last_commit_time: None,
            included_predictions: Vec::new(),
            aggregated_prediction: None,
        }
    }

    pub fn task_id(&self) -> TaskId {
        self.task_id.clone()
    }

    pub fn id(&self) -> RequestId {
        self.id.clone()
    }
    pub fn input(&self) -> f64 {
        self.input
    }
    pub fn phase_deadline(&self) -> u64 {
        self.phase_deadline
    }
    pub fn provider_participations(&self) -> &[ProviderParticipation] {
        &self.provider_participations
    }

    pub fn last_accept_time(&self) -> Option<u64> {
        self.last_accept_time
    }
    pub fn last_commit_time(&self) -> Option<u64> {
        self.last_commit_time
    }

    pub fn status(&self) -> RequestStatus {
        self.status
    }

    pub fn included_predictions(&self) -> &[IncludedPrediction] {
        &self.included_predictions
    }

    pub fn aggregated_prediction(&self) -> Option<f64> {
        self.aggregated_prediction
    }
}
