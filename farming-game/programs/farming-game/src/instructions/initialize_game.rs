use anchor_lang::prelude::*;

use crate::constants::{DEFAULT_BASE_FERTILITY, DEFAULT_ROTATION_BONUS, DEFAULT_SEASON_LENGTH, GAME_CONFIG_SEED};
use crate::state::GameConfig;

#[derive(Accounts)]
pub struct InitializeGame<'info> {
    /// Global singleton config PDA
    #[account(
        init,
        payer = authority,
        space = GameConfig::SPACE,
        seeds = [GAME_CONFIG_SEED],
        bump
    )]
    pub game_config: Account<'info, GameConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeGame>) -> Result<()> {
    let game_config = &mut ctx.accounts.game_config;
    let authority = ctx.accounts.authority.key();
    let bump = ctx.bumps.game_config;

    game_config.authority = authority;
    game_config.season_length = DEFAULT_SEASON_LENGTH;
    game_config.base_fertility = DEFAULT_BASE_FERTILITY;
    game_config.rotation_bonus = DEFAULT_ROTATION_BONUS;
    game_config.config_version = 1;
    game_config.bump = bump;

    msg!("Game config initialized by {}", authority);
    Ok(())
}
