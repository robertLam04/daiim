use rand::RngExt;
use rand_chacha::ChaCha8Rng;

pub trait GroundTruth {
    type Input;
    type Output;

    fn generate_input(&self, rng: &mut ChaCha8Rng) -> Self::Input;
    fn truth(&self, input: &Self::Input) -> Self::Output;
}

pub struct LinearRegression {
    m: f64,
    b: f64,
}

impl LinearRegression {
    pub fn new(m: f64, b: f64) -> Self {
        Self { m, b }
    }
}

impl GroundTruth for LinearRegression {
    type Input = f64;
    type Output = f64;

    fn generate_input(&self, rng: &mut ChaCha8Rng) -> f64 {
        rng.random_range(0.0..100.0)
    }

    fn truth(&self, x: &f64) -> f64 {
        self.m * x + self.b
    }
}
