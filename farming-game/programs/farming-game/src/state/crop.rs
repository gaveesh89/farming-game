use anchor_lang::prelude::*;

use crate::errors::FarmingError;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[repr(u8)]
pub enum CropType {
    Wheat = 1,
    Tomato = 2,
    Corn = 3,
    Carrot = 4,
    Lettuce = 5,
}

impl CropType {
    pub fn get_config(&self) -> CropConfig {
        match self {
            CropType::Wheat => wheat_config(),
            CropType::Tomato => tomato_config(),
            CropType::Corn => corn_config(),
            CropType::Carrot => carrot_config(),
            CropType::Lettuce => lettuce_config(),
        }
    }
}

/// Crop configuration defining growth timing and yield decay parameters
#[derive(Clone, Debug)]
pub struct CropConfig {
    /// Time in seconds for crop to mature from planting
    pub growth_time: i64,
    /// Duration in seconds after maturity when crop is at peak yield (100% base_yield)
    pub optimal_window: i64,
    /// Maximum time in seconds from maturity before crop reaches minimum yield
    pub max_decay_time: i64,
    /// Base yield amount when harvested during optimal window
    pub base_yield: u32,
    /// Minimum yield (worst case) - yield never drops below this threshold
    pub min_yield: u32,
    /// Fertility lost on harvest
    pub fertility_cost: u8,
    /// True for nitrogen-fixing crops that restore soil
    pub is_restorative: bool,
    /// Number of visual growth stages
    pub growth_stages: u8,
    /// Which seasons crop can be planted (up to 4 seasons)
    pub valid_seasons: [u8; 4],
    pub valid_seasons_count: u8,
    /// Growth speed multiplier per season [Spring, Summer, Fall, Winter]
    pub growth_rate_modifiers: [f32; 4],
    /// Yield multiplier per season [Spring, Summer, Fall, Winter]
    pub yield_modifiers: [f32; 4],
}

impl CropConfig {
    /// Check if crop can be planted in given season
    pub fn is_valid_season(&self, season: u8) -> bool {
        for i in 0..self.valid_seasons_count as usize {
            if self.valid_seasons[i] == season {
                return true;
            }
        }
        false
    }
}

pub fn get_crop_config(crop_type: u8) -> Result<CropConfig> {
    match crop_type {
        1 => Ok(wheat_config()),
        2 => Ok(tomato_config()),
        3 => Ok(corn_config()),
        4 => Ok(carrot_config()),
        5 => Ok(lettuce_config()),
        _ => Err(FarmingError::InvalidCropType.into()),
    }
}

/// Calculate harvest yield with decay system using integer arithmetic
/// 
/// Formula:
/// - If time_since_mature <= optimal_window: yield = base_yield (100%)
/// - If optimal_window < time_since_mature <= max_decay_time: linear decay
/// - Else: yield = min_yield
///
/// Linear decay: yield = base_yield - (base_yield - min_yield) * (time_since_mature - optimal_window) / (max_decay_time - optimal_window)
pub fn calculate_harvest_yield(
    time_since_mature: i64,
    base_yield: u32,
    optimal_window: i64,
    max_decay_time: i64,
    min_yield: u32,
) -> Result<u32> {
    if time_since_mature <= optimal_window {
        return Ok(base_yield);
    }

    if time_since_mature >= max_decay_time {
        return Ok(min_yield);
    }

    let decay_window = max_decay_time.saturating_sub(optimal_window);
    require!(decay_window > 0, FarmingError::InvalidCropConfig);

    let time_into_decay = time_since_mature.saturating_sub(optimal_window);
    let yield_loss_potential = (base_yield as u64).saturating_sub(min_yield as u64);

    let yield_loss = (yield_loss_potential.saturating_mul(time_into_decay as u64))
        .saturating_div(decay_window as u64) as u32;

    let final_yield = (base_yield as u32).saturating_sub(yield_loss);

    Ok(final_yield.max(min_yield))
}

/// Calculate fertility modifier for yield (40% minimum, 100% at full fertility)
/// Returns percentage multiplier (40-100)
pub fn calculate_fertility_modifier(fertility: u8) -> u32 {
    const MIN_MODIFIER: u32 = 40;
    const MAX_MODIFIER: u32 = 100;

    let modifier = MIN_MODIFIER + ((fertility as u32) * (MAX_MODIFIER - MIN_MODIFIER)) / 100;
    modifier.min(MAX_MODIFIER)
}

