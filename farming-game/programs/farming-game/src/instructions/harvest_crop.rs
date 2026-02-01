use anchor_lang::prelude::*;

use crate::constants::{MIN_FERTILITY, PLAYER_SEED, SEASON_STATE_SEED, TILE_COUNT};
use crate::errors::FarmingError;
use crate::state::{calculate_harvest_yield_with_fertility, get_crop_config, PlayerAccount, SeasonState, PatternDetector, crop::CropType};
use crate::state::tools::get_water_modifier;

#[derive(Accounts)]
pub struct HarvestCrop<'info> {
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

pub fn handler(ctx: Context<HarvestCrop>, tile_index: u8) -> Result<()> {
    require!(tile_index < TILE_COUNT as u8, FarmingError::InvalidTileIndex);

    let player_account = &mut ctx.accounts.player_account;
    let tile = &player_account.farm_tiles[tile_index as usize];

    require!(tile.crop_type != 0, FarmingError::NoActiveCrop);

    let crop_type = tile.crop_type;
    let planted_at = tile.planted_at;
    let fertility = tile.fertility;
    let current_time = Clock::get()?.unix_timestamp;

    let config = get_crop_config(crop_type)?;

    let mature_at = planted_at.saturating_add(config.growth_time);
    let time_since_mature = current_time.saturating_sub(mature_at);

    require!(time_since_mature >= 0, FarmingError::CropNotMature);

    let mut yield_amount = calculate_harvest_yield_with_fertility(
        time_since_mature,
        config.base_yield,
        config.optimal_window,
        config.max_decay_time,
        config.min_yield,
        fertility,
    )?;

    let planted_season = tile.planted_in_season.unwrap_or(0);
    let season_idx = (planted_season.min(3)) as usize;
    let season_modifier = config.yield_modifiers[season_idx];
    yield_amount = ((yield_amount as f32) * season_modifier) as u32;

    // Apply water modifier based on current soil moisture level
    let water_level = player_account.water_levels[tile_index as usize];
    let water_modifier = get_water_modifier(water_level);
    yield_amount = ((yield_amount as f32) * water_modifier) as u32;

    // PATTERN DETECTION & BONUS APPLICATION
    // Convert tile_index to (row, col) coordinates
    let row = (tile_index / 5) as usize;
    let col = (tile_index % 5) as usize;

    // Detect all patterns at this position
    let detected_patterns = PatternDetector::detect_patterns(
        &player_account.farm_tiles,
        row,
        col,
        current_time,
    );

    // Calculate cumulative pattern bonus (yield bonuses stack multiplicatively)
    let mut total_yield_multiplier = 1.0f32;
    let mut total_fertility_bonus = 0u8;
    let mut total_water_bonus = 0u8;
    let mut total_resource_bonus = crate::state::synergy::ResourceBonus::default();

    // Apply each detected pattern's bonuses
    for pattern in detected_patterns.iter() {
        let bonus = pattern.get_bonus();
        // Multiply yield bonuses
        total_yield_multiplier *= bonus.yield_multiplier;
        // Add other bonuses additively
        total_fertility_bonus = total_fertility_bonus.saturating_add(bonus.fertility_bonus);
        total_water_bonus = total_water_bonus.saturating_add(bonus.water_bonus);
        total_resource_bonus.seeds = total_resource_bonus.seeds.saturating_add(bonus.resource_bonus.seeds);
        total_resource_bonus.fiber = total_resource_bonus.fiber.saturating_add(bonus.resource_bonus.fiber);
        total_resource_bonus.wood = total_resource_bonus.wood.saturating_add(bonus.resource_bonus.wood);
        total_resource_bonus.points = total_resource_bonus.points.saturating_add(bonus.resource_bonus.points);
    }

    // Check companion planting separately
    if let Some(companion_crop_type) = PatternDetector::check_companion_planting(
        &player_account.farm_tiles,
        row,
        col,
        current_time,
    ) {
        if let (Some(center), Some(neighbor)) = (
            crop_type_from_u8(crop_type),
            crop_type_from_u8(companion_crop_type),
        ) {
            if let Some(companion_bonus) = crate::state::synergy::get_companion_bonus(center, neighbor) {
                total_yield_multiplier *= companion_bonus.yield_multiplier;
                total_water_bonus = total_water_bonus.saturating_add(companion_bonus.water_bonus);
            }
        }
    }

    // Apply pattern yield multiplier to the calculated yield
    yield_amount = ((yield_amount as f32) * total_yield_multiplier) as u32;

    // Apply bonus resources to player
    player_account.seeds = player_account.seeds.saturating_add(total_resource_bonus.seeds).min(500);
    player_account.fiber = player_account.fiber.saturating_add(total_resource_bonus.fiber).min(500);
    player_account.wood = player_account.wood.saturating_add(total_resource_bonus.wood).min(999);
    player_account.coins = player_account.coins.saturating_add(total_resource_bonus.points as u64);

    player_account.coins = player_account.coins.saturating_add(yield_amount as u64);

    // Auto-grant resources based on crop type (before clearing tile)
    match crop_type {
        1 => {
            // Wheat: 1 seed + 2 fiber
            player_account.seeds = player_account.seeds.saturating_add(1).min(500);
            player_account.fiber = player_account.fiber.saturating_add(2).min(500);
        }
        2 => {
            // Tomato: 1 seed
            player_account.seeds = player_account.seeds.saturating_add(1).min(500);
        }
        3 => {
            // Corn: 2 seeds
            player_account.seeds = player_account.seeds.saturating_add(2).min(500);
        }
        4 => {
            // Carrot: 1 seed + 1 fiber
            player_account.seeds = player_account.seeds.saturating_add(1).min(500);
            player_account.fiber = player_account.fiber.saturating_add(1).min(500);
        }
        5 => {
            // Lettuce: 3 fiber
            player_account.fiber = player_account.fiber.saturating_add(3).min(500);
        }
        _ => {}
    }

    let updated_tile = &mut player_account.farm_tiles[tile_index as usize];

    if config.is_restorative {
        updated_tile.fertility = updated_tile.fertility
            .saturating_add(10)
            .saturating_sub(config.fertility_cost)
            .max(MIN_FERTILITY)
            .min(100);
        msg!("Restorative crop: fertility +10, -{}", config.fertility_cost);
    } else {
        updated_tile.fertility = updated_tile.fertility
            .saturating_sub(config.fertility_cost)
            .max(MIN_FERTILITY);
    }

    updated_tile.last_crop_type = updated_tile.crop_type;
    updated_tile.crop_type = 0;
    updated_tile.planted_at = 0;
    updated_tile.restorative_bonus_used = false;
    updated_tile.planted_in_season = None;

    msg!("Harvested {} coins from tile {} | Fertility now: {}",
        yield_amount, tile_index, updated_tile.fertility);

    // Emit pattern detection events
    for (idx, pattern) in detected_patterns.iter().enumerate() {
        let bonus = pattern.get_bonus();
        emit!(crate::events::PatternDetected {
            player: player_account.owner,
            plot_index: tile_index,
            pattern_type: *pattern,
            yield_multiplier: bonus.yield_multiplier,
            fertility_bonus: bonus.fertility_bonus,
            water_bonus: bonus.water_bonus,
        });
        msg!("Pattern {}: detected with {:.2}x yield multiplier", idx, bonus.yield_multiplier);
    }

    Ok(())
}

fn crop_type_from_u8(value: u8) -> Option<CropType> {
    match value {
        1 => Some(CropType::Wheat),
        2 => Some(CropType::Tomato),
        3 => Some(CropType::Corn),
        4 => Some(CropType::Carrot),
        5 => Some(CropType::Lettuce),
        _ => None,
    }
}
