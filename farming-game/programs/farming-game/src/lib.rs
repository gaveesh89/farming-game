use anchor_lang::prelude::*;

declare_id!("7nktNDR2jguCMTya6kXUw7WLEV3s7E69mknQKp1yCrAQ");

// Constants
pub const TILE_COUNT: usize = 25;

#[program]
pub mod farming_game {
    use super::*;

    /// Initialize a new player account (PDA)
    pub fn initialize_player(ctx: Context<InitializePlayer>) -> Result<()> {
        let player_account = &mut ctx.accounts.player_account;

        // Set the owner to the signer's pubkey
        player_account.owner = ctx.accounts.signer.key();

        // Initialize coins to 0
        player_account.coins = 0;

        // Initialize all 25 farm tiles to empty state (crop_type=0, planted_at=0)
        player_account.farm_tiles = [FarmTile::default(); TILE_COUNT];

        msg!("Player account initialized for: {}", player_account.owner);
        Ok(())
    }

    /// Plant a crop on a specific tile
    pub fn plant_crop(ctx: Context<PlantCrop>, tile_index: u8, crop_type: u8) -> Result<()> {
        require!(tile_index < TILE_COUNT as u8, FarmingError::InvalidTileIndex);
        require!(crop_type >= 1 && crop_type <= 5, FarmingError::InvalidCropType);

        let player_account = &mut ctx.accounts.player_account;
        
        // Get the crop config to validate it exists
        let _config = get_crop_config(crop_type)?;

        let tile = &mut player_account.farm_tiles[tile_index as usize];
        
        // Check if tile is empty
        require!(tile.crop_type == 0, FarmingError::TileNotEmpty);

        // Get current timestamp
        let current_time = Clock::get()?.unix_timestamp;

        // Plant the crop
        tile.crop_type = crop_type;
        tile.planted_at = current_time;

        msg!("Crop type {} planted on tile {} at {}", crop_type, tile_index, current_time);
        Ok(())
    }

    /// Harvest a crop from a specific tile with decay-based yield
    pub fn harvest_crop(ctx: Context<HarvestCrop>, tile_index: u8) -> Result<()> {
        require!(tile_index < TILE_COUNT as u8, FarmingError::InvalidTileIndex);

        let player_account = &mut ctx.accounts.player_account;
        let tile = &player_account.farm_tiles[tile_index as usize];

        // Check if tile has a crop
        require!(tile.crop_type != 0, FarmingError::NoActiveCrop);

        let crop_type = tile.crop_type;
        let planted_at = tile.planted_at;
        let current_time = Clock::get()?.unix_timestamp;

        // Get crop config
        let config = get_crop_config(crop_type)?;

        // Calculate if crop is mature
        let mature_at = planted_at.saturating_add(config.growth_time);
        let time_since_mature = current_time.saturating_sub(mature_at);

        // Must be mature to harvest (time_since_mature >= 0)
        require!(time_since_mature >= 0, FarmingError::CropNotMature);

        // Calculate yield with decay
        let yield_amount = calculate_harvest_yield(
            time_since_mature,
            config.base_yield,
            config.optimal_window,
            config.max_decay_time,
            config.min_yield,
        )?;

        // Add coins to player account
        player_account.coins = player_account.coins.saturating_add(yield_amount as u64);

        // Clear the tile
        let cleared_tile = &mut player_account.farm_tiles[tile_index as usize];
        cleared_tile.crop_type = 0;
        cleared_tile.planted_at = 0;

        msg!("Crop type {} harvested from tile {} with yield {}", crop_type, tile_index, yield_amount);
        Ok(())
    }

