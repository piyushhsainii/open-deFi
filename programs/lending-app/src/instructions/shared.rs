use std::f64::consts::E;

use anchor_lang::prelude::*;

pub fn accrued_interest(principle_amount: u64, roi: u64, last_updated: i64) -> Result<u64> {
    let clock = Clock::get()?;
    let elapsed_time = clock.unix_timestamp - last_updated;

    let accrued_interest = (principle_amount as f64 
        * std::f64::consts::E.powf(roi as f64 * elapsed_time as f64)) as u64;

    Ok(accrued_interest)
}