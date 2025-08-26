use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::Bank;

#[derive(Accounts)]
pub struct InitializeBank<'info> {
    #[account(mut)]
    pub signer:Signer<'info>,
    #[account(
        init,
        payer=signer,
        space= 8 + Bank::INIT_SPACE,
        seeds=[b"bank",token_mint_address.key().as_ref()],
        bump
    )]
    pub bank:Account<'info, Bank>,
    #[account(
        init,
        payer=signer,
        token::mint=token_mint_address,
        token::authority=bank,
        seeds=[b"treasure",token_mint_address.key().as_ref()],
        bump
    )]
    pub token_bank_acc:InterfaceAccount<'info,TokenAccount>,
    pub token_mint_address:InterfaceAccount<'info,Mint>,
    pub system_program:Program<'info,System>,
    pub token_program:Interface<'info,TokenInterface>

}

pub fn process_init_bank(
    ctx: Context<InitializeBank>,
    max_ltv:u64,
    mint_address:Pubkey,
    liquidation_threshold:u64,
    liquidation_bonus:u64,
    close_factor:u64,
    interest_rate:u64

    ) -> Result<()> {
    let bank_account = &mut ctx.accounts.bank;
    bank_account.set_inner(Bank {
        authority:ctx.accounts.signer.key(),
        close_factor:close_factor,
        liquidation_threshold:liquidation_threshold,
        liquidation_bonus:liquidation_bonus,
        last_updated:0,
        max_ltv:max_ltv,
        mint_address:mint_address,
        total_deposit_shares:0,
        total_deposits:0,
        interest_rate:interest_rate,
        total_borrowed:0,
        total_borrowed_shares:0
    });
    Ok(())
}


