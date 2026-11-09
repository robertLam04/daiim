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
    pub reputation_threshold: u64,
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
            reputation_threshold: 5 //Should be relative to baseline later
        }
    }
}

impl Params {
    pub fn validate(&self) -> Result<(), &'static str> {
        if !self.reputation_adjustment_factor.is_finite()
            || self.reputation_adjustment_factor <= 0.0
        {
            return Err("reputation_adjustment_factor must be finite and > 0");
        }
        if !(0.0..=1.0).contains(&self.slash_fraction) {
            return Err("slash_fraction must be between 0 and 1");
        }
        if self.repeat_offense_window == 0 {
            return Err("repeat_offense_window must be >= 1");
        }
        if self.repeat_offense_count == 0 {
            return Err("repeat_offense_count must be >= 1");
        }
        if self.repeat_offense_count > self.repeat_offense_window {
            return Err("repeat_offense_count must be <= repeat_offense_window");
        }
        Ok(())
    }
}