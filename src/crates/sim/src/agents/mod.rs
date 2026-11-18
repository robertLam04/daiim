mod fixed;
mod improving;
mod learner;

pub use fixed::FixedAgent;
pub use improving::ImprovingAgent;
use protocol::types::Address;
use rand_chacha::ChaCha8Rng;

pub enum Agent {
    Fixed(FixedAgent),
    Improving(ImprovingAgent),
}

impl Agent {
    pub fn address(&self) -> Address {
        match self {
            Self::Fixed(agent) => agent.address(),
            Self::Improving(agent) => agent.address(),
        }
    }

    pub fn predict(&mut self, input: f64, round: u32, rng: &mut ChaCha8Rng) -> f64 {
        match self {
            Self::Fixed(agent) => agent.predict(input, rng),
            Self::Improving(agent) => agent.predict(input, round, rng),
        }
    }
}
