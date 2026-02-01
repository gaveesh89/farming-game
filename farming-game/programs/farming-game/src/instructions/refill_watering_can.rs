use anchor_lang::prelude::*;
use crate::errors::FarmingError;
use crate::state::PlayerAccount;
use crate::state::tools::ToolConfig;
use crate::events::CanRefilled;

#[derive(Accounts)]
pub struct RefillWateringCan<'info> {
    #[account(
        mut,
        seeds = [b"player", authority.key().as_ref()],
        bump = player_account.bump,
        has_one = owner @ FarmingError::InvalidPlotIndex
    )]
    pub player_account: Account<'info, PlayerAccount>,
    
    #[account(signer)]
    pub authority: Signer<'info>,
    
    pub owner: Signer<'info>,
    
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<RefillWateringCan>) -> Result<()> {
    let player_account = &mut ctx.accounts.player_account;
    let clock = &ctx.accounts.clock;
    
    let config = ToolConfig::get_config(crate::state::tools::ToolType::WateringCan);
    let refill_cost = config.cost_points;
    
    // Check player has enough points
    if player_account.coins < refill_cost as u64 {
        return Err(FarmingError::InsufficientPoints.into());
    }
    
    // Deduct points
    player_account.coins = player_account.coins.saturating_sub(refill_cost as u64);
    
    // Refill watering can to 10 uses
    player_account.watering_can_uses = 10;
    
    // Emit event
    emit!(CanRefilled {
        player: ctx.accounts.authority.key(),
        points_spent: refill_cost,
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}
