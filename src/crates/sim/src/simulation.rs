use crate::agents::HonestAgent;
use crate::ground_truth::{GroundTruth, LinearRegression};
use protocol::commitment::commitment_hash;
use protocol::error::ProtocolError;
use protocol::instructions::{advance_request, provider_accept, provider_commit, provider_reveal};
use protocol::ledger::Ledger;
use protocol::params::Params;
use protocol::types::RequestStatus;
use protocol::types::{RequestId, Requester, Task};

use rand_chacha::ChaCha8Rng;

pub struct Simulation {
    task: Task,
    params: Params,
    requester: Requester,
    ledger: Ledger,
    rng: ChaCha8Rng,
    ground_truth: LinearRegression,
    agents: Vec<HonestAgent>,
}

impl Simulation {
    pub fn new(
        task: Task,
        params: Params,
        requester: Requester,
        ledger: Ledger,
        rng: ChaCha8Rng,
        ground_truth: LinearRegression,
        agents: Vec<HonestAgent>,
    ) -> Self {
        Self {
            task,
            params,
            requester,
            ledger,
            rng,
            ground_truth,
            agents,
        }
    }

    pub fn run(&mut self, iterations: u32) -> Result<(), ProtocolError> {
        for round in 0..iterations {
            let current_time = u64::from(round) * 1_000;
            let input = self.ground_truth.generate_input(&mut self.rng);
            let mut request = protocol::instructions::create_request(
                &mut self.ledger,
                RequestId(round),
                &self.task,
                &self.requester,
                input,
                0,
                current_time,
            )?;

            for agent in &self.agents {
                provider_accept(
                    &mut self.ledger,
                    &self.task,
                    &mut request,
                    agent.address(),
                    &self.params,
                    current_time,
                )?;
            }
            advance_request(
                &mut self.ledger,
                &mut self.task,
                &mut request,
                &self.params,
                current_time,
            )?;
            assert_eq!(request.status(), RequestStatus::Committing);

            let mut private_predictions = Vec::new();
            for provider in self.task.registered_providers() {
                let agent = self
                    .agents
                    .iter()
                    .find(|agent| agent.address() == provider.address())
                    .expect("registered provider must have a simulation agent");
                let salt: [u8; 32] = rand::random();
                let prediction = agent.predict(request.input());
                let commitment = commitment_hash(&request.id(), agent.address(), prediction, salt)?;
                provider_commit(
                    &mut self.ledger,
                    &mut request,
                    agent.address(),
                    commitment,
                    current_time,
                )?;
                private_predictions.push((agent.address(), prediction, salt));
            }
            advance_request(
                &mut self.ledger,
                &mut self.task,
                &mut request,
                &self.params,
                current_time,
            )?;
            assert_eq!(request.status(), RequestStatus::Revealing);
            for (address, prediction, salt) in private_predictions {
                provider_reveal(
                    &mut self.ledger,
                    &mut request,
                    address,
                    prediction,
                    salt,
                    current_time,
                )?;
            }
            advance_request(
                &mut self.ledger,
                &mut self.task,
                &mut request,
                &self.params,
                current_time,
            )?;
            advance_request(
                &mut self.ledger,
                &mut self.task,
                &mut request,
                &self.params,
                current_time,
            )?;
            let aggregate = request
                .aggregated_prediction()
                .expect("settled request has an aggregate");
            let total_reputation: f64 = request
                .included_predictions()
                .iter()
                .map(|prediction| prediction.reputation())
                .sum();

            let truth = self.ground_truth.truth(&input);
            println!("Round {} | input {input:.2} | truth {truth:.2}", round + 1);
            for prediction in request.included_predictions() {
                let after = self
                    .task
                    .registered_providers()
                    .iter()
                    .find(|provider| provider.address() == prediction.address())
                    .expect("included provider remains registered")
                    .reputation();
                println!(
                    "  provider {}: prediction {:.2}, weight {:.3}, reputation {:.3} -> {:.3}",
                    prediction.address().0[0],
                    prediction.value(),
                    prediction.reputation() / total_reputation,
                    prediction.reputation(),
                    after,
                );
            }
            println!(
                "  weighted median {aggregate:.2} | absolute error {:.2}",
                (aggregate - truth).abs()
            );
        }

        Ok(())
    }
}
