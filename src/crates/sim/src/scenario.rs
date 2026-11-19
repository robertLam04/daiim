use crate::agents::{Agent, FixedAgent, ImprovingAgent};
use crate::ground_truth::LinearRegression;
use crate::simulation::Simulation;
use protocol::error::ProtocolError;
use protocol::instructions::{create_task, register_provider};
use protocol::ledger::Ledger;
use protocol::params::Params;
use protocol::types::{Address, Category, EvaluationMetric, Requester, TaskId};
use rand::SeedableRng;
use rand_chacha::ChaCha8Rng;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::error::Error;
use std::io;
use std::path::Path;

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Scenario {
    pub name: String,
    pub seed: u64,
    pub rounds: u32,
    task: TaskConfig,
    providers: Vec<ProviderConfig>,
    #[serde(default)]
    protocol: ProtocolConfig,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
struct TaskConfig {
    kind: TaskKind,
    description: String,
    min_providers: u32,
    max_providers: u32,
    ground_truth: LinearModel,
}

#[derive(Debug, Clone, Copy, Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
enum TaskKind {
    LinearRegression,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
struct LinearModel {
    slope: f64,
    intercept: f64,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
struct ProviderConfig {
    id: u8,
    #[serde(default)]
    initial_reputation: Option<f64>,
    agent: AgentConfig,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum AgentConfig {
    Fixed {
        slope: f64,
        intercept: f64,
        #[serde(default)]
        noise: f64,
    },
    Improving {
        slope: f64,
        intercept: f64,
        improved_slope: f64,
        improved_intercept: f64,
        improve_at_round: u32,
        #[serde(default)]
        noise: f64,
    },
}

#[derive(Debug, Default, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
struct ProtocolConfig {
    reputation_adjustment_factor: Option<f64>,
    baseline_reputation: Option<u64>,
    minimum_stake: Option<u64>,
    commit_period: Option<u64>,
    reveal_period: Option<u64>,
}

impl Scenario {
    pub fn load(path: &Path) -> Result<Self, Box<dyn Error>> {
        let source = std::fs::read_to_string(path)?;
        Self::parse(&source).map_err(|message| {
            io::Error::new(
                io::ErrorKind::InvalidData,
                format!("{}: {message}", path.display()),
            )
            .into()
        })
    }

    fn parse(source: &str) -> Result<Self, String> {
        let scenario: Self = toml::from_str(source).map_err(|error| error.to_string())?;
        scenario.validate()?;
        Ok(scenario)
    }

    pub fn apply_run_overrides(
        &mut self,
        seed: Option<u64>,
        rounds: Option<u32>,
        reputation_adjustment_factor: Option<f64>,
    ) -> Result<(), String> {
        if let Some(seed) = seed {
            self.seed = seed;
        }
        if let Some(rounds) = rounds {
            self.rounds = rounds;
        }
        if let Some(factor) = reputation_adjustment_factor {
            self.protocol.reputation_adjustment_factor = Some(factor);
        }
        self.validate()?;

        let params = self.params();
        self.protocol = ProtocolConfig {
            reputation_adjustment_factor: Some(params.reputation_adjustment_factor),
            baseline_reputation: Some(params.baseline_reputation),
            minimum_stake: Some(params.minimum_stake),
            commit_period: Some(params.commit_period),
            reveal_period: Some(params.reveal_period),
        };
        Ok(())
    }

    pub fn reputation_adjustment_factor(&self) -> f64 {
        self.params().reputation_adjustment_factor
    }

    fn validate(&self) -> Result<(), String> {
        if self.name.is_empty()
            || !self
                .name
                .bytes()
                .all(|byte| byte.is_ascii_alphanumeric() || byte == b'_' || byte == b'-')
        {
            return Err("name must contain only letters, digits, '_' or '-'".into());
        }
        if self.rounds == 0 {
            return Err("rounds must be positive".into());
        }
        if self.task.min_providers < 2 || self.task.max_providers < self.task.min_providers {
            return Err("task requires 2 <= min_providers <= max_providers".into());
        }
        if self.providers.len() < self.task.min_providers as usize
            || self.providers.len() > self.task.max_providers as usize
        {
            return Err("provider entries must fit the task's minimum and maximum".into());
        }

        let mut ids = HashSet::new();
        for provider in &self.providers {
            if provider.id == 0 || !ids.insert(provider.id) {
                return Err("provider ids must be unique and nonzero".into());
            }
            if let Some(reputation) = provider.initial_reputation {
                if !reputation.is_finite() || !(0.0..=100.0).contains(&reputation) {
                    return Err(format!(
                        "provider {} initial_reputation must be within 0..=100",
                        provider.id
                    ));
                }
            }
            match &provider.agent {
                AgentConfig::Fixed {
                    slope,
                    intercept,
                    noise,
                } => {
                    if !slope.is_finite() || !intercept.is_finite() {
                        return Err(format!(
                            "provider {} coefficients must be finite",
                            provider.id
                        ));
                    }
                    if !noise.is_finite() || *noise < 0.0 {
                        return Err(format!(
                            "provider {} noise must be finite and nonnegative",
                            provider.id
                        ));
                    }
                }
                AgentConfig::Improving {
                    slope,
                    intercept,
                    improved_slope,
                    improved_intercept,
                    improve_at_round,
                    noise,
                } => {
                    if !slope.is_finite()
                        || !intercept.is_finite()
                        || !improved_slope.is_finite()
                        || !improved_intercept.is_finite()
                    {
                        return Err(format!(
                            "provider {} coefficients must be finite",
                            provider.id
                        ));
                    }
                    if !noise.is_finite() || *noise < 0.0 {
                        return Err(format!(
                            "provider {} noise must be finite and nonnegative",
                            provider.id
                        ));
                    }
                    if *improve_at_round == 0 || *improve_at_round > self.rounds {
                        return Err(format!(
                            "provider {} improve_at_round must be within 1..=rounds",
                            provider.id
                        ));
                    }
                }
            }
        }
        let params = self.params();
        if !params.reputation_adjustment_factor.is_finite()
            || params.reputation_adjustment_factor < 0.0
        {
            return Err("reputation_adjustment_factor must be finite and nonnegative".into());
        }
        if !(1..=100).contains(&params.baseline_reputation) {
            return Err("baseline_reputation must be within 1..=100".into());
        }
        if params.commit_period == 0 || params.reveal_period == 0 {
            return Err("commit_period and reveal_period must be positive".into());
        }
        Ok(())
    }

    fn params(&self) -> Params {
        let mut params = Params::default();
        if let Some(value) = self.protocol.reputation_adjustment_factor {
            params.reputation_adjustment_factor = value;
        }
        if let Some(value) = self.protocol.baseline_reputation {
            params.baseline_reputation = value;
        }
        if let Some(value) = self.protocol.minimum_stake {
            params.minimum_stake = value;
        }
        if let Some(value) = self.protocol.commit_period {
            params.commit_period = value;
        }
        if let Some(value) = self.protocol.reveal_period {
            params.reveal_period = value;
        }
        params
    }

    pub fn build(&self) -> Result<Simulation, ProtocolError> {
        let params = self.params();
        let mut ledger = Ledger::default();
        let requester = Requester::new(Address([0; 32]));
        let (category, evaluation_metric, ground_truth) = match self.task.kind {
            TaskKind::LinearRegression => (
                Category::Regression,
                EvaluationMetric::Accuracy,
                LinearRegression::new(
                    self.task.ground_truth.slope,
                    self.task.ground_truth.intercept,
                ),
            ),
        };
        let mut task = create_task(
            &mut ledger,
            &requester,
            TaskId(0),
            self.task.description.clone(),
            category,
            evaluation_metric,
            self.task.min_providers,
            self.task.max_providers,
        )?;
        let mut agents = Vec::with_capacity(self.providers.len());
        for provider in &self.providers {
            let address = Address([provider.id; 32]);
            register_provider(&mut ledger, &mut task, address, &params)?;
            if let Some(reputation) = provider.initial_reputation {
                task.set_provider_reputation(address, reputation)?;
            }
            let agent = match &provider.agent {
                AgentConfig::Fixed {
                    slope,
                    intercept,
                    noise,
                } => Agent::Fixed(FixedAgent::new(address, *slope, *intercept, *noise)),
                AgentConfig::Improving {
                    slope,
                    intercept,
                    improved_slope,
                    improved_intercept,
                    improve_at_round,
                    noise,
                } => Agent::Improving(ImprovingAgent::new(
                    FixedAgent::new(address, *slope, *intercept, *noise),
                    FixedAgent::new(address, *improved_slope, *improved_intercept, *noise),
                    *improve_at_round,
                )),
            };
            agents.push(agent);
        }
        Ok(Simulation::new(
            task,
            params,
            requester,
            ledger,
            ChaCha8Rng::seed_from_u64(self.seed),
            ChaCha8Rng::seed_from_u64(self.seed.wrapping_add(1)),
            ground_truth,
            agents,
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const BASELINE: &str = include_str!("../../../scenarios/a_7_all_correct.toml");

    #[test]
    fn parses_baseline_and_builds_simulation() {
        let scenario = Scenario::parse(BASELINE).unwrap();
        assert_eq!(scenario.providers.len(), 7);
        assert_eq!(scenario.rounds, 100);
        scenario.build().unwrap();
    }

    #[test]
    fn rejects_duplicate_provider_ids() {
        let duplicate = BASELINE.replace("id = 7", "id = 6");
        assert!(Scenario::parse(&duplicate).unwrap_err().contains("unique"));
    }

    #[test]
    fn rejects_provider_count_outside_task_limits() {
        let too_many = BASELINE.replace("max_providers = 7", "max_providers = 6");
        assert!(
            Scenario::parse(&too_many)
                .unwrap_err()
                .contains("provider entries")
        );
    }

    #[test]
    fn rejects_unsupported_task_kind() {
        let unsupported = BASELINE.replace("linear_regression", "classification");
        assert!(
            Scenario::parse(&unsupported)
                .unwrap_err()
                .contains("classification")
        );
    }

    #[test]
    fn rejects_unsupported_agent_type() {
        let unsupported = BASELINE.replacen("type = \"fixed\"", "type = \"learner\"", 1);
        assert!(
            Scenario::parse(&unsupported)
                .unwrap_err()
                .contains("learner")
        );
    }

    #[test]
    fn established_providers_start_with_configured_reputation() {
        let scenario = Scenario::parse(include_str!(
            "../../../scenarios/b_7_3_established_bias.toml"
        ))
        .unwrap();
        let metrics = scenario.build().unwrap().run(1).unwrap();
        assert_eq!(metrics.providers[0].reputation_before, 10.0);
        assert_eq!(metrics.providers[4].reputation_before, 20.0);
    }
}
