use crate::types::{Address, RequestId, TaskId};
use std::collections::BTreeMap;

#[derive(Debug, Clone, Default)]
pub struct Ledger {
    accounts: BTreeMap<Address, Account>,   // per participant
    request_escrow: BTreeMap<RequestId, u64>,
    total_minted: u64,
    total_burned: u64,
}

#[derive(Debug, Clone)]
pub struct Account {
    balance: u64,
    staked: BTreeMap<TaskId, u64>
}