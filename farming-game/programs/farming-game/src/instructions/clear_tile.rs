use anchor_lang::prelude::*;

use crate::constants::{PLAYER_SEED, TILE_COUNT};
use crate::errors::FarmingError;
use crate::state::PlayerAccount;

#[derive(Accounts)]
pub struct ClearTile<'info> {
    #[account(
        mut,
        seeds = [PLAYER_SEED, authority.key().as_ref()],
        bump
    )]
    pub player_account: Account<'info, PlayerAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<ClearTile>, tile_index: u8) -> Result<()> {
    require!(tile_index < TILE_COUNT as u8, FarmingError::InvalidTileIndex);

    let player_account = &mut ctx.accounts.player_account;
    let tile = &mut player_account.farm_tiles[tile_index as usize];

    tile.crop_type = 0;
    tile.planted_at = 0;
    tile.restorative_bonus_used = false;
    tile.planted_in_season = None;

    msg!("Tile {} cleared", tile_index);
    Ok(())
}
