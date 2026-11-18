mod agents;
mod economics;
mod ground_truth;
mod metrics;
mod report;
mod scenario;
mod simulation;

use crate::scenario::Scenario;
use std::error::Error;
use std::io;
use std::path::PathBuf;

fn main() -> Result<(), Box<dyn Error>> {
    let mut args = std::env::args().skip(1).peekable();
    let scenario_path = if args.peek().is_some_and(|arg| !arg.starts_with("--")) {
        PathBuf::from(args.next().unwrap())
    } else {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../scenarios/a_7_all_correct.toml")
    };
    let mut seed = None;
    let mut rounds = None;
    let mut reputation_adjustment_factor = None;
    while let Some(flag) = args.next() {
        if flag == "--help" {
            println!(
                "Usage: sim [scenario.toml] [--seed N] [--rounds N] [--reputation-adjustment-factor F]"
            );
            return Ok(());
        }
        let value = args.next().ok_or_else(|| {
            io::Error::new(
                io::ErrorKind::InvalidInput,
                format!("missing value for {flag}"),
            )
        })?;
        match flag.as_str() {
            "--seed" => seed = Some(value.parse()?),
            "--rounds" => rounds = Some(value.parse()?),
            "--reputation-adjustment-factor" => reputation_adjustment_factor = Some(value.parse()?),
            _ => {
                return Err(io::Error::new(
                    io::ErrorKind::InvalidInput,
                    format!("unknown option: {flag}"),
                )
                .into());
            }
        }
    }

    let mut scenario = Scenario::load(&scenario_path)?;
    scenario
        .apply_run_overrides(seed, rounds, reputation_adjustment_factor)
        .map_err(|message| io::Error::new(io::ErrorKind::InvalidInput, message))?;
    let mut simulation = scenario.build()?;
    let metrics = simulation.run(scenario.rounds)?;
    let results_root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../results");
    let run_name = format!(
        "seed-{}_rounds-{}_factor-{}",
        scenario.seed,
        scenario.rounds,
        scenario.reputation_adjustment_factor()
    );
    let output_dir = report::write(&results_root.join(&scenario.name), &run_name, &metrics)?;
    std::fs::write(
        output_dir.join("effective_scenario.toml"),
        toml::to_string_pretty(&scenario)?,
    )?;
    let mean_absolute_error = metrics
        .mean_absolute_error()
        .map_or("n/a".to_string(), |value| format!("{value:.3}"));
    let mean_relative_error = metrics
        .mean_relative_error_percent()
        .map_or("n/a".to_string(), |value| format!("{value:.2}%"));

    println!(
        "{}: {} settled, {} cancelled, mean absolute error {}, mean relative error {}",
        scenario.name,
        metrics.settled_count(),
        metrics.cancelled_count(),
        mean_absolute_error,
        mean_relative_error,
    );
    println!("Results: {}", output_dir.display());
    Ok(())
}
