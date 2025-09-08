use anchor_lang::prelude::*;
use anchor_spl::{token::{transfer_checked,TransferChecked}, token_interface::*};

use crate::{error::ErrorCode, Bank, User};

#[derive(Accounts)]
pub struct WithDraw<'info> {
    #[account(mut)]
    pub signer:Signer<'info>,
    #[account(
        mut,
        associated_token::mint=mint,
        associated_token::authority=signer,
        associated_token::token_program=token_program
    )]
    pub  user_token_account:InterfaceAccount<'info,TokenAccount>,
    #[account(
        mut,
        seeds=[b"user", mint.key().as_ref()],
        bump
    )]
    pub user_account:Account<'info,User>,
    #[account(
        mut,
        seeds=[b"bank",mint.key().as_ref()],
        bump
    )]
    pub  bank:Account<'info,Bank>,
    #[account(
        mut,
        seeds=[b"treasure",mint.key().as_ref()],
        bump
    )]
    pub  bank_token_account:InterfaceAccount<'info,TokenAccount>,
    pub  mint:InterfaceAccount<'info,Mint>,
    pub system_program:Program<'info,System>,
    pub token_program:Interface<'info,TokenInterface>
}

// 1. Create a transaction instruction and do a CPI transfer.
// 2. Remove the shares from the bank 
// 3. update the user and bank.


pub fn process_withdraw(ctx: Context<WithDraw>, amount: u64) -> Result<()> {
    let user_token_account = &mut ctx.accounts.user_token_account;
    let user_account = &mut ctx.accounts.user_account;
    let bank_account = &mut ctx.accounts.bank;
    let mint_key = ctx.accounts.mint.key();

    // ✅ VALIDATION 1: Check if bank has sufficient funds
    if amount > bank_account.total_deposits {
        return Err(ErrorCode::InsufficientBankFunds.into());
    }

    // ✅ VALIDATION 2: Check if bank shares exist (prevent division by zero)
    if bank_account.total_deposit_shares == 0 {
        return Err(ErrorCode::InvalidBankState.into());
    }

    // ✅ VALIDATION 3: Get user's current shares and validate ownership
    let user_current_shares = if user_account.mint_address == ctx.accounts.mint.key() {
        user_account.deposited_usdc_shares
    } else {
        user_account.deposited_sol_shares
    };

    // ✅ VALIDATION 4: Check if user has any deposits
    if user_current_shares == 0 {
        return Err(ErrorCode::NoDepositsFound.into());
    }

    // ✅ VALIDATION 5: Calculate maximum withdrawable amount based on user's shares
    let max_withdrawable = (user_current_shares as u128)
        .checked_mul(bank_account.total_deposits as u128)
        .ok_or(ErrorCode::MathError)?
        .checked_div(bank_account.total_deposit_shares as u128)
        .ok_or(ErrorCode::MathError)? as u64;

    // ✅ VALIDATION 6: Ensure withdrawal amount doesn't exceed user's entitlement
    if amount > max_withdrawable {
        return Err(ErrorCode::ExceedsMaxWithdrawal.into());
    }

    // ✅ VALIDATION 7: Check minimum withdrawal amount (optional, adjust as needed)
    if amount == 0 {
        return Err(ErrorCode::InvalidWithdrawalAmount.into());
    }

    // Calculate proportional shares to remove
    let shares_to_remove = (amount as u128)
        .checked_mul(bank_account.total_deposit_shares as u128)
        .ok_or(ErrorCode::MathError)?
        .checked_div(bank_account.total_deposits as u128)
        .ok_or(ErrorCode::MathError)? as u64;

    // ✅ VALIDATION 8: Double-check shares calculation
    if shares_to_remove > user_current_shares {
        return Err(ErrorCode::InsufficientShares.into());
    }

    // ✅ VALIDATION 9: Check user's token balance for the specific token type
    let (user_current_amount, user_current_share_balance) = if user_account.mint_address == ctx.accounts.mint.key() {
        (user_account.deposited_usdc, user_account.deposited_usdc_shares)
    } else {
        (user_account.deposited_sol, user_account.deposited_sol_shares)
    };

    if amount > user_current_amount {
        return Err(ErrorCode::InsufficientUserBalance.into());
    }

    // Derive signer seeds for PDA authority
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"treasure",
        mint_key.as_ref(),
        &[ctx.bumps.bank_token_account],
    ]];

    // ✅ SECURE TRANSFER: CPI transfer (SPL token withdraw)
    let cpi_context = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        TransferChecked {
            from: ctx.accounts.bank_token_account.to_account_info(),
            to: user_token_account.to_account_info(),
            authority: ctx.accounts.bank_token_account.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
        },
        signer_seeds,
    );

    transfer_checked(cpi_context, amount, ctx.accounts.mint.decimals)?;

    // ✅ SECURE STATE UPDATES: Only update state after successful transfer
    
    // Update Bank totals
    bank_account.total_deposits = bank_account
        .total_deposits
        .checked_sub(amount)
        .ok_or(ErrorCode::MathError)?;
    bank_account.total_deposit_shares = bank_account
        .total_deposit_shares
        .checked_sub(shares_to_remove)
        .ok_or(ErrorCode::MathError)?;

    // Update User balances
    if user_account.mint_address == ctx.accounts.mint.key() {
        // Updating USDC Balances
        user_account.deposited_usdc = user_account
            .deposited_usdc
            .checked_sub(amount)
            .ok_or(ErrorCode::MathError)?;
        user_account.deposited_usdc_shares = user_account
            .deposited_usdc_shares
            .checked_sub(shares_to_remove)
            .ok_or(ErrorCode::MathError)?;
    } else {
        // Updating SOL Balances
        user_account.deposited_sol = user_account
            .deposited_sol
            .checked_sub(amount)
            .ok_or(ErrorCode::MathError)?;
        user_account.deposited_sol_shares = user_account
            .deposited_sol_shares
            .checked_sub(shares_to_remove)
            .ok_or(ErrorCode::MathError)?;
    }

    // ✅ OPTIONAL: Emit withdrawal event for tracking
    msg!(
        "Withdrawal completed: User: {}, Amount: {}, Shares removed: {}, Max withdrawable was: {}",
        ctx.accounts.signer.key(),
        amount,
        shares_to_remove,
        max_withdrawable
    );

    Ok(())
}

// ✅ ADD THESE ERROR CODES TO YOUR ERROR ENUM:
/*
#[error_code]
pub enum ErrorCode {
    #[msg("Math operation failed")]
    MathError,
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
*/