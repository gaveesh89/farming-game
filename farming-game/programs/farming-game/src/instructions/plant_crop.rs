use anchor_lang::prelude::*;

use crate::constants::{DEFAULT_MIGRATED_FERTILITY, DEFAULT_ROTATION_BONUS, PLAYER_SEED, SEASON_STATE_SEED, TILE_COUNT};
use crate::errors::FarmingError;
use crate::state::{get_crop_config, PlayerAccount, SeasonState};

#[derive(Accounts)]
pub struct PlantCrop<'info> {
    #[account(
        mut,
        seeds = [PLAYER_SEED, authority.key().as_ref()],
        bump
    )]
    pub player_account: Account<'info, PlayerAccount>,

    #[account(
        seeds = [SEASON_STATE_SEED],
        bump
    )]
    pub season_state: Account<'info, SeasonState>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<PlantCrop>, tile_index: u8, crop_type: u8) -> Result<()> {
    require!(tile_index < TILE_COUNT as u8, FarmingError::InvalidTileIndex);
    require!(crop_type >= 1 && crop_type <= 5, FarmingError::InvalidCropType);

    let player_account = &mut ctx.accounts.player_account;
    let config = get_crop_config(crop_type)?;
    let current_season = ctx.accounts.season_state.current_season;

    if !config.is_valid_season(current_season) {
        return Err(FarmingError::InvalidSeasonForCrop.into());
    }

    require!(player_account.farm_tiles[tile_index as usize].crop_type == 0, FarmingError::TileNotEmpty);

    let current_time = Clock::get()?.unix_timestamp;
    
    // Check and update tile first, then update water separately to avoid borrow conflicts
    {
        let tile = &mut player_account.farm_tiles[tile_index as usize];
        
        if tile.fertility == 0 {
            tile.fertility = DEFAULT_MIGRATED_FERTILITY;
        }

        let is_rotation = tile.last_crop_type != 0 && tile.last_crop_type != crop_type;
        if is_rotation {
            tile.fertility = tile.fertility.saturating_add(DEFAULT_ROTATION_BONUS).min(100);
            msg!("Crop rotation bonus! Fertility +{}", DEFAULT_ROTATION_BONUS);
        }

        tile.crop_type = crop_type;
        tile.planted_at = current_time;
        tile.restorative_bonus_used = false;
        tile.planted_in_season = Some(current_season);
    }

    // Initialize water level for newly planted crop (70% = recently tilled soil)
    player_account.water_levels[tile_index as usize] = 70;
    player_account.last_watered[tile_index as usize] = current_time;

    msg!("Crop type {} planted on tile {} at {} | Fertility: {}",
        crop_type, tile_index, current_time, player_account.farm_tiles[tile_index as usize].fertility);
    Ok(())
}
