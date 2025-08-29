use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct User {
    // SOL
   pub deposited_sol:u64,
   pub deposited_sol_shares:u64,
   pub borrowed_sol:u64,
   pub borrowed_sol_shares:u64,
   //USDC
   pub deposited_usdc:u64,
   pub deposited_usdc_shares:u64,
   pub borrowed_usdc:u64,
   pub borrowed_usdc_shares:u64,
   // USDC Mint Address     
   pub mint_address:Pubkey,
   pub health_factor:u64,
}

#[account]
#[derive(InitSpace)]
pub struct Bank {
// authority of the bank
  pub authority:Pubkey,
  pub mint_address:Pubkey,
  pub total_deposits:u64,
  pub total_deposit_shares:u64,
  pub total_borrowed:u64,
  pub total_borrowed_shares:u64,
  pub liquidation_threshold:u64,              // 10000
  pub liquidation_bonus:u64,      
  pub close_factor:u64,
  pub max_ltv:u64,
  pub interest_rate:u64,
  pub last_updated:i64,
}