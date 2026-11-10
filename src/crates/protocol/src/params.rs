pub const MIN_REPUTATION: f64 = 0.0;
pub const MAX_REPUTATION: f64 = 100.0;

#[derive(Debug, Clone, PartialEq)]
pub struct Params {
    pub reputation_adjustment_factor: f64,
    pub slash_fraction: f32,
    pub repeat_offense_count: usize,
    pub repeat_offense_window: usize,
    pub minimum_stake: u64,
    pub baseline_reputation: u64,
    pub exit_reputation_threshold_ratio: f64,
    pub acceptance_period: u64,
    pub commit_period: u64,
    pub reveal_period: u64,
}

impl Default for Params {
    fn default() -> Self {
        Params {
            reputation_adjustment_factor: 1.0,
            slash_fraction: 0.10,
            repeat_offense_count: 3,
            repeat_offense_window: 10,
            minimum_stake: 50,
            baseline_reputation: 10,
            exit_reputation_threshold_ratio: 0.5,
            acceptance_period: 60,
            commit_period: 60,
            reveal_period: 60,
        }
    }
}

impl Params {
    pub fn exit_threshold(&self) -> f64 {
        self.baseline_reputation as f64 * self.exit_reputation_threshold_ratio
    }
}
