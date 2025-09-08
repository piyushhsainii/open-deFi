use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Custom error message")]
    CustomError,
    #[msg("Underflow, Overflow error")]
    MathError,
    #[msg("Cannot Overborrow")]
    OverBorrow,
    #[msg("Variable Overflowed!")]
    MathOverflow,
    #[msg("Account is not healthy!")]
    AccountIsHealthy,
    #[msg("Insufficient funds in bank")]
    InsufficientBankFunds,
    #[msg("Invalid bank state - no shares exist")]
    InvalidBankState,
    #[msg("No deposits found for this user")]
    NoDepositsFound,
    #[msg("Withdrawal amount exceeds maximum withdrawable")]
    ExceedsMaxWithdrawal,
    #[msg("Invalid withdrawal amount")]
    InvalidWithdrawalAmount,
    #[msg("Insufficient shares for withdrawal")]
    InsufficientShares,
    #[msg("Insufficient user balance")]
    InsufficientUserBalance,
}
