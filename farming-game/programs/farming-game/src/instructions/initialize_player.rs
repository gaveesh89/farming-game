use anchor_lang::prelude::*;

use crate::constants::{DEFAULT_PLAYER_FERTILITY, PLAYER_SEED, TILE_COUNT};
use crate::state::{FarmTile, PlayerAccount};

#[derive(Accounts)]
pub struct InitializePlayer<'info> {
    /// The player account PDA to be created
    #[account(
        init,
        payer = authority,
        space = PlayerAccount::SPACE,
        seeds = [PLAYER_SEED, authority.key().as_ref()],
        bump
    )]
    pub player_account: Account<'info, PlayerAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializePlayer>) -> Result<()> {
    let authority = ctx.accounts.authority.key();
    let bump = ctx.bumps.player_account;

    let mut tiles: [FarmTile; TILE_COUNT] = [FarmTile::default(); TILE_COUNT];
    for tile in tiles.iter_mut() {
        tile.crop_type = 0;
        tile.planted_at = 0;
        tile.fertility = DEFAULT_PLAYER_FERTILITY;
        tile.last_crop_type = 0;
        tile.restorative_bonus_used = false;
        tile.planted_in_season = None;
    }

    let player_account = &mut ctx.accounts.player_account;
    player_account.init(authority, bump, tiles);

    msg!("Player account initialized for: {} | Starting fertility: {}", authority, DEFAULT_PLAYER_FERTILITY);
    Ok(())
}
