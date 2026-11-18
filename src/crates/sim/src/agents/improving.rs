use super::FixedAgent;
use protocol::types::Address;
use rand_chacha::ChaCha8Rng;

pub struct ImprovingAgent {
    initial: FixedAgent,
    improved: FixedAgent,
    improve_at_round: u32,
}

impl ImprovingAgent {
    pub fn new(initial: FixedAgent, improved: FixedAgent, improve_at_round: u32) -> Self {
        Self {
            initial,
            improved,
            improve_at_round,
        }
    }

    pub fn address(&self) -> Address {
        self.initial.address()
    }

    pub fn predict(&self, input: f64, round: u32, rng: &mut ChaCha8Rng) -> f64 {
        if round < self.improve_at_round {
            self.initial.predict(input, rng)
        } else {
            self.improved.predict(input, rng)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::SeedableRng;

    #[test]
    fn switches_to_improved_model_at_configured_round() {
        let address = Address([1; 32]);
        let agent = ImprovingAgent::new(
            FixedAgent::new(address, 3.0, 4.0, 0.0),
            FixedAgent::new(address, 2.0, 3.0, 0.0),
            5,
        );
        let mut rng = ChaCha8Rng::seed_from_u64(1);
        assert_eq!(agent.predict(10.0, 4, &mut rng), 34.0);
        assert_eq!(agent.predict(10.0, 5, &mut rng), 23.0);
    }
}
