use anchor_lang::prelude::*;
use crate::errors::FarmingError;
use crate::state::PlayerAccount;
use crate::events::WaterApplied;

#[derive(Accounts)]
#[instruction(plot_index: u8)]
pub struct WaterTile<'info> {
    #[account(
        mut,
        seeds = [b"player", authority.key().as_ref()],
        bump = player_account.bump,
        has_one = owner @ FarmingError::InvalidTileIndex
    )]
    pub player_account: Account<'info, PlayerAccount>,
    
    #[account(signer)]
    pub authority: Signer<'info>,
    
    pub owner: Signer<'info>,
    
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<WaterTile>, plot_index: u8) -> Result<()> {
    let player_account = &mut ctx.accounts.player_account;
    let clock = &ctx.accounts.clock;
    
    // Validate plot index
    if plot_index >= 25 {
        return Err(FarmingError::InvalidPlotIndex.into());
    }
    
    // Check watering can uses available
    if player_account.watering_can_uses == 0 {
        return Err(FarmingError::InsufficientToolUses.into());
    }
    
    let current_timestamp = clock.unix_timestamp;
    
    // Check if plot was watered less than 1 hour ago
    let last_watered_time = player_account.last_watered[plot_index as usize];
    if last_watered_time > 0 && current_timestamp - last_watered_time < 3600 {
        return Err(FarmingError::WateringTooFrequent.into());
    }
    
    // Get current water level
    let current_water = player_account.water_levels[plot_index as usize] as u16;
    
    // Add 50 water, capped at 100
    let new_water_level = std::cmp::min(current_water + 50, 100) as u8;
    
    // Update water levels
    player_account.water_levels[plot_index as usize] = new_water_level;
    player_account.last_watered[plot_index as usize] = current_timestamp;
    
    // Decrement watering can uses
    player_account.watering_can_uses = player_account.watering_can_uses.saturating_sub(1);
    
    // Emit event
    emit!(WaterApplied {
        player: ctx.accounts.authority.key(),
        plot_index,
        new_water_level,
        timestamp: current_timestamp,
    });
    
    Ok(())
}
