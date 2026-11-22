use crate::agents::Agent;
use crate::ground_truth::{GroundTruth, LinearRegression};
use crate::metrics::{ProviderParticipationResult, RequestResult, RunMetrics, unweighted_median};
use protocol::commitment::commitment_hash;
use protocol::error::ProtocolError;
use protocol::instructions::{
    advance_request, provider_accept, provider_commit, provider_reveal, register_provider,
};
use protocol::ledger::Ledger;
use protocol::params::Params;
use protocol::types::RequestStatus;
use protocol::types::{RequestId, Requester, Task};

use rand::RngExt;
use rand_chacha::ChaCha8Rng;

pub struct ScheduledAgent {
    pub agent: Agent,
    pub join_at_round: u32,
    pub initial_reputation: Option<f64>,
}

pub struct Simulation {
    task: Task,
    params: Params,
    requester: Requester,
    ledger: Ledger,
    rng: ChaCha8Rng,
    noise_rng: ChaCha8Rng,
    ground_truth: LinearRegression,
    agents: Vec<ScheduledAgent>,
}

impl Simulation {
    pub fn new(
        task: Task,
        params: Params,
        requester: Requester,
        ledger: Ledger,
        rng: ChaCha8Rng,
        noise_rng: ChaCha8Rng,
        ground_truth: LinearRegression,
        agents: Vec<ScheduledAgent>,
    ) -> Self {
        Self {
            task,
            params,
            requester,
            ledger,
            rng,
            noise_rng,
            ground_truth,
            agents,
        }
    }

    pub fn run(&mut self, iterations: u32) -> Result<RunMetrics, ProtocolError> {
        let mut metrics = RunMetrics::default();
        let mut next_request_time = 0_u64;
        for round in 0..iterations {
            for scheduled in &self.agents {
                if scheduled.join_at_round == round + 1 {
                    let address = scheduled.agent.address();
                    register_provider(&mut self.ledger, &mut self.task, address, &self.params)?;
                    if let Some(reputation) = scheduled.initial_reputation {
                        self.task.set_provider_reputation(address, reputation)?;
                    }
                }
            }
            let current_time = next_request_time;
            let input = self.ground_truth.generate_input(&mut self.rng);
            let reputations_before: Vec<_> = self
                .task
                .registered_providers()
                .iter()
                .map(|provider| (provider.address(), provider.reputation()))
                .collect();
            let mut request = protocol::instructions::create_request(
                &mut self.ledger,
                RequestId(round),
                &self.task,
                &self.requester,
                input,
                0,
                current_time,
            )?;

            for agent in self
                .agents
                .iter()
                .filter(|scheduled| scheduled.join_at_round <= round + 1)
                .map(|scheduled| &scheduled.agent)
            {
                provider_accept(
                    &mut self.ledger,
                    &self.task,
                    &mut request,
                    agent.address(),
                    &self.params,
                    current_time,
                )?;
            }
            let phase_time =
                if request.provider_participations().len() == self.task.max_providers() as usize {
                    current_time
                } else {
                    request.phase_deadline()
                };
            advance_request(
                &mut self.ledger,
                &mut self.task,
                &mut request,
                &self.params,
                phase_time,
            )?;

            let mut private_predictions = Vec::new();
            for agent in self
                .agents
                .iter_mut()
                .filter(|scheduled| scheduled.join_at_round <= round + 1)
                .map(|scheduled| &mut scheduled.agent)
            {
                let salt: [u8; 32] = self.rng.random();
                let prediction = agent.predict(request.input(), round + 1, &mut self.noise_rng);
                let commitment = commitment_hash(&request.id(), agent.address(), prediction, salt)?;
                provider_commit(
                    &mut self.ledger,
                    &mut request,
                    agent.address(),
                    commitment,
                    phase_time,
                )?;
                private_predictions.push((agent.address(), prediction, salt));
            }
            advance_request(
                &mut self.ledger,
                &mut self.task,
                &mut request,
                &self.params,
                phase_time,
            )?;
            assert_eq!(request.status(), RequestStatus::Revealing);
            for &(address, prediction, salt) in &private_predictions {
                provider_reveal(
                    &mut self.ledger,
                    &mut request,
                    address,
                    prediction,
                    salt,
                    phase_time,
                )?;
            }
            advance_request(
                &mut self.ledger,
                &mut self.task,
                &mut request,
                &self.params,
                phase_time,
            )?;
            advance_request(
                &mut self.ledger,
                &mut self.task,
                &mut request,
                &self.params,
                phase_time,
            )?;
            let aggregate = request.aggregated_prediction();
            let unweighted_median = unweighted_median(
                private_predictions
                    .iter()
                    .map(|(_, prediction, _)| *prediction),
            );
            let total_reputation: f64 = request
                .included_predictions()
                .iter()
                .map(|prediction| prediction.reputation())
                .sum();

            let truth = self.ground_truth.truth(&input);
            metrics.rounds.push(RequestResult {
                round: round + 1,
                input,
                truth,
                aggregate,
                unweighted_median,
                status: request.status(),
            });
            for participation in request.provider_participations() {
                let address = participation.address();
                let reputation_before = reputations_before
                    .iter()
                    .find(|(provider, _)| *provider == address)
                    .expect("accepted provider was registered")
                    .1;
                let after = self
                    .task
                    .registered_providers()
                    .iter()
                    .find(|provider| provider.address() == address)
                    .expect("accepted provider remains registered")
                    .reputation();
                let included = request
                    .included_predictions()
                    .iter()
                    .find(|prediction| prediction.address() == address);
                metrics.providers.push(ProviderParticipationResult {
                    round: round + 1,
                    provider_id: address.0[0],
                    prediction: participation.prediction(),
                    truth,
                    included: included.is_some(),
                    weight: included.map(|prediction| prediction.reputation() / total_reputation),
                    reputation_before,
                    reputation_after: after,
                });
            }
            next_request_time = request
                .phase_deadline()
                .checked_add(1)
                .ok_or(ProtocolError::ArithmeticError)?;
        }

        Ok(metrics)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::scenario::Scenario;
    use std::path::Path;

    #[test]
    fn unweighted_median_keeps_zero_reputation_predictions() {
        let path = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../scenarios/b_7_3_biased.toml");
        let scenario = Scenario::load(&path).unwrap();
        let metrics = scenario.build().unwrap().run(scenario.rounds).unwrap();
        let mut saw_excluded_prediction_change_the_median = false;

        for round in &metrics.rounds {
            let providers: Vec<_> = metrics
                .providers
                .iter()
                .filter(|provider| provider.round == round.round)
                .collect();
            assert_eq!(
                round.unweighted_median,
                unweighted_median(providers.iter().filter_map(|provider| provider.prediction))
            );
            if providers
                .iter()
                .any(|provider| provider.reputation_before == 0.0 && !provider.included)
                && round.unweighted_median
                    != unweighted_median(
                        providers
                            .iter()
                            .filter(|provider| provider.included)
                            .filter_map(|provider| provider.prediction),
                    )
            {
                saw_excluded_prediction_change_the_median = true;
            }
        }

        assert!(saw_excluded_prediction_change_the_median);
    }
}
