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

        // Initialize all 25 farm tiles with starting fertility
        for i in 0..TILE_COUNT {
            player_account.farm_tiles[i] = FarmTile {
                crop_type: 0,
                planted_at: 0,
                fertility: 80,        // Start at 80% (teaches mechanic)
                last_crop_type: 0,
            };
        }

        msg!("Player account initialized for: {} | Starting fertility: 80", player_account.owner);
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

        // Lazy initialization for migrated accounts
        if tile.fertility == 0 {
            tile.fertility = 60; // Default for migrated accounts
        }

        // Check for crop rotation bonus
        let is_rotation = tile.last_crop_type != 0 && tile.last_crop_type != crop_type;
        if is_rotation {
            // Crop rotation bonus: +10 fertility (capped at 100)
            tile.fertility = tile.fertility.saturating_add(10).min(100);
            msg!("Crop rotation bonus! Fertility +10");
        }

        // Get current timestamp
        let current_time = Clock::get()?.unix_timestamp;

        // Plant the crop
        tile.crop_type = crop_type;
        tile.planted_at = current_time;

        msg!("Crop type {} planted on tile {} at {} | Fertility: {}", 
             crop_type, tile_index, current_time, tile.fertility);
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
        let fertility = tile.fertility;
        let current_time = Clock::get()?.unix_timestamp;

        // Get crop config
        let config = get_crop_config(crop_type)?;

        // Calculate if crop is mature
        let mature_at = planted_at.saturating_add(config.growth_time);
        let time_since_mature = current_time.saturating_sub(mature_at);

        // Must be mature to harvest (time_since_mature >= 0)
        require!(time_since_mature >= 0, FarmingError::CropNotMature);

        // Calculate yield with both time decay AND fertility
        let yield_amount = calculate_harvest_yield_with_fertility(
            time_since_mature,
            config.base_yield,
            config.optimal_window,
            config.max_decay_time,
            config.min_yield,
            fertility,
        )?;

        // Add coins to player account
        player_account.coins = player_account.coins.saturating_add(yield_amount as u64);

        // Apply fertility changes
        let updated_tile = &mut player_account.farm_tiles[tile_index as usize];
        
        if config.is_restorative {
            // Restorative crops: restore 10 fertility, lose only the fertility_cost
            updated_tile.fertility = updated_tile.fertility
                .saturating_add(10)
                .saturating_sub(config.fertility_cost)
                .max(20)  // Hard floor at 20
                .min(100);
            msg!("Restorative crop: fertility +10, -{}", config.fertility_cost);
        } else {
            // Normal crops: deplete fertility
            updated_tile.fertility = updated_tile.fertility
                .saturating_sub(config.fertility_cost)
                .max(20);  // Hard floor at 20
        }

        // Store crop type for rotation detection
        updated_tile.last_crop_type = updated_tile.crop_type;

        // Clear the tile
        updated_tile.crop_type = 0;
        updated_tile.planted_at = 0;

        msg!("Harvested {} coins from tile {} | Fertility now: {}", 
             yield_amount, tile_index, updated_tile.fertility);
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

    /// Let a plot rest to restore fertility naturally
    pub fn leave_fallow(ctx: Context<LeaveFallow>, tile_index: u8) -> Result<()> {
        require!(tile_index < TILE_COUNT as u8, FarmingError::InvalidTileIndex);
        
        let player_account = &mut ctx.accounts.player_account;
        let tile = &mut player_account.farm_tiles[tile_index as usize];
        
        // Must be empty to fallow
        require!(tile.crop_type == 0, FarmingError::TileNotEmpty);
        
        let current_time = Clock::get()?.unix_timestamp;
        let time_empty = current_time.saturating_sub(tile.planted_at.max(0));
        
        // Restore 1 fertility per hour empty (3600 seconds)
        const FALLOW_RESTORE_RATE: i64 = 3600; // 1 hour = 1 fertility
        let fertility_gain = (time_empty / FALLOW_RESTORE_RATE) as u8;
        
        if fertility_gain > 0 {
            tile.fertility = tile.fertility.saturating_add(fertility_gain).min(100);
            tile.planted_at = current_time; // Reset timer
            msg!("Fallow restored {} fertility on tile {}", fertility_gain, tile_index);
        } else {
            msg!("Not enough time passed for fallow restoration (need {} seconds)", FALLOW_RESTORE_RATE);
        }
        
        Ok(())
    }

    /// Close player account and reclaim rent (useful for testing/resetting)
    /// Works even with old account structure - doesn't require deserialization
    pub fn close_player(ctx: Context<ClosePlayer>) -> Result<()> {
        let account = &ctx.accounts.player_account;
        let signer = &ctx.accounts.signer;
        let system_program = &ctx.accounts.system_program;
        
        // Transfer lamports from account to signer
        let account_lamports = account.lamports();
        **account.lamports.borrow_mut() = 0;
        **signer.lamports.borrow_mut() = signer.lamports().checked_add(account_lamports)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        
        msg!("Closed player account and transferred {} lamports", account_lamports);
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

/// Calculate fertility modifier for yield (40% minimum, 100% at full fertility)
/// Returns percentage multiplier (40-100)
fn calculate_fertility_modifier(fertility: u8) -> u32 {
    const MIN_MODIFIER: u32 = 40;  // 40% minimum yield
    const MAX_MODIFIER: u32 = 100; // 100% at full fertility
    
    // Linear scaling: 0 fertility = 40%, 100 fertility = 100%
    let modifier = MIN_MODIFIER + ((fertility as u32) * (MAX_MODIFIER - MIN_MODIFIER)) / 100;
    
    modifier.min(MAX_MODIFIER)
}

/// Calculate harvest yield with both time decay AND fertility modifier
fn calculate_harvest_yield_with_fertility(
    time_since_mature: i64,
    base_yield: u32,
    optimal_window: i64,
    max_decay_time: i64,
    min_yield: u32,
    fertility: u8,
) -> Result<u32> {
    // First calculate time-based yield
    let time_based_yield = calculate_harvest_yield(
        time_since_mature,
        base_yield,
        optimal_window,
        max_decay_time,
        min_yield,
    )?;
    
    // Then apply fertility modifier
    let fertility_modifier = calculate_fertility_modifier(fertility);
    let final_yield = (time_based_yield as u64)
        .saturating_mul(fertility_modifier as u64)
        .saturating_div(100) as u32;
    
    // Ensure minimum yield (never zero)
    Ok(final_yield.max(min_yield / 2))
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
    fertility_cost: 10,         // Moderate soil depletion
    is_restorative: false,
    growth_stages: 4,
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
    fertility_cost: 15,         // High soil depletion
    is_restorative: false,
    growth_stages: 4,
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
    fertility_cost: 20,         // Very high soil depletion
    is_restorative: false,
    growth_stages: 4,
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
    fertility_cost: 5,          // Low soil depletion
    is_restorative: true,       // Restores soil!
    growth_stages: 3,
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
    fertility_cost: 5,          // Low soil depletion
    is_restorative: true,       // Restores soil!
    growth_stages: 3,
};

#[derive(Accounts)]
pub struct InitializePlayer<'info> {
    /// The player account PDA to be created
    /// Space: 8 (discriminator) + 32 (owner) + 8 (coins) + (25 * 11) (tiles) = 323
    #[account(
        init,
        payer = signer,
        space = 8 + 32 + 8 + (TILE_COUNT * 11),
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

#[derive(Accounts)]
pub struct LeaveFallow<'info> {
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
pub struct ClosePlayer<'info> {
    /// Use UncheckedAccount to avoid deserializing the old account structure
    /// This allows closing accounts even if they have incompatible data layout
    /// CHECK: We only need to verify the PDA derivation, not the account contents
    #[account(
        mut,
        seeds = [b"player", signer.key().as_ref()],
        bump
    )]
    pub player_account: UncheckedAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
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
    pub fertility: u8,        // 0-100, affects yield
    pub last_crop_type: u8,   // for crop rotation detection
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
    /// Fertility lost on harvest
    pub fertility_cost: u8,
    /// True for nitrogen-fixing crops that restore soil
    pub is_restorative: bool,
    /// Number of visual growth stages
    pub growth_stages: u8,
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
