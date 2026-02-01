use anchor_lang::prelude::*;

use crate::constants::{PLAYER_ACCOUNT_VERSION, TILE_COUNT};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub struct CraftingJob {
    pub item_id: u8,
    pub started_at: i64,
    pub duration: i64,
}

#[account]
pub struct PlayerAccount {
    // Existing fields (kept for compatibility)
    pub owner: Pubkey,
    pub coins: u64,
    pub farm_tiles: [FarmTile; TILE_COUNT],

    // Water management system
    pub water_levels: [u8; TILE_COUNT],           // Soil moisture per plot (0-100%)
    pub last_watered: [i64; TILE_COUNT],          // Timestamp of last watering per plot
    pub last_water_decay_check: i64,              // Last timestamp water decay was applied

    // Tool inventory
    pub watering_can_uses: u8,                    // Remaining uses before refill (max 10)
    pub fertilizer_count: u16,                    // Number of fertilizers available
    pub premium_seeds: u16,                       // Higher quality seeds (future use)

    // Raw resources (gathered or from harvests)
    pub wood: u16,                                // Collected from gathering
    pub stone: u16,                               // Collected from gathering
    pub fiber: u16,                               // From harvests and gathering
    pub seeds: u16,                               // From harvests and gathering

    // Crafted items (permanent structures)
    pub compost_bin_count: u8,                    // Generates 1 fertilizer per day
    pub scarecrow_count: u8,                      // Protects crops (future)
    pub fence_count: u8,                          // Increases fertility cap (future)
    pub sprinkler_count: u8,                      // Auto-waters plots (future)
    pub advanced_tools: u8,                       // Waters 3x3 area (future)

    // Crafting state
    pub crafting_queue: Option<CraftingJob>,      // Current crafting job (if any)
    pub last_gather_time: [i64; 4],              // Cooldowns: [wood, stone, fiber, seeds]
    pub last_compost_collection: i64,             // Last time fertilizer was collected from compost

    // Account versioning
    pub account_version: u8,
    pub bump: u8,
}

impl PlayerAccount {
    pub const SPACE: usize = 8 // discriminator
        + 32 // owner
        + 8 // coins
        + (TILE_COUNT * FarmTile::SPACE) // farm tiles
        + TILE_COUNT // water_levels
        + (TILE_COUNT * 8) // last_watered
        + 8 // last_water_decay_check
        + 1 // watering_can_uses
        + 2 // fertilizer_count
        + 2 // premium_seeds
        + 2 // wood
        + 2 // stone
        + 2 // fiber
        + 2 // seeds
        + 1 // compost_bin_count
        + 1 // scarecrow_count
        + 1 // fence_count
        + 1 // sprinkler_count
        + 1 // advanced_tools
        + 17 // crafting_queue (Option<CraftingJob> = 1 tag + 8 + 8)
        + 32 // last_gather_time (4 × 8)
        + 8 // last_compost_collection
        + 1 // account_version
        + 1; // bump

    pub fn init(&mut self, owner: Pubkey, bump: u8, tiles: [FarmTile; TILE_COUNT]) {
        self.owner = owner;
        self.coins = 0;
        self.farm_tiles = tiles;
        
        // Initialize water levels to 70% and last_watered to 0
        self.water_levels = [70u8; TILE_COUNT];
        self.last_watered = [0i64; TILE_COUNT];
        self.last_water_decay_check = 0;
        
        // Initialize tool inventory
        self.watering_can_uses = 10;
        self.fertilizer_count = 5;
        self.premium_seeds = 0;
        
        // Initialize starting resources
        self.wood = 10;
        self.stone = 5;
        self.fiber = 8;
        self.seeds = 0;
        
        // Initialize crafted items (all at 0)
        self.compost_bin_count = 0;
        self.scarecrow_count = 0;
        self.fence_count = 0;
        self.sprinkler_count = 0;
        self.advanced_tools = 0;
        
        // Initialize crafting state
        self.crafting_queue = None;
        self.last_gather_time = [0i64; 4];
        self.last_compost_collection = 0;
        
        self.account_version = PLAYER_ACCOUNT_VERSION;
        self.bump = bump;
    }

    /// Apply water decay to all plots based on days elapsed
    pub fn apply_water_decay(&mut self, current_timestamp: i64) {
        let seconds_per_day = 86400i64;
        let days_elapsed = current_timestamp.saturating_sub(self.last_water_decay_check) / seconds_per_day;
        
        if days_elapsed > 0 {
            let decay_amount = (days_elapsed as u8).saturating_mul(5); // 5% per day
            
            for water_level in self.water_levels.iter_mut() {
                *water_level = water_level.saturating_sub(decay_amount);
            }
            
            self.last_water_decay_check = current_timestamp;
        }
    }

    /// Check if player is currently crafting
    pub fn is_crafting(&self) -> bool {
        self.crafting_queue.is_some()
    }

    /// Check if a crafting job is complete
    pub fn crafting_complete(&self, current_time: i64) -> bool {
        if let Some(job) = &self.crafting_queue {
            current_time >= job.started_at + job.duration
        } else {
            false
        }
    }

    /// Consume resources from player inventory
    pub fn consume_resources(&mut self, resource_costs: &[(u8, u16)]) -> Result<()> {
        // First validate we have all resources
        for &(resource_type, amount) in resource_costs {
            match resource_type {
                0 => require!(self.wood >= amount, crate::errors::FarmingError::InsufficientResources),
                1 => require!(self.stone >= amount, crate::errors::FarmingError::InsufficientResources),
                2 => require!(self.fiber >= amount, crate::errors::FarmingError::InsufficientResources),
                3 => require!(self.seeds >= amount, crate::errors::FarmingError::InsufficientResources),
                _ => return Err(crate::errors::FarmingError::InvalidResourceType.into()),
            }
        }
        
        // Then consume them
        for &(resource_type, amount) in resource_costs {
            match resource_type {
                0 => self.wood = self.wood.saturating_sub(amount),
                1 => self.stone = self.stone.saturating_sub(amount),
                2 => self.fiber = self.fiber.saturating_sub(amount),
                3 => self.seeds = self.seeds.saturating_sub(amount),
                _ => return Err(crate::errors::FarmingError::InvalidResourceType.into()),
            }
        }
        
        Ok(())
    }

    /// Get plot at a specific (row, col) position on the 5x5 grid
    pub fn get_plot(&self, row: usize, col: usize) -> Option<&FarmTile> {
        if row >= 5 || col >= 5 {
            return None;
        }
        Some(&self.farm_tiles[row * 5 + col])
    }

    /// Check if a plot at (row, col) has a mature crop ready to harvest
    pub fn is_plot_harvestable(&self, row: usize, col: usize, current_time: i64) -> bool {
        if let Some(plot) = self.get_plot(row, col) {
            if plot.crop_type != 0 {
                if let Ok(config) = crate::state::get_crop_config(plot.crop_type) {
                    let mature_at = plot.planted_at + config.growth_time;
                    return current_time >= mature_at;
                }
            }
        }
        false
    }
}


#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
pub struct FarmTile {
    pub crop_type: u8,
    pub planted_at: i64,
    pub fertility: u8,
    pub last_crop_type: u8,
    pub restorative_bonus_used: bool,
    pub planted_in_season: Option<u8>,
}

impl FarmTile {
    pub const SPACE: usize = 1  // crop_type
        + 8 // planted_at
        + 1 // fertility
        + 1 // last_crop_type
        + 1 // restorative_bonus_used
        + 2; // planted_in_season (Option<u8> = 1 tag + 1 value)
}
