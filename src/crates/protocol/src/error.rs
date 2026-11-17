use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ProtocolError {
    AccountNotFound,
    InsufficientBalance,
    NotImplemented,
    MaxProvidersReached,
    ProviderNotRegistered,
    ProviderAlreadyRegistered,
    TaskMismatch,
    RequestAlreadyFinalized,
    DuplicatePrediction,
    InsufficientPredictions,
    InvalidPrediction,
    InvalidReputation,
    InvalidParameter,
    ArithmeticError,
    WrongPhase,
    DeadlineExpired,
    ProviderNotAccepted,
    DuplicateAcceptance,
    DuplicateCommitment,
    DuplicateReveal,
    MissingCommitment,
    CommitmentMismatch,
    InvalidTaskSettings,
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
            Self::TaskMismatch => "request belongs to a different task",
            Self::RequestAlreadyFinalized => "request has already been finalized",
            Self::DuplicatePrediction => "provider submitted more than one prediction",
            Self::InsufficientPredictions => "fewer than two eligible predictions",
            Self::InvalidPrediction => "prediction must be finite",
            Self::InvalidReputation => {
                "provider reputation must be finite and within [0, 100], and positive when included in aggregation"
            }
            Self::InvalidParameter => {
                "reputation adjustment factor must be finite and non-negative"
            }
            Self::ArithmeticError => "aggregation or reputation arithmetic failed",
            Self::WrongPhase => "action is not allowed in the current request phase",
            Self::DeadlineExpired => "request phase deadline has expired",
            Self::ProviderNotAccepted => "provider did not accept this request",
            Self::DuplicateAcceptance => "provider already accepted this request",
            Self::DuplicateCommitment => "provider already committed for this request",
            Self::DuplicateReveal => "provider already revealed for this request",
            Self::MissingCommitment => "provider has no commitment for this request",
            Self::CommitmentMismatch => "reveal does not match the stored commitment",
            Self::InvalidTaskSettings => {
                "task needs at least two providers and maximum no less than minimum"
            }
        };
        f.write_str(message)
    }
}

impl std::error::Error for ProtocolError {}
