use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ProtocolError {
    AccountNotFound,
    InsufficientBalance,
    NotImplemented,
    MaxProvidersReached,
    ProviderNotRegistered,
    ProviderAlreadyRegistered,
}

impl fmt::Display for ProtocolError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let message = match self {
            Self::AccountNotFound => "account not found",
            Self::InsufficientBalance => "insufficient balance",
            Self::NotImplemented => "not implemented",
            Self::MaxProvidersReached => "maximum number of providers reached",
            Self::ProviderNotRegistered => "this provider is not registered for this task",
            Self::ProviderAlreadyRegistered => "this provider is already registered for this task",
        };
        f.write_str(message)
    }
}

impl std::error::Error for ProtocolError {}
