use std::f64::consts::E;

use anchor_lang::prelude::*;
use anchor_spl::{ associated_token::AssociatedToken, token::{transfer_checked, TransferChecked}, token_interface::{Mint, TokenAccount, TokenInterface}};

use crate::{accrued_interest, Bank, User};
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct Borrow<'info>{
    #[account(mut)]
    pub signer:Signer<'info>,
    #[account(
        init_if_needed,
        payer=signer,
        associated_token::mint=mint,
        associated_token::authority=signer,
        associated_token::token_program=token_program,
    )]
    pub user_wanted_token_account:InterfaceAccount<'info,TokenAccount>,
    #[account(
        mut,
        seeds=[b"user",signer.key().as_ref()],
        bump
    )]
    pub user_account:Account<'info,User>,
    #[account(
        mut,
        seeds=[b"bank",mint.key().as_ref()],
        bump
    )]
    pub bank:Account<'info,Bank>,
    #[account(
        mut,
        seeds=[b"treasure",mint.key().as_ref()],
        bump
    )]
    pub token_bank_acc:InterfaceAccount<'info, TokenAccount>,
    pub mint:InterfaceAccount<'info,Mint>,
    pub token_program:Interface<'info,TokenInterface>,
    pub associated_token_program :Program<'info,AssociatedToken>,
    pub system_program:Program<'info,System>,
}

//  1. Calculate the collateral of the user by LTV - Done
//  2. Calculate Accrued Interest of the user - Done
//  3. Calculate borrowable amount using max_ltv and collateral
//  4. Transfer the amount from bank to the user.

pub fn process_borrow(ctx:Context<Borrow>,amount:u64)->Result<()>{
    let bank = &mut ctx.accounts.bank;
    let user_account= &mut ctx.accounts.user_account;

    // Calculating the collateral of the user by LTV.
    // formula to calculate collateral -> Sum of all the deposited 
    let mut user_deposited_amount:u64 = 0;
    if bank.mint_address.key() == user_account.mint_address.key() {
        user_deposited_amount = user_account.deposited_usdc;
    } else {
        user_deposited_amount = user_account.deposited_sol;

    }
    // calculating accrued interest!
    let user_collateral = accrued_interest(user_deposited_amount, bank.interest_rate, bank.last_updated)?;

// Step 3 -> Calculating borrowable amount ->
    let borrowable_amount = user_collateral
        .checked_mul(bank.max_ltv as u64)
        .unwrap()
        / 10_000;                           // necessary to convert bps format into decimal.

  if amount > borrowable_amount {
       return Err(ErrorCode::OverBorrow.into());
  }
  let mint_key = ctx.accounts.mint.key();
//   Step 4 -> Transfer the funds to the user.
  let signer_seeds:&[&[&[u8]]] = &[&[
       b"treasure",
        mint_key.as_ref(),
        &[ctx.bumps.token_bank_acc],
  ]];

  let cpi_context = CpiContext::new_with_signer(
    ctx.accounts.token_program.to_account_info(),
     TransferChecked {
    authority:bank.to_account_info(),
    from:ctx.accounts.token_bank_acc.to_account_info(),
    to:ctx.accounts.user_wanted_token_account.to_account_info(),
    mint:ctx.accounts.mint.to_account_info(),
  }, 
     signer_seeds
    );

    transfer_checked(cpi_context, amount, ctx.accounts.mint.decimals)?;
    // Step 5. Updating Bank & User's state.
    bank.total_borrowed.checked_add(amount).unwrap();
   let amount_in_shares = amount
    .checked_mul(bank.total_borrowed_shares)
    .unwrap()
    .checked_div(bank.total_borrowed)
    .unwrap();
    // total borrowed shares 
    bank.total_borrowed_shares.checked_add(amount_in_shares).unwrap();

    //  update the user's state
    if bank.mint_address.key() == user_account.mint_address.key() {
        user_account.borrowed_sol = amount;
        user_account.borrowed_sol_shares = amount.checked_mul(user_account.borrowed_sol_shares).unwrap().checked_div(user_account.borrowed_sol).unwrap();
    } else {
        user_account.borrowed_usdc = amount;
        user_account.borrowed_usdc_shares = amount.checked_mul(user_account.borrowed_usdc_shares).unwrap().checked_div(user_account.borrowed_usdc).unwrap();
    }

    Ok(())
}