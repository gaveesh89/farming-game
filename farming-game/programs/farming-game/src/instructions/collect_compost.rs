use anchor_lang::prelude::*;
use crate::errors::FarmingError;
use crate::state::PlayerAccount;

#[derive(Accounts)]
pub struct CollectCompost<'info> {
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

pub fn handler(ctx: Context<CollectCompost>) -> Result<()> {
    let player_account = &mut ctx.accounts.player_account;
    let clock = &ctx.accounts.clock;
    let current_time = clock.unix_timestamp;
    
    // Check if player has any compost bins
    require!(player_account.compost_bin_count > 0, FarmingError::NoCraftingInProgress);
    
    // Calculate days elapsed since last collection
    let seconds_per_day = 86400i64;
    let days_elapsed = current_time.saturating_sub(player_account.last_compost_collection) / seconds_per_day;
    
    // Generate fertilizer (1 per compost bin per day)
    let fertilizer_generated = (player_account.compost_bin_count as u64)
        .saturating_mul(days_elapsed as u64) as u16;
    
    if fertilizer_generated > 0 {
        player_account.fertilizer_count = player_account.fertilizer_count.saturating_add(fertilizer_generated);
        player_account.last_compost_collection = current_time;
        
        emit!(crate::events::CompostCollected {
            player: ctx.accounts.authority.key(),
            fertilizer_gained: fertilizer_generated,
            days_elapsed: days_elapsed as u32,
        });
    }
    
    Ok(())
}