/// Calculate harvest yield with both time decay AND fertility modifier
pub fn calculate_harvest_yield_with_fertility(
    time_since_mature: i64,
    base_yield: u32,
    optimal_window: i64,
    max_decay_time: i64,
    min_yield: u32,
    fertility: u8,
) -> Result<u32> {
    let time_based_yield = calculate_harvest_yield(
        time_since_mature,
        base_yield,
        optimal_window,
        max_decay_time,
        min_yield,
    )?;

    let fertility_modifier = calculate_fertility_modifier(fertility);
    let final_yield = (time_based_yield as u64)
        .saturating_mul(fertility_modifier as u64)
        .saturating_div(100) as u32;

    Ok(final_yield.max(min_yield / 2))
}

// ============= CROP CONFIGURATIONS =============

/// Wheat - Quick growing, shorter decay window
/// Growth: 30 seconds | Optimal: 20 seconds | Total: 60 seconds (FOR TESTING)
/// Base: 100 | Min: 20 (20% minimum yield)
fn wheat_config() -> CropConfig {
    CropConfig {
        growth_time: 30,
        optimal_window: 20,
        max_decay_time: 60,
        base_yield: 100,
        min_yield: 20,
        fertility_cost: 10,
        is_restorative: false,
        growth_stages: 4,
        valid_seasons: [0, 1, 3, 0],
        valid_seasons_count: 3,
        growth_rate_modifiers: [1.0, 0.8, 0.0, 1.2],
        yield_modifiers: [1.1, 0.9, 0.0, 1.0],
    }
}

/// Tomato - Medium growth, reasonable decay window
/// Growth: 45 seconds | Optimal: 30 seconds | Total: 90 seconds (FOR TESTING)
/// Base: 300 | Min: 60 (20% minimum yield)
fn tomato_config() -> CropConfig {
    CropConfig {
        growth_time: 45,
        optimal_window: 30,
        max_decay_time: 90,
        base_yield: 300,
        min_yield: 60,
        fertility_cost: 15,
        is_restorative: false,
        growth_stages: 4,
        valid_seasons: [1, 0, 0, 0],
        valid_seasons_count: 1,
        growth_rate_modifiers: [0.0, 1.0, 0.0, 0.0],
        yield_modifiers: [0.0, 1.0, 0.0, 0.0],
    }
}

/// Corn - Longer growth, extended decay window for realistic farming
/// Growth: 60 seconds | Optimal: 40 seconds | Total: 120 seconds (FOR TESTING)
/// Base: 500 | Min: 100 (20% minimum yield)
fn corn_config() -> CropConfig {
    CropConfig {
        growth_time: 60,
        optimal_window: 40,
        max_decay_time: 120,
        base_yield: 500,
        min_yield: 100,
        fertility_cost: 20,
        is_restorative: false,
        growth_stages: 4,
        valid_seasons: [1, 0, 0, 0],
        valid_seasons_count: 1,
        growth_rate_modifiers: [0.0, 1.0, 0.0, 0.0],
        yield_modifiers: [0.0, 1.0, 0.0, 0.0],
    }
}

/// Carrot - Fast growing with tight optimal window
/// Growth: 25 seconds | Optimal: 15 seconds | Total: 50 seconds (FOR TESTING)
/// Base: 150 | Min: 30 (20% minimum yield)
fn carrot_config() -> CropConfig {
    CropConfig {
        growth_time: 25,
        optimal_window: 15,
        max_decay_time: 50,
        base_yield: 150,
        min_yield: 30,
        fertility_cost: 5,
        is_restorative: true,
        growth_stages: 3,
        valid_seasons: [0, 1, 2, 3],
        valid_seasons_count: 4,
        growth_rate_modifiers: [1.0, 1.0, 1.1, 1.0],
        yield_modifiers: [1.0, 1.0, 1.0, 1.0],
    }
}

/// Lettuce - Fastest growing, quickest to decay
/// Growth: 20 seconds | Optimal: 10 seconds | Total: 40 seconds (FOR TESTING)
/// Base: 80 | Min: 16 (20% minimum yield)
fn lettuce_config() -> CropConfig {
    CropConfig {
        growth_time: 20,
        optimal_window: 10,
        max_decay_time: 40,
        base_yield: 80,
        min_yield: 16,
        fertility_cost: 5,
        is_restorative: true,
        growth_stages: 3,
        valid_seasons: [0, 1, 2, 0],
        valid_seasons_count: 3,
        growth_rate_modifiers: [1.1, 0.8, 1.0, 0.0],
        yield_modifiers: [1.0, 0.9, 1.0, 0.0],
    }
}
