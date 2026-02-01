use anchor_lang::prelude::*;
use crate::errors::FarmingError;
use crate::state::PlayerAccount;
use crate::state::tools::{ToolType, ToolConfig};
use crate::events::ToolPurchased;

#[derive(Accounts)]
#[instruction(tool_type: u8, quantity: u16)]
pub struct BuyTool<'info> {
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

pub fn handler(ctx: Context<BuyTool>, tool_type: u8, quantity: u16) -> Result<()> {
    let player_account = &mut ctx.accounts.player_account;
    let clock = &ctx.accounts.clock;
    
    // Parse tool type
    let tool = ToolType::from_u8(tool_type).ok_or(FarmingError::InvalidCropType)?;
    let config = ToolConfig::get_config(tool);
    
    // Calculate total cost
    let total_cost = (config.cost_points as u64) * (quantity as u64);
    
    // Check player has enough points
    if player_account.coins < total_cost {
        return Err(FarmingError::InsufficientPoints.into());
    }
    
    // Deduct points
    player_account.coins = player_account.coins.saturating_sub(total_cost);
    
    // Add tools to inventory
    match tool {
        ToolType::WateringCan => {
            // Watering cans are not stackable (single item with uses)
            player_account.watering_can_uses = 10;
        }
        ToolType::Fertilizer => {
            player_account.fertilizer_count = player_account.fertilizer_count.saturating_add(quantity);
        }
        ToolType::PremiumSeeds => {
            player_account.premium_seeds = player_account.premium_seeds.saturating_add(quantity);
        }
    }
    
    // Emit event
    emit!(ToolPurchased {
        player: ctx.accounts.authority.key(),
        tool_type,
        quantity,
        points_spent: total_cost as u32,
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}
