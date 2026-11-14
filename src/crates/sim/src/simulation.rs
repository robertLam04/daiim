use crate::agents::HonestAgent;
use crate::ground_truth::{GroundTruth, LinearRegression};
use protocol::error::ProtocolError;
use protocol::ledger::Ledger;
use protocol::params::Params;
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
            let input = self.ground_truth.generate_input(&mut self.rng);
            let mut request = protocol::instructions::create_request(
                &mut self.ledger,
                RequestId(round),
                &self.task,
                &self.requester,
                input,
                0,
            )?;

            let mut predictions = Vec::new();
            for provider in self.task.registered_providers() {
                let agent = self
                    .agents
                    .iter()
                    .find(|agent| agent.address() == provider.address())
                    .expect("registered provider must have a simulation agent");
                predictions.push((agent.address(), agent.predict(input)));
            }

            protocol::instructions::settle_request(
                &mut self.ledger,
                &mut self.task,
                &mut request,
                &self.params,
                &predictions,
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
