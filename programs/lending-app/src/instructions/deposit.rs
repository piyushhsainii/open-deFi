use anchor_lang::{prelude::*};
use anchor_spl::{token::{transfer_checked, TransferChecked}, token_interface::{Mint, TokenAccount, TokenInterface}};

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
        bump
    )]
    pub token_bank_acc:InterfaceAccount<'info,TokenAccount>,
    #[account(
        mut,
        seeds=[b"user",token_mint_address.key().as_ref()],
        bump
    )]
    pub user_lending_program_acc:Account<'info,User>,
    pub token_mint_address:InterfaceAccount<'info,Mint>,
    pub token_program: Interface<'info, TokenInterface>,
}

pub fn process_deposit(mut ctx:Context<Deposit>, amount:u64)->Result<()>{
    let account = &mut ctx.accounts;
    // CPI -> Transfer the user's funds into the bank's vault. 
    let ix = CpiContext::new(
        account.token_program.to_account_info(),
        TransferChecked {
        from:account.user_lending_program_acc.to_account_info(),
        to:account.token_bank_acc.to_account_info(),
        authority:account.signer.to_account_info(),
        mint:account.token_mint_address.to_account_info()
    });
    transfer_checked(ix, amount, account.token_mint_address.decimals)?;

    // Handling the initial bank transfer
    // 
    if account.bank.total_deposits == 0{
        // setting bank's state
        account.bank.total_deposits = amount;
        account.bank.total_deposit_shares = amount;
    } else {

    // handle deposit ratio -- amount / total deposits --> Shows the ratio of the user's amount respective to vault
    let deposit_ratio= amount.checked_div(account.bank.total_deposits).unwrap();
    // calculating user shares -> deposit ratio x total deposit shares
    let users_deposit_shares = account.bank.total_deposit_shares.checked_mul(deposit_ratio).unwrap();

    // Handling deposit ratio
    match account.token_mint_address.to_account_info().key() {
        key if key == account.user_lending_program_acc.mint_address.key() =>{
            account.user_lending_program_acc.deposited_usdc.checked_add(amount).unwrap();
            account.user_lending_program_acc.deposited_usdc_shares.checked_add(users_deposit_shares).unwrap();
        },
        _ =>{
            account.user_lending_program_acc.deposited_sol.checked_add(amount).unwrap();
            account.user_lending_program_acc.deposited_sol_shares.checked_add(users_deposit_shares).unwrap();
        }
    }
    // Handling total deposit shares
        account.bank.total_deposits.checked_add(amount);
        account.bank.total_deposit_shares.checked_add(users_deposit_shares);
       }
    Ok(())
}