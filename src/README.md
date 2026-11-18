# DAIIM source code

## Rust Crates

| Crate | Overview |
| --- | --- |
| [`protocol`](crates/protocol) | Library of marketplace rules for tasks, providers, inference requests, prediction aggregation, reputation, and payments. |
| [`sim`](crates/sim) | Binary that simulates provider behavior and request scenarios to evaluate the protocol. |

### Installing Rust on macOS and Linux

Install Rust and Cargo with [rustup](https://rust-lang.org/tools/install/):

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Follow the installer prompts, then open a new terminal and check the installation with `cargo --version`.

### Build and run the simulation

Run these commands from the repository root:

```sh
cd src
cargo build --workspace       # Build both crates
cargo build -p protocol       # Build only the library
cargo build -p sim            # Build only the simulator
cargo run -p sim              # Run the default scenario
cargo run -p sim -- scenarios/a_7_all_correct.toml  # Run a scenario file
cargo run -p sim -- scenarios/b_7_4_biased.toml --seed 101
cargo test --workspace        # Run the workspace tests
```

The default scenario is [`scenarios/a_7_all_correct.toml`](scenarios/a_7_all_correct.toml).
Copy it to define another provider setup. Set `name`, `seed`, and `rounds`; the `[task]`
kind (`linear_regression` is currently supported) and provider limits; the
`[task.ground_truth]` slope and intercept; and one `[[providers]]`
entry per provider with a unique numeric `id` and an `agent` definition, such as
`agent = { type = "fixed", slope = 2.01, intercept = 2.95 }`. The
`fixed` agent also accepts optional `noise = 0.5`, which adds a uniformly sampled
value between `-0.5` and `0.5` to each prediction. Its default is zero. Noise uses
the scenario seed and does not change the generated inputs. The number of provider
entries must fit the task limits. An optional `[protocol]`
section can set `reputation_adjustment_factor`, `baseline_reputation`,
`minimum_stake`, `commit_period`, and `reveal_period`; omitted values use protocol
defaults. A provider can set `initial_reputation` to start from a simulated
reputation history; this overrides the protocol baseline only when setting up
the scenario. The `improving` agent uses `slope` and `intercept` until the
one-based `improve_at_round`, then uses `improved_slope` and
`improved_intercept`. Its optional `noise` applies in both phases.
CLI overrides affect only that run; the source TOML file is unchanged.

Each round runs acceptance, commitment, reveal, and settlement. The simulator
prints a summary and writes files under
`results/<scenario name>/seed-<seed>_rounds-<rounds>_factor-<factor>/`:

- `effective_scenario.toml`: the full scenario used for the run, including CLI
  overrides and resolved protocol defaults.
- `summary.csv`: settled and cancelled counts, plus mean weighted and unweighted
  median absolute and relative errors.
- `rounds.csv`: input, truth, weighted aggregate, unweighted median, their absolute
  and relative errors, and request status.
- `providers.csv`: each provider's prediction, error against truth, aggregation
  weight, reputation before and after the round, and reputation change.
- `errors.svg`, `relative_errors.svg`, `reputations.svg`, and
  `provider_error_vs_reputation.svg`: charts of those results. `errors.svg` and
  `relative_errors.svg` compare weighted and unweighted median errors; the
  provider scatter plot includes only predictions used in settlement.

The unweighted median is a reporting comparison calculated from all successfully
revealed predictions, including those from zero-reputation providers. The weighted
aggregate uses only eligible included predictions. The unweighted calculation does
not affect settlement or reputation.

Relative error is `100 × |result − truth| / |truth|` for each median. It is blank
when that result is unavailable or ground truth is zero. Each mean excludes its
blank rounds; absolute error remains available when ground truth is zero.

The `results/` directory is ignored by Git. Different seeds, round counts, or
reputation adjustment factors have separate directories. Repeating the same
combination overwrites its report files. When comparing scenarios, use the same
seed and parameter values so provider behavior is the main change.

The [reputation feedback study](experiments/reputation_study.md) defines paired
all-correct and shared-bias scenarios and reports their initial results.

### Time source for an on-chain implementation

The POC passes `current_time` into request instructions so the simulator can use a
deterministic clock. This value is controlled by the caller and is not a safe source
for on-chain deadline checks. A Solana implementation must read the Clock sysvar
inside the program and use that time for request creation, submissions, and phase
advancement instead of accepting a timestamp from instruction data.
