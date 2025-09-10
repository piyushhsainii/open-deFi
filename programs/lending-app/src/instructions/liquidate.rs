use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{transfer_checked, TransferChecked};
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use pyth_solana_receiver_sdk::price_update::{self, get_feed_id_from_hex, PriceUpdateV2};

use crate::{normalize_pyth_price, Bank, User, MAX_AGE, SOL_USD_FEED_ID, USDC_USD_FEED_ID};
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct Liquidate<'info> {
    #[account(mut)]
    pub signer:Signer<'info>,
    pub collateral_mint:InterfaceAccount<'info,Mint>,
    pub borrowed_mint:InterfaceAccount<'info,Mint>,
    #[account(
        mut,
        seeds=[b"bank",collateral_mint.key().as_ref()],
        bump
    )]
    pub collateral_bank:Account<'info,Bank>,
    #[account(
        mut,
        token::mint=collateral_mint,
        token::authority=collateral_bank,
        seeds=[b"treasure",collateral_mint.key().as_ref()],
        bump
    )]
    pub collateral_token_bank:InterfaceAccount<'info,TokenAccount>,
    #[account(
        mut,
        seeds=[b"user",signer.key().as_ref()],
        bump
    )]
    pub user_collateral_token_account:Account<'info,User>,
     #[account(
        mut,
        seeds=[b"bank",borrowed_mint.key().as_ref()],
        bump
    )]
    pub borrowed_bank:Account<'info,Bank>,
    #[account(
        mut,
        token::mint=borrowed_mint,
        token::authority=borrowed_bank,
    )]
    pub borrowed_token_bank:InterfaceAccount<'info,TokenAccount>,
       #[account(
        mut,
        seeds=[b"user",signer.key().as_ref()],
        bump
    )]
    pub user_borrowed_token_account:Account<'info,User>,
    #[account(
        mut,
        associated_token::mint=borrowed_mint,
        associated_token::authority = signer,
        associated_token::token_program = token_program,
    )]
    pub liquidator_borrowed_token_account:InterfaceAccount<'info,TokenAccount>,
    #[account(
        init_if_needed, 
        payer = signer,
        associated_token::mint = collateral_mint, 
        associated_token::authority = signer,
        associated_token::token_program = token_program,
    )]
    pub liquidator_colleteral_token_account:InterfaceAccount<'info,TokenAccount>,
    pub price_update:Account<'info,PriceUpdateV2>,
    pub token_program:Interface<'info,TokenInterface>,
    pub system_program:Program<'info,System>,
     pub associated_token_program: Program<'info, AssociatedToken>, 
}


// 

