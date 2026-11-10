use crate::agents::FixedAgent;
use crate::ground_truth::{GroundTruth, LinearRegression};
use protocol::error::ProtocolError;
use protocol::types::{RequestId, Requester, Task};
use protocol::params::Params;
use protocol::ledger::Ledger;

use rand_chacha::ChaCha8Rng;

pub struct Simulation {
    task: Task,
    params: Params,
    requester: Requester,
    ledger: Ledger,
    rng: ChaCha8Rng,
    ground_truth: LinearRegression,
    agents: Vec<FixedAgent>,
}

impl Simulation {
    pub fn new(task: Task, params: Params, requester: Requester, ledger: Ledger, rng: ChaCha8Rng, ground_truth: LinearRegression, agents: Vec<FixedAgent>) -> Self {
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
            let _request = protocol::instructions::create_request(
                &mut self.ledger,
                RequestId(round),
                &self.task,
                &self.requester,
                input,
                0,
            )?;

            println!("Round {}", round + 1);
            println!("Input: {input:.2}");
            let mut predictions = Vec::new();
            for provider in self.task.registered_providers() {
                let agent = self.agents.iter()
                    .find(|agent| agent.address == provider.address())
                    .expect("registered provider must have a simulation agent");
                let prediction = agent.predict(input);
                println!("Provider {} prediction: {prediction:.2}", agent.address.0[0]);
                predictions.push(prediction);
            }

            assert_eq!(predictions.len(), 3, "first milestone uses three providers");
            predictions.sort_by(f64::total_cmp);
            let aggregate = predictions[1];

            let truth = self.ground_truth.truth(&input);
            println!("Aggregate: {aggregate:.2}");
            println!("Ground truth: {truth:.2}");
            println!("Absolute error: {:.2}", (aggregate - truth).abs());
        }

        Ok(())
    }
}
