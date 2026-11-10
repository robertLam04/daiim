mod colluding;
mod honest;
mod learner;
mod malicious;

use protocol::types::Address;

pub struct FixedAgent {
    pub address: Address,
    pub slope: f64,
    pub intercept: f64,
}

impl FixedAgent {
    pub fn predict(&self, input: f64) -> f64 {
        self.slope * input + self.intercept
    }
}
