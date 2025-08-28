use std::f64::consts::E;
use pyth_solana_receiver_sdk::price_update::Price;
use crate::error::ErrorCode;
use anchor_lang::prelude::*;

pub fn accrued_interest(principle_amount: u64, roi: u64, last_updated: i64) -> Result<u64> {
    let clock = Clock::get()?;
    let elapsed_time = clock.unix_timestamp - last_updated;

    let accrued_interest = (principle_amount as f64 
        * std::f64::consts::E.powf(roi as f64 * elapsed_time as f64)) as u64;

    Ok(accrued_interest)
}
/// Normalize a Pyth price into a fixed-point u128 with 6 decimals (like "micro USD").
/// Example:
///   price = 42120000, expo = -6  =>  42_120_000 (42.12 USD in micro-units)
pub fn normalize_pyth_price(price: i64, expo: i32) -> Result<u128> {
    let price_i128 = price as i128;

    // Pyth exponents are usually negative, meaning "decimal places".
    // Example: expo = -6, price = 42120000 => 42.12 USD
    if expo < 0 {
        let scale = 10_i128
            .checked_pow((-expo) as u32)
            .ok_or(ErrorCode::MathOverflow)?;
        price_i128
            .checked_div(scale)
            .ok_or(ErrorCode::MathOverflow)?
            .try_into()
            .map_err(|_| ErrorCode::MathOverflow.into())
    } else {
        // If expo is positive (rare), multiply instead.
        let scale = 10_i128
            .checked_pow(expo as u32)
            .ok_or(ErrorCode::MathOverflow)?;
        price_i128
            .checked_mul(scale)
            .ok_or(ErrorCode::MathOverflow)?
            .try_into()
            .map_err(|_| ErrorCode::MathOverflow.into())
    }
}