    /// Clear a tile to allow replanting
    pub fn clear_tile(ctx: Context<ClearTile>, tile_index: u8) -> Result<()> {
        require!(tile_index < TILE_COUNT as u8, FarmingError::InvalidTileIndex);

        let player_account = &mut ctx.accounts.player_account;
        let tile = &mut player_account.farm_tiles[tile_index as usize];

        tile.crop_type = 0;
        tile.planted_at = 0;

        msg!("Tile {} cleared", tile_index);
        Ok(())
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
fn calculate_harvest_yield(
    time_since_mature: i64,
    base_yield: u32,
    optimal_window: i64,
    max_decay_time: i64,
    min_yield: u32,
) -> Result<u32> {
    // Crop is still in optimal harvest window
    if time_since_mature <= optimal_window {
        return Ok(base_yield);
    }

    // Crop has completely decayed
    if time_since_mature >= max_decay_time {
        return Ok(min_yield);
    }

    // Linear decay calculation using integer math to avoid floating point precision issues
    // decay_ratio = (time_since_mature - optimal_window) / (max_decay_time - optimal_window)
    // yield = base_yield - (base_yield - min_yield) * decay_ratio
    
    let decay_window = max_decay_time.saturating_sub(optimal_window);
    require!(decay_window > 0, FarmingError::InvalidCropConfig);

    let time_into_decay = time_since_mature.saturating_sub(optimal_window);
    let yield_loss_potential = (base_yield as u64).saturating_sub(min_yield as u64);

    // Multiply first to maintain precision, then divide
    // This prevents underflow and maintains accuracy
    let yield_loss = (yield_loss_potential.saturating_mul(time_into_decay as u64))
        .saturating_div(decay_window as u64) as u32;

    let final_yield = (base_yield as u32).saturating_sub(yield_loss);

    // Ensure we never go below minimum yield (safety check)
    Ok(final_yield.max(min_yield))
}

/// Get crop configuration by crop type
fn get_crop_config(crop_type: u8) -> Result<CropConfig> {
    match crop_type {
        1 => Ok(WHEAT_CONFIG),
        2 => Ok(TOMATO_CONFIG),
        3 => Ok(CORN_CONFIG),
        4 => Ok(CARROT_CONFIG),
        5 => Ok(LETTUCE_CONFIG),
        _ => Err(FarmingError::InvalidCropType.into()),
    }
}

// ============= CROP CONFIGURATIONS =============

/// Wheat - Quick growing, shorter decay window
/// Growth: 30 seconds | Optimal: 20 seconds | Total: 60 seconds (FOR TESTING)
/// Base: 100 | Min: 20 (20% minimum yield)
const WHEAT_CONFIG: CropConfig = CropConfig {
    growth_time: 30,            // 30 seconds to mature (FOR TESTING)
    optimal_window: 20,         // 20 second perfect harvest
    max_decay_time: 60,         // 60 seconds total before min yield
    base_yield: 100,
    min_yield: 20,              // 20% of base
};

/// Tomato - Medium growth, reasonable decay window
/// Growth: 45 seconds | Optimal: 30 seconds | Total: 90 seconds (FOR TESTING)
/// Base: 300 | Min: 60 (20% minimum yield)
const TOMATO_CONFIG: CropConfig = CropConfig {
    growth_time: 45,            // 45 seconds to mature (FOR TESTING)
    optimal_window: 30,         // 30 second perfect window
    max_decay_time: 90,         // 90 seconds total before min yield
    base_yield: 300,
    min_yield: 60,              // 20% of base
};

/// Corn - Longer growth, extended decay window for realistic farming
/// Growth: 60 seconds | Optimal: 40 seconds | Total: 120 seconds (FOR TESTING)
/// Base: 500 | Min: 100 (20% minimum yield)
const CORN_CONFIG: CropConfig = CropConfig {
    growth_time: 60,            // 60 seconds to mature (FOR TESTING)
    optimal_window: 40,         // 40 second perfect window
    max_decay_time: 120,        // 120 seconds total before min yield
    base_yield: 500,
    min_yield: 100,             // 20% of base
};

/// Carrot - Fast growing with tight optimal window
/// Growth: 25 seconds | Optimal: 15 seconds | Total: 50 seconds (FOR TESTING)
/// Base: 150 | Min: 30 (20% minimum yield)
const CARROT_CONFIG: CropConfig = CropConfig {
    growth_time: 25,            // 25 seconds to mature (FOR TESTING)
    optimal_window: 15,         // 15 second perfect window
    max_decay_time: 50,         // 50 seconds total before min yield
    base_yield: 150,
    min_yield: 30,              // 20% of base
};

/// Lettuce - Fastest growing, quickest to decay
/// Growth: 20 seconds | Optimal: 10 seconds | Total: 40 seconds (FOR TESTING)
/// Base: 80 | Min: 16 (20% minimum yield)
const LETTUCE_CONFIG: CropConfig = CropConfig {
    growth_time: 20,            // 20 seconds to mature (FOR TESTING)
    optimal_window: 10,         // 10 second perfect window
    max_decay_time: 40,         // 40 seconds total before min yield
    base_yield: 80,
    min_yield: 16,              // 20% of base
};

#[derive(Accounts)]
pub struct InitializePlayer<'info> {
    /// The player account PDA to be created
    /// Space: 8 (discriminator) + 32 (owner) + 8 (coins) + (25 * 9) (tiles) = 273
    #[account(
        init,
        payer = signer,
        space = 8 + 32 + 8 + (TILE_COUNT * 9),
        seeds = [b"player", signer.key().as_ref()],
        bump
    )]
    pub player_account: Account<'info, PlayerAccount>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlantCrop<'info> {
    #[account(
        mut,
        seeds = [b"player", signer.key().as_ref()],
        bump
    )]
    pub player_account: Account<'info, PlayerAccount>,

    #[account(mut)]
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct HarvestCrop<'info> {
    #[account(
        mut,
        seeds = [b"player", signer.key().as_ref()],
        bump
    )]
    pub player_account: Account<'info, PlayerAccount>,

    #[account(mut)]
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClearTile<'info> {
    #[account(
        mut,
        seeds = [b"player", signer.key().as_ref()],
        bump
    )]
    pub player_account: Account<'info, PlayerAccount>,

    #[account(mut)]
    pub signer: Signer<'info>,
}

#[account]
pub struct PlayerAccount {
    pub owner: Pubkey,
    pub coins: u64,
    pub farm_tiles: [FarmTile; TILE_COUNT],
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
pub struct FarmTile {
    pub crop_type: u8,
    pub planted_at: i64,
}

/// Crop configuration defining growth timing and yield decay parameters
#[derive(Clone, Copy, Debug)]
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
}

#[error_code]
pub enum FarmingError {
    #[msg("Invalid tile index")]
    InvalidTileIndex,
    #[msg("Invalid crop type")]
    InvalidCropType,
    #[msg("Tile is not empty")]
    TileNotEmpty,
    #[msg("No active crop on this tile")]
    NoActiveCrop,
    #[msg("Crop is not yet mature")]
    CropNotMature,
    #[msg("Invalid crop configuration")]
    InvalidCropConfig,
}
