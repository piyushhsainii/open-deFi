pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("4aWe37Q3zNvTAHw2ctkGgwHCZTbSSgpEcqvph4ve7ctg");

#[program]
pub mod lending_app {
    use super::*;

pub fn init_bank(
    ctx: Context<InitializeBank>,
    max_ltv:u64,
    mint_address:Pubkey,
    liquidation_threshold:u64,
    liquidation_bonus:u64,
    close_factor:u64,
    interest_rate:u64
) -> Result<()> {
    instructions::process_init_bank(ctx,max_ltv,mint_address,liquidation_threshold,liquidation_bonus,close_factor,interest_rate);
    Ok(())
}
pub fn init_user (ctx:Context<InitializeUser>)->Result<()> {
  instructions::process_init_user(ctx);
   Ok(())
}
pub fn deposit(ctx:Context<Deposit>, amount:u64)->Result<()>{
    instructions::process_deposit(ctx,amount);
    Ok(())
}

pub fn withdraw(ctx:Context<WithDraw>,amount:u64)-> Result<()>{
    instructions::process_withdraw(ctx, amount);
    Ok(())
}

pub fn borrow(ctx:Context<Borrow>, amount:u64)->Result<()>{
    instructions::process_borrow(ctx, amount);
    Ok(())
}

pub fn repay(ctx:Context<Repay>,amount:u64)->Result<()>{
    instructions::process_repay(ctx, amount);
    Ok(())
}

pub fn liquidate(ctx:Context<Liquidate>)->Result<()>{
    instructions::process_liquidate(ctx);
    Ok(())
    
}


}
