use anchor_lang::prelude::*;

use crate::constants::{FALLOW_RESTORE_RATE, MAX_FERTILITY, PLAYER_SEED, TILE_COUNT};
use crate::errors::FarmingError;
use crate::state::PlayerAccount;

#[derive(Accounts)]
pub struct LeaveFallow<'info> {
    #[account(
        mut,
        seeds = [PLAYER_SEED, authority.key().as_ref()],
        bump
    )]
    pub player_account: Account<'info, PlayerAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<LeaveFallow>, tile_index: u8) -> Result<()> {
    require!(tile_index < TILE_COUNT as u8, FarmingError::InvalidTileIndex);

    let player_account = &mut ctx.accounts.player_account;
    let tile = &mut player_account.farm_tiles[tile_index as usize];

    require!(tile.crop_type == 0, FarmingError::TileNotEmpty);

    let current_time = Clock::get()?.unix_timestamp;
    let time_empty = current_time.saturating_sub(tile.planted_at.max(0));

    let fertility_gain = (time_empty / FALLOW_RESTORE_RATE) as u8;

    if fertility_gain > 0 {
        tile.fertility = tile.fertility.saturating_add(fertility_gain).min(MAX_FERTILITY);
        tile.planted_at = current_time;
        msg!("Fallow restored {} fertility on tile {}", fertility_gain, tile_index);
    } else {
        msg!("Not enough time passed for fallow restoration (need {} seconds)", FALLOW_RESTORE_RATE);
    }

    Ok(())
}
