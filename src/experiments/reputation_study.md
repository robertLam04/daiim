# Reputation feedback scenarios

These six seven-provider scenarios illustrate how agreement-based reputation
updates interact with the reputation-weighted median. Fixed agents represent
independent noisy models or a shared faulty model or data source. The improving
agent changes its model at a specified round. None coordinate their reports.
Rewards and availability are outside this experiment.

## Scenarios

| Scenario | Provider models | Question |
| --- | --- | --- |
| [`a_7_all_correct`](../scenarios/a_7_all_correct.toml) | All use ground truth `2.0 * input + 3.0`, with noise amplitudes `0.5, 1.0, 1.5` repeated | What is the noisy baseline? |
| [`b_7_3_biased`](../scenarios/b_7_3_biased.toml) | Three use `2.1 * input + 4.0`; the other four match the baseline | Does reputation suppress a clearly biased minority? |
| [`b_7_4_biased`](../scenarios/b_7_4_biased.toml) | Four use `2.1 * input + 4.0`; the other three match the baseline | Does a wrong majority gain influence? |
| [`b_7_3_subtle_bias`](../scenarios/b_7_3_subtle_bias.toml) | Three use `2.02 * input + 3.2` with noise amplitude `0.25`; the other four match the baseline | Does a consistent, slightly wrong minority remain influential? |
| [`b_7_3_established_bias`](../scenarios/b_7_3_established_bias.toml) | Same models as the clearly biased minority, but the three biased providers start at reputation 20 while the other four start at 10 | Can an established minority control the median? |
| [`c_7_1_improving`](../scenarios/c_7_1_improving.toml) | Provider 7 uses `2.1 * input + 4.0` until round 59, then corrects to `2.0 * input + 3.0` from round 60 | Can a provider recover after improving its model? |

Every run has 100 rounds, reputation adjustment factor `0.2`, and seven
registered providers. The established-minority task requires three included
predictions; the other tasks require four. All providers attempt
every request; zero-reputation predictions are excluded. Each scenario was run
with seeds 100 through 102. Within each seed, the input sequence matches the
all-correct baseline. The subtle-bias case changes both model coefficients and
noise for the three biased providers, so its difference cannot be attributed to
one of those changes alone.
The established scenario sets starting reputations as simulation state; it does
not simulate how those reputations were earned.

The reporting-only unweighted median uses every successfully revealed
prediction, including those from zero-reputation providers. The weighted median
uses only predictions eligible for settlement.

## Findings

All 18 runs settled all 100 requests. The table reports mean absolute error
across the three seeds. Full details
are in [`reputation_summary.csv`](reputation_summary.csv). Per-round data and
graphs are in `../results/<scenario>/`.

| Scenario | Weighted error | Unweighted error | Settled / cancelled | Final share of initially biased IDs |
| --- | ---: | ---: | ---: | ---: |
| All correct | 0.184 | 0.196 | 300 / 0 | — |
| Three clearly biased | 0.294 | 0.624 | 300 / 0 | 0% |
| Four clearly biased | 5.630 | 5.152 | 300 / 0 | 100% |
| Three subtly biased | 0.520 | 0.520 | 300 / 0 | 43% |
| Three established biased | 5.589 | 0.624 | 300 / 0 | 100% |
| One improving | 0.219 | 0.242 | 300 / 0 | 0% |

The clearly biased minority lost its reputation weight by round 100. The
clearly biased majority gained all of it and retained high error; weighting
performed worse than an unweighted median in all three seeds of that case. The
subtly biased minority retained about 43% of reputation weight and more than
doubled baseline error. These outcomes
describe the tested setup, not a general provider-count guarantee.

In the established minority scenario, the biased providers begin with 60% of
reputation weight. The four accurate providers reach zero reputation around
rounds 52–54. Its three-provider minimum lets the biased group continue settling
requests; its mean weighted error is 6.016 over the final 20 rounds. In the improvement
scenario, provider 7 reaches zero around rounds 22–23. It begins making
accurate predictions at round 60, but all 41 later predictions remain excluded;
its reputation cannot recover under the current rule.

The original four cases were selected after inspecting a larger grid, including
five- and nine-provider scenarios. The two additional cases were chosen after
seeing those results. This is a focused illustration, not an independent
confirmatory test. The selected runs use separate seeds from the initial
parameter pilots, but the larger grid was inspected before pruning.
Inputs are sampled from 0 to 100. Other input distributions, unscheduled model
changes, and strategic coordination remain untested.

## Reproduce

From `src/`:

```sh
cargo build -p sim
for scenario in scenarios/[abc]_*.toml; do
  for seed in {100..102}; do
    ./target/debug/sim "$scenario" --seed "$seed"
  done
done
```

The run directories are ignored by Git. The six scenario TOMLs and aggregate
CSV are kept separately in the repository.
