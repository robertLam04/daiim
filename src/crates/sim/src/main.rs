mod agents;
mod economics;
mod ground_truth;
mod metrics;
mod scenario;
mod simulation;

use crate::simulation::Simulation;
use crate::agents::FixedAgent;
use crate::ground_truth::LinearRegression;
use protocol::ledger::Ledger;
use protocol::params::Params;
use protocol::instructions::{create_task, register_provider};
use protocol::types::{TaskId, Requester, Address, Category, EvaluationMetric};

use rand::SeedableRng;
use rand_chacha::ChaCha8Rng;

fn main() {
    println!("daiim sim");

    // Initialize simulation parameters
    let params = Params::default();
    let mut ledger = Ledger::default();
    let rng = ChaCha8Rng::seed_from_u64(42);

    // TODO: Move agent setup into scenario.rs when running multiple scenarios.
    let agents = vec![
        FixedAgent { address: Address([1; 32]), slope: 2.0, intercept: 2.0 },
        FixedAgent { address: Address([2; 32]), slope: 2.0, intercept: 3.0 },
        FixedAgent { address: Address([3; 32]), slope: 10.0, intercept: 100.0 },
    ];

    // Define a task creator and requester
    let requester = Requester::new(Address([0u8; 32]));

    // Create task
    let mut task = create_task(
        &mut ledger,
        &requester,
        TaskId(0),
        "Example Task".to_string(),
        Category::Regression,
        EvaluationMetric::Accuracy,
        3,
    ).expect("Failed to create task");

    for agent in &agents {
        register_provider(&mut ledger, &mut task, agent.address, &params).expect("Failed to register provider");
    }

    let ground_truth = LinearRegression::new(2.0, 3.0);
    let mut simulation = Simulation::new(task, params, requester, ledger, rng, ground_truth, agents);
    simulation.run(15).expect("Failed to run simulation");

}
