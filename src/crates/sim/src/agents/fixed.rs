use protocol::types::Address;
use rand::RngExt;
use rand_chacha::ChaCha8Rng;

#[derive(Debug, Clone)]
pub struct FixedAgent {
    address: Address,
    slope: f64,
    intercept: f64,
    noise: f64,
}

impl FixedAgent {
    pub fn new(address: Address, slope: f64, intercept: f64, noise: f64) -> Self {
        Self {
            address,
            slope,
            intercept,
            noise,
        }
    }

    pub fn address(&self) -> Address {
        self.address
    }

    pub fn predict(&self, input: f64, rng: &mut ChaCha8Rng) -> f64 {
        let prediction = self.slope * input + self.intercept;
        if self.noise == 0.0 {
            prediction
        } else {
            prediction + rng.random_range(-self.noise..self.noise)
        }
    }
}
