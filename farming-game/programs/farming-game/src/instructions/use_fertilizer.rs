use anchor_lang::prelude::*;
use crate::errors::FarmingError;
use crate::state::PlayerAccount;
use crate::events::FertilizerApplied;

#[derive(Accounts)]
#[instruction(plot_index: u8)]
pub struct UseFertilizer<'info> {
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
}

pub fn handler(ctx: Context<UseFertilizer>, plot_index: u8) -> Result<()> {
    let player_account = &mut ctx.accounts.player_account;
    
    // Validate plot index
    if plot_index >= 25 {
        return Err(FarmingError::InvalidPlotIndex.into());
    }
    
    // Check fertilizer available
    if player_account.fertilizer_count == 0 {
        return Err(FarmingError::InsufficientFertilizer.into());
    }
    
    // Get current fertility
    let current_fertility = player_account.farm_tiles[plot_index as usize].fertility as u16;
    
    // Add 20 fertility, capped at 100
    let new_fertility = std::cmp::min(current_fertility + 20, 100) as u8;
    
    // Update plot fertility
    player_account.farm_tiles[plot_index as usize].fertility = new_fertility;
    
    // Decrement fertilizer count
    player_account.fertilizer_count = player_account.fertilizer_count.saturating_sub(1);
    
    // Emit event
    emit!(FertilizerApplied {
        player: ctx.accounts.authority.key(),
        plot_index,
        new_fertility,
    });
    
    Ok(())
}
