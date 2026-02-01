use anchor_lang::prelude::*;

use crate::constants::{NUM_SEASONS, SEASON_STATE_SEED};
use crate::state::SeasonState;

#[derive(Accounts)]
pub struct AdvanceDay<'info> {
    #[account(
        mut,
        seeds = [SEASON_STATE_SEED],
        bump
    )]
    pub season_state: Account<'info, SeasonState>,
}

pub fn handler(ctx: Context<AdvanceDay>) -> Result<()> {
    let season_state = &mut ctx.accounts.season_state;

    season_state.days_passed = season_state.days_passed.saturating_add(1);

    let days_in_current_season = season_state.days_passed.saturating_sub(season_state.season_start_day);
    let season_length = season_state.season_length();

    if days_in_current_season >= season_length {
        season_state.current_season = (season_state.current_season + 1) % NUM_SEASONS;
        season_state.season_start_day = season_state.days_passed;
        msg!("Season advanced to {}", season_state.current_season);
    }

    msg!("Day advanced to {}", season_state.days_passed);
    Ok(())
}