pub fn process_liquidate(ctx:Context<Liquidate>)-> Result<()> {

    let collateral_bank = &mut ctx.accounts.collateral_bank;
    let borrowed_bank = &mut ctx.accounts.borrowed_bank;
    let user_collateral_acc = &mut ctx.accounts.user_collateral_token_account;
    let user_borrowed_acc = &mut ctx.accounts.user_borrowed_token_account;

    // Total Collateral Value
    let total_collateral:u64;
    let total_borrowed:u64;

    let deposited_usdc=  user_collateral_acc.deposited_usdc;
    let deposited_sol =  user_collateral_acc.deposited_sol;

    let borrowed_usdc=  user_borrowed_acc.borrowed_usdc;
    let borrowed_sol =  user_borrowed_acc.borrowed_sol;

    // FEED ID's
    let sol_feed_id = get_feed_id_from_hex(SOL_USD_FEED_ID)?;
    let usdc_feed_id = get_feed_id_from_hex(USDC_USD_FEED_ID)?;

    let sol_price_object = &ctx.accounts.price_update.get_price_no_older_than(&Clock::get()?, MAX_AGE, &sol_feed_id)?;
    let usdc_price_object = &ctx.accounts.price_update.get_price_no_older_than(&Clock::get()?, MAX_AGE, &usdc_feed_id)?;
   
    let sol_price = normalize_pyth_price(sol_price_object.price, sol_price_object.exponent)?;
    let usdc_price = normalize_pyth_price(usdc_price_object.price, usdc_price_object.exponent)?;
    // collateral
    let usdc_collateral = (deposited_usdc as u128).checked_mul(usdc_price).ok_or(ErrorCode::MathOverflow)?; 
    let sol_collateral = (deposited_sol as u128).checked_mul(usdc_price).ok_or(ErrorCode::MathOverflow)?; 
    // borrowed
    let usdc_borrowed = (borrowed_usdc as u128).checked_mul(sol_price).ok_or(ErrorCode::MathOverflow)?; 
    let sol_borrowed = (borrowed_sol as u128).checked_mul(sol_price).ok_or(ErrorCode::MathOverflow)?; 

    total_collateral = (usdc_collateral as u64).checked_add(sol_collateral as u64).unwrap();
    total_borrowed = (usdc_borrowed as u64).checked_add(sol_borrowed as u64).unwrap();
    // Calculating Health Factor
    let health_factor = total_collateral.checked_mul(collateral_bank.liquidation_threshold).unwrap().checked_div(total_borrowed).unwrap();

    // If acc is not healthy, throw Error.
    if health_factor >= 0{
        return Err(ErrorCode::AccountIsHealthy.into());
    }
    // Calculating Liquidation Amount 
    let liquidation_amount = total_collateral.checked_mul(borrowed_bank.close_factor).unwrap().checked_div(10000).unwrap();

    let cpi_context_instruction = CpiContext::new(
    ctx.accounts.token_program.to_account_info(), 
    TransferChecked {
       from:ctx.accounts.liquidator_borrowed_token_account.to_account_info(),
       to:ctx.accounts.borrowed_token_bank.to_account_info(),
       authority:ctx.accounts.borrowed_mint.to_account_info(),
       mint:ctx.accounts.borrowed_mint.to_account_info(),
    });
    // Transfer Liquidators money to Bank etc.
    transfer_checked(cpi_context_instruction, liquidation_amount, ctx.accounts.borrowed_mint.decimals)?;

    let mint_key = ctx.accounts.collateral_mint.key();

    let signer_seeds:&[&[&[u8]]] = &[&[
        b"bank",
        mint_key.as_ref(),
        &[ctx.bumps.collateral_bank]
    ]];
    // Calculating Liquidation Bonus and transferring it to the liquidator as an incentive.
    let liquidation_bonus = liquidation_amount.checked_mul(collateral_bank.liquidation_bonus).unwrap().checked_div(10000).unwrap();
    let liquidate_total= liquidation_amount.checked_add(liquidation_bonus).unwrap();

    let cpi_context_ix = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        TransferChecked {
            from:ctx.accounts.collateral_token_bank.to_account_info(),
            to:ctx.accounts.liquidator_colleteral_token_account.to_account_info(),
            mint:ctx.accounts.collateral_mint.to_account_info(),
            authority:collateral_bank.to_account_info(),
        },
        signer_seeds
    );
    // transferring the liquidation amount and liquidation bonus from the collateral bank.
    transfer_checked(cpi_context_ix,liquidate_total , ctx.accounts.collateral_mint.decimals)?;

    // Handles the user's state and bank's state.
    if  user_collateral_acc.mint_address.key() == collateral_bank.mint_address.key() {             // user's collateral is USDC
        // decrement user's collateral and also decrement the user's debt USDC
        // liquidator receievd the usdc incentive bonus for paying off debt
        user_collateral_acc.deposited_usdc =user_collateral_acc.deposited_usdc.checked_sub(liquidation_bonus).unwrap();
        // liquidator paid the sol amount
        user_collateral_acc.borrowed_sol = user_collateral_acc.borrowed_sol.checked_sub(liquidation_amount).unwrap();

        collateral_bank.total_deposits = collateral_bank.total_deposits.checked_sub(liquidation_bonus).unwrap();
        borrowed_bank.total_borrowed = borrowed_bank.total_borrowed.checked_sub(liquidation_amount).unwrap();

    } else {
        // decrement user's collateral and also decrement the user's debt SOL                                   // user's collateral is SOL
           user_collateral_acc.deposited_sol =  user_collateral_acc.deposited_sol.checked_sub(liquidation_bonus).unwrap();
        // liquidator paid the usdc amount
           user_collateral_acc.borrowed_usdc =  user_collateral_acc.borrowed_usdc.checked_sub(liquidation_amount).unwrap();
           collateral_bank.total_deposits =  collateral_bank.total_deposits.checked_sub(liquidation_bonus).unwrap();
           borrowed_bank.total_borrowed = borrowed_bank.total_borrowed.checked_sub(liquidation_amount).unwrap();
    }
    Ok(())
}