# DAIIM - Decentralized Artificial Intelligence Inference Marketplace

DAIIM is a decentralized artificial itelligence inference marketplace protocol.
It provides AI predictions through a decentralized network of independent inference providers, giving them a way to earn rewards for contributions to the network. Predictions from multiple providers are combined into an aggregated result, without relying on a single central authority.

### For Task Requesters

- Define an inference task that specifies the problem they are trying to solve and the expected input and output types.
- Submit input data and pay for an inference request using daiim tokens.
- Receive a single prediction from the network.
- View request progress, payments, and settlement records through the web interface.

### For Inference Providers

- Register models for supported tasks and stake tokens to participate.
- Use your own models and computing resources to produce predictions for inference requests.
- Earn token rewards for contributions to inference requests.
- Build a reputation over repeated requests, influencing the weight of your predictions in future aggregated results.

### Why It's Different

- **Permissionless participation:** anyone can request or provide inference without approval from a central authority.
- **Multiple independent models:** combines predictions from several providers rather than relying on one provider's output.
- **Token curated registry:** the network keeps a list of high quality inference providers per task, using economic incentives.
- **Transparent settlement:** on-chain programs will control the state for marketplace activity, payments, and reward distributions - making the marketplace visible to anyone.
- **Open participation for model developers:** gives independent providers a marketplace for offering their models and earning rewards.

## Project Details

**Date of project start:** September 18, 2026.

**Team members:**

- Robert Lam
- Nathan Hum
- Aidan Lao
- Keira Laskoski

See the [source code guide](src/README.md) for building and running the POC simulator, and the [frontend guide](src/frontend/README.md) for running the requester prototype.

## Folders and Files

| Path | Contents |
| --- | --- |
| [docs/](docs/) | Project documentation, including the problem statement, development plan, requirements, design, verification and validation, and project management records. |
| [pdfs/](pdfs/) | Generated PDF versions of project documents. |
| [refs/](refs/) | Reference material and the shared bibliography. |
| [src/](src/) | Source code and development instructions. |
| [src/crates/protocol/](src/crates/protocol/) | Rust library implementing marketplace rules, aggregation, reputation, and settlement. |
| [src/crates/sim/](src/crates/sim/) | Simulator for evaluating the protocol with configurable provider scenarios. |
| [src/scenarios/](src/scenarios/) | TOML scenario definitions for simulation runs. |
| [src/experiments/](src/experiments/) | Protocol experiment plans and results analysis. |
| [src/frontend/](src/frontend/) | React requester interface prototype for walkthroughs and usability testing. |
| [test/](test/) | Top-level location reserved for test cases; Rust tests are also maintained with the source crates. |
| [site/](site/) | HTML and styles for the project documentation website. |
| [.github/](.github/) | GitHub workflows, issue templates, and documentation build scripts. |
| [Makefile](Makefile) | Rules for compiling project documents to PDF. |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidance. |
| [CodeOfConduct.md](CodeOfConduct.md) | Team code of conduct. |
| [LICENSE](LICENSE) | MIT license. |
| [resources.md](resources.md) | Supporting project resources. |

## Documentation

Project documentation is available on the project's [GitHub Pages website](https://robertlam04.github.io/daiim/).
