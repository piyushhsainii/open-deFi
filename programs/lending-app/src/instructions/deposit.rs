use anchor_lang::{prelude::*};
use anchor_spl::{ token_2022::{transfer_checked,TransferChecked} , token_interface::{Mint, TokenAccount, TokenInterface}};

use crate::{Bank, User};

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub signer:Signer<'info>,
    #[account(
        mut,
        seeds=[b"bank",token_mint_address.key().as_ref()],
        bump
    )]
    pub bank:Account<'info,Bank>,
    #[account(
        mut,
        seeds=[b"treasure",token_mint_address.key().as_ref()],
        token::mint=token_mint_address,
        token::authority=bank,
        token::token_program = token_program_2022, 
        bump
    )]
    pub token_bank_acc:InterfaceAccount<'info,TokenAccount>,
    #[account(
        mut,
        seeds=[b"user",signer.key().as_ref()],
        bump
    )]
    pub user_lending_program_acc:Account<'info,User>,
    #[account(
        mut,
        associated_token::mint=token_mint_address,
        associated_token::authority=signer,
        associated_token::token_program=token_program_2022
    )]
    pub user_token_account:InterfaceAccount<'info,TokenAccount>,
    pub token_mint_address:InterfaceAccount<'info,Mint>,
    pub token_program: Interface<'info, TokenInterface>,
    pub token_program_2022: Interface<'info, TokenInterface>,
}

pub fn process_deposit(mut ctx:Context<Deposit>, amount:u64)->Result<()>{
    let account = &mut ctx.accounts;
    // CPI -> Transfer the user's funds into the bank's vault. 
    let ix = CpiContext::new(
        account.token_program_2022.to_account_info(),
        TransferChecked {
        from:account.user_token_account.to_account_info(),
        to:account.token_bank_acc.to_account_info(),
        authority:account.signer.to_account_info(),
        mint:account.token_mint_address.to_account_info()
    });
    transfer_checked(ix, amount, account.token_mint_address.decimals)?;

  let users_deposit_shares = if account.bank.total_deposits == 0 {
        // First deposit in the bank - user gets 1:1 shares 
        amount
    } else {
        // Calculate proportional shares: (amount * existing_shares) / existing_deposits
        amount
            .checked_mul(account.bank.total_deposit_shares)
            .unwrap()
            .checked_div(account.bank.total_deposits)
            .unwrap()
    };

    match account.token_mint_address.to_account_info().key() {
        key if key == account.user_lending_program_acc.mint_address.key() =>{
            account.user_lending_program_acc.deposited_usdc = account.user_lending_program_acc.deposited_usdc.checked_add(amount).unwrap();
            account.user_lending_program_acc.deposited_usdc_shares = account.user_lending_program_acc.deposited_usdc_shares.checked_add(users_deposit_shares).unwrap();
        },
        _ =>{
            account.user_lending_program_acc.deposited_sol = account.user_lending_program_acc.deposited_sol.checked_add(amount).unwrap();
            account.user_lending_program_acc.deposited_sol_shares = account.user_lending_program_acc.deposited_sol_shares.checked_add(users_deposit_shares).unwrap();
        }
    }
    // Handling total deposit shares
        account.bank.total_deposits = account.bank.total_deposits.checked_add(amount).unwrap();
        account.bank.total_deposit_shares = account.bank.total_deposit_shares.checked_add(users_deposit_shares).unwrap();
    Ok(())
}