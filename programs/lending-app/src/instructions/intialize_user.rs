use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenInterface};

use crate::User;

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(mut)]
    pub signer:Signer<'info>,
    #[account(
        init,
        payer=signer,
        seeds=[b"user",signer.key().as_ref()],
        space= 8 + User::INIT_SPACE ,
        bump
    )]
    pub user_account:Account<'info,User>,
    pub mint_address:InterfaceAccount<'info,Mint>,
    pub system_program : Program<'info,System>,
    pub token_program: Interface<'info, TokenInterface>
}

pub fn process_init_user(ctx:Context<InitializeUser>)-> Result<()> {
    let user = &mut ctx.accounts.user_account;
    user.set_inner(User {
        borrowed_sol:0,
        borrowed_sol_shares:0,
        borrowed_usdc:0,
        borrowed_usdc_shares:0,
        deposited_sol:0,
        deposited_sol_shares:0,
        deposited_usdc:0,
        deposited_usdc_shares:0,
        health_factor:0,
        mint_address:user.mint_address
    });
    Ok(())
}