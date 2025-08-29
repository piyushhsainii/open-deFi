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
    let mint_key =ctx.accounts.mint.key();
    // Derive signer seeds for PDA authority
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"treasure",
        mint_key.as_ref(),
        &[ctx.bumps.bank_token_account],
    ]];

    // CPI transfer (SPL token withdraw)
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

    // Calculate proportional shares to remove
    let shares_to_remove = (amount as u128)
        .checked_mul(bank_account.total_deposit_shares as u128)
        .ok_or(ErrorCode::MathError)?
        .checked_div(bank_account.total_deposits as u128)
        .ok_or(ErrorCode::MathError)? as u64;

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

    Ok(())
}
