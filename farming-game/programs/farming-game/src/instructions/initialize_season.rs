use anchor_lang::prelude::*;

use crate::constants::{SEASON_STATE_SEED};
use crate::state::SeasonState;

#[derive(Accounts)]
pub struct InitializeSeason<'info> {
    /// Global season state PDA
    #[account(
        init,
        payer = authority,
        space = SeasonState::SPACE,
        seeds = [SEASON_STATE_SEED],
        bump
    )]
    pub season_state: Account<'info, SeasonState>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeSeason>) -> Result<()> {
    let season_state = &mut ctx.accounts.season_state;
    let authority = ctx.accounts.authority.key();
    let bump = ctx.bumps.season_state;

    season_state.current_season = 0; // Spring
    season_state.days_passed = 0;
    season_state.season_start_day = 0;
    season_state.authority = authority;
    season_state.bump = bump;

    msg!("Season state initialized by {}", authority);
    Ok(())
}
