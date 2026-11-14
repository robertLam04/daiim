use protocol::types::Address;

/// A provider that applies its own fixed linear approximation to the task input.
/// The model can be imperfect, but it reports its computed prediction faithfully.
#[derive(Debug, Clone)]
pub struct HonestAgent {
    address: Address,
    slope: f64,
    intercept: f64,
}

impl HonestAgent {
    pub fn new(address: Address, slope: f64, intercept: f64) -> Self {
        Self {
            address,
            slope,
            intercept,
        }
    }

    pub fn address(&self) -> Address {
        self.address
    }

    pub fn predict(&self, input: f64) -> f64 {
        self.slope * input + self.intercept
    }
}
