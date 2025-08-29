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
    AccountIsHealthy
}
