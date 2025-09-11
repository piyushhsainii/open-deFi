use anchor_lang::prelude::*;
use anchor_spl::{token_2022::{transfer_checked, TransferChecked}, token_interface::{Mint, TokenAccount, TokenInterface}};

use crate::{accrued_interest, Bank, User};

#[derive(Accounts)]
pub struct Repay<'info> {
    #[account(mut)]
    pub signer:Signer<'info>,
    #[account(
        mut,
        seeds=[b"bank",repay_mint.key().as_ref()],
        bump
    )]
    pub bank:Account<'info,Bank>,
    #[account(
        mut,
        seeds=[b"treasure",repay_mint.key().as_ref()],
        token::mint=repay_mint,
        token::authority=bank,
        token::token_program = token_program, 
        bump
    )]
    pub bank_token_account:InterfaceAccount<'info,TokenAccount>,
    pub repay_mint:InterfaceAccount<'info,Mint>,
    #[account(
        mut,
        associated_token::mint=repay_mint,
        associated_token::authority=signer,
        associated_token::token_program=token_program
    )]
    pub user_token_account:InterfaceAccount<'info,TokenAccount>,
      #[account(
        mut,
        seeds=[b"user",signer.key().as_ref()],
        bump
    )]
    pub user_account:Account<'info,User>,
    pub system_program:Program<'info,System>,
    pub token_program:Interface<'info,TokenInterface>
}


pub fn process_repay(ctx:Context<Repay>, amount:u64) -> Result<()> {
    let user_account = &mut ctx.accounts.user_account;
    let bank = &mut ctx.accounts.bank;
    
    let accrued_user_borrowed_amount:u64;
    let initial_borrowed_amount:u64;
    // Updating total borrowed in bank using euler's approach
    if ctx.accounts.repay_mint.key() == user_account.mint_address.key() {      // it means user wants to pay USDC 
        accrued_user_borrowed_amount = accrued_interest(
    user_account.borrowed_usdc,bank.interest_rate, bank.last_updated
            )?;
        initial_borrowed_amount = user_account.borrowed_usdc
    } else {
        accrued_user_borrowed_amount = accrued_interest(
user_account.borrowed_sol, bank.interest_rate, bank.last_updated
        )?;
        initial_borrowed_amount = user_account.borrowed_sol;
    }
    // Updating the total borrowed amount incrementing interest
    let interest_accumulated = accrued_user_borrowed_amount.checked_sub(initial_borrowed_amount).unwrap();
    bank.total_borrowed =  bank.total_borrowed.checked_add(interest_accumulated).unwrap();

    // transferring the amount to bank from the user's token account
    let cpi_context = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
         TransferChecked {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.bank_token_account.to_account_info(),
            authority:ctx.accounts.signer.to_account_info(),
            mint:ctx.accounts.repay_mint.to_account_info()
         }
        );
    transfer_checked(cpi_context, amount, ctx.accounts.repay_mint.decimals)?;

    // calculating user shares and bank shares now-
    let value_per_share = bank.total_borrowed.checked_div(bank.total_borrowed_shares).unwrap();
    let repay_amount_in_shares = amount.checked_div(value_per_share).unwrap();

    // updating the borrow amount in user's state and bank to reflect the transfer.
    bank.total_borrowed_shares = bank.total_borrowed_shares.checked_sub(repay_amount_in_shares).unwrap();
    bank.total_borrowed = bank.total_borrowed.checked_sub(amount).unwrap();
    // Updating User's borrowed status
    if ctx.accounts.repay_mint.key() == user_account.mint_address.key() { 
        user_account.borrowed_usdc = user_account.borrowed_usdc.checked_sub(amount).unwrap();
        user_account.borrowed_usdc_shares = user_account.borrowed_usdc_shares.checked_sub(repay_amount_in_shares).unwrap();
    } else {
        user_account.borrowed_sol = user_account.borrowed_sol.checked_sub(amount).unwrap();
        user_account.borrowed_sol_shares = user_account.borrowed_sol_shares.checked_sub(repay_amount_in_shares).unwrap();
    }

    Ok(())
}

