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
cargo run -p sim              # Run the simulator
cargo test --workspace        # Run the workspace tests
```

The simulator registers three honest providers for one regression task. Each request
passes through acceptance, commitment, reveal, and settlement. Only valid reveals
are aggregated; the result and reputation changes are printed for each round.

### Time source for an on-chain implementation

The POC passes `current_time` into request instructions so the simulator can use a
deterministic clock. This value is controlled by the caller and is not a safe source
for on-chain deadline checks. A Solana implementation must read the Clock sysvar
inside the program and use that time for request creation, submissions, and phase
advancement instead of accepting a timestamp from instruction data.
