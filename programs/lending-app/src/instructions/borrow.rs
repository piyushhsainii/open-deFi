
use anchor_lang::prelude::*;
use anchor_spl::{ associated_token::AssociatedToken, token_2022::{transfer_checked,TransferChecked}, token_interface::{Mint, TokenAccount, TokenInterface}};
use pyth_solana_receiver_sdk::price_update::{ get_feed_id_from_hex, FeedId, PriceUpdateV2};

use crate::{accrued_interest, normalize_pyth_price, Bank, User, MAX_AGE, SOL_USD_FEED_ID, USDC_USD_FEED_ID};
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
        token::mint=mint,
        token::authority=token_bank_acc,
        token::token_program = token_program, 
        bump
    )]
    pub token_bank_acc:InterfaceAccount<'info, TokenAccount>,
    pub price_update:Account<'info,PriceUpdateV2>,
    pub mint:InterfaceAccount<'info,Mint>,
    pub token_program:Interface<'info,TokenInterface>,
    pub associated_token_program :Program<'info,AssociatedToken>,
    pub system_program:Program<'info,System>,
}
//  1. Calculate the collateral of the user by LTV - Done
//  2. Calculate Accrued Interest of the user - Done
//  3. Calculate the real time price of the collateral asset using PYTH oracle..
//  4. Calculate borrowable amount using max_ltv and collateral realtime price.
//  5. Transfer the amount from bank to the user.

pub fn process_borrow(ctx:Context<Borrow>,amount:u64)->Result<()>{
    let bank = &mut ctx.accounts.bank;
    let user_account= &mut ctx.accounts.user_account;
    let total_collateral:u128;
    let borrowed_amount_in_usd:u128;
    let stored_amount = amount.checked_div(1000000000).unwrap();
    // Step 3 -> Real time price using pyth oracle.
    if ctx.accounts.mint.key() == user_account.mint_address.key() {
        // Calculate SOL collateral if user wants to borrow usdc
        let accrued_value = accrued_interest(user_account.deposited_sol, bank.interest_rate, bank.last_updated)?;
        let feed_id:FeedId = get_feed_id_from_hex(SOL_USD_FEED_ID)?;
        let borrowed_feed_id:FeedId = get_feed_id_from_hex(USDC_USD_FEED_ID)?;
        
        let price = ctx.accounts.price_update.get_price_no_older_than(&Clock::get()?, MAX_AGE, &feed_id)?;
        let borrowed_price = ctx.accounts.price_update.get_price_no_older_than(&Clock::get()?, MAX_AGE, &borrowed_feed_id)?;
        
        let normalised_price = normalize_pyth_price(price.price, price.exponent)?;
        let borrowed_normalised_price = normalize_pyth_price(borrowed_price.price, borrowed_price.exponent)?;

        total_collateral = (accrued_value as u128).checked_mul(normalised_price).ok_or(ErrorCode::MathOverflow)?;
        borrowed_amount_in_usd = (stored_amount as u128).checked_mul(borrowed_normalised_price).ok_or(ErrorCode::MathOverflow)?;
        
    } else {
        // Calculate USDC collateral if user wants to borrow sol
        let accrued_value = accrued_interest( user_account.deposited_usdc, bank.interest_rate, bank.last_updated)?;
        let feed_id:FeedId = get_feed_id_from_hex(USDC_USD_FEED_ID)?;
        let borrowed_feed_id:FeedId = get_feed_id_from_hex(SOL_USD_FEED_ID)?;

        let price = ctx.accounts.price_update.get_price_no_older_than(&Clock::get()?, MAX_AGE, &feed_id)?;
        let borrowed_price = ctx.accounts.price_update.get_price_no_older_than(&Clock::get()?, MAX_AGE, &borrowed_feed_id)?;

        let normalised_price = normalize_pyth_price(price.price, price.exponent)?;
        let borrowed_normalised_price = normalize_pyth_price(borrowed_price.price, price.exponent)?;
        
        total_collateral = (accrued_value as u128).checked_mul(normalised_price).ok_or(ErrorCode::MathOverflow)?;
        borrowed_amount_in_usd = (stored_amount as u128).checked_mul(borrowed_normalised_price).ok_or(ErrorCode::MathOverflow)?;

    }

    let borrowable_amount = total_collateral
        .checked_mul(bank.max_ltv as u128)
        .unwrap()
        / 10_000u128;                           // necessary to convert bps format into decimal.
  if borrowed_amount_in_usd > borrowable_amount {
       return Err(ErrorCode::OverBorrow.into());
  }
  let mint_key = ctx.accounts.mint.key();

  let signer_seeds:&[&[&[u8]]] = &[&[
       b"treasure",
        mint_key.as_ref(),
        &[ctx.bumps.token_bank_acc],
  ]];
  let cpi_context = CpiContext::new_with_signer(
     ctx.accounts.token_program.to_account_info(),
     TransferChecked {
        authority:ctx.accounts.token_bank_acc.to_account_info(),
        from:ctx.accounts.token_bank_acc.to_account_info(),
        to:ctx.accounts.user_wanted_token_account.to_account_info(),
        mint:ctx.accounts.mint.to_account_info(),
    }, 
     signer_seeds
    );
    transfer_checked(cpi_context, amount, ctx.accounts.mint.decimals)?;

    // Step 6. Updating Bank & User's state.
    let amount_in_shares = if bank.total_borrowed == 0 || bank.total_borrowed_shares == 0 {
        stored_amount // 1:1 mapping at start
    } else {
        stored_amount
        .checked_mul(bank.total_borrowed_shares)
        .ok_or(ErrorCode::MathOverflow)?
        .checked_div(bank.total_borrowed)
        .ok_or(ErrorCode::MathOverflow)?
    };
    // total borrowed shares 
    bank.total_borrowed = bank.total_borrowed.checked_add(stored_amount).unwrap();
    bank.total_borrowed_shares = bank.total_borrowed_shares.checked_add(amount_in_shares).unwrap();
    //  update the user's state
    if ctx.accounts.mint.key() == user_account.mint_address.key() {
         msg!("Updating USDC borrowed amounts");
        user_account.borrowed_usdc += stored_amount;
        user_account.borrowed_usdc_shares = amount.checked_mul(user_account.borrowed_usdc_shares).unwrap().checked_div(user_account.borrowed_usdc).unwrap();
    } else {
         msg!("Updating USDC borrowed amounts");
        user_account.borrowed_sol += stored_amount;
        user_account.borrowed_sol_shares = amount.checked_mul(user_account.borrowed_sol_shares).unwrap().checked_div(user_account.borrowed_sol).unwrap();
    }

    Ok(())
}