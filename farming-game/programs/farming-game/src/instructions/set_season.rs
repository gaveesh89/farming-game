use anchor_lang::prelude::*;

use crate::constants::SEASON_STATE_SEED;
use crate::errors::FarmingError;
use crate::state::SeasonState;

#[derive(Accounts)]
pub struct SetSeason<'info> {
    #[account(
        mut,
        seeds = [SEASON_STATE_SEED],
        bump,
        has_one = authority
    )]
    pub season_state: Account<'info, SeasonState>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<SetSeason>, new_season: u8) -> Result<()> {
    require!(new_season < 4, FarmingError::InvalidSeasonIndex);

    let season_state = &mut ctx.accounts.season_state;
    season_state.current_season = new_season;
    season_state.season_start_day = season_state.days_passed;

    msg!("Season manually set to {}", new_season);
    Ok(())
}
