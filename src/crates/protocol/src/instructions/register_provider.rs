use crate::error::ProtocolError;
use crate::ledger::Ledger;
use crate::params::Params;
use crate::types::{Address, Provider, Task};

pub fn register_provider(
    ledger: &mut Ledger,
    task: &mut Task,
    address: Address,
    params: &Params,
) -> Result<(), ProtocolError> {
    if task.registered_providers().iter().any(|provider| provider.address() == address) {
        return Err(ProtocolError::ProviderAlreadyRegistered);
    }
    if task.registered_providers().len() >= task.max_providers() as usize {
        return Err(ProtocolError::MaxProvidersReached);
    }

    // TODO: Check and reserve the provider's stake in the ledger.
    let _ = ledger;
    task.add_provider(Provider::new(
        address,
        params.baseline_reputation as f64,
        params.minimum_stake,
    ));
    Ok(())
}
