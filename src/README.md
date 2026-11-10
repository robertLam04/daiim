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
