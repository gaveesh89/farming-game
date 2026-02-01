use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[repr(u8)]
pub enum CraftableItem {
    WateringCanRefill = 0,
    Fertilizer = 1,
    CompostBin = 2,
    Scarecrow = 3,
    Fence = 4,
    Sprinkler = 5,
    AdvancedTool = 6,
}

impl CraftableItem {
    pub fn from_u8(value: u8) -> Result<Self> {
        match value {
            0 => Ok(CraftableItem::WateringCanRefill),
            1 => Ok(CraftableItem::Fertilizer),
            2 => Ok(CraftableItem::CompostBin),
            3 => Ok(CraftableItem::Scarecrow),
            4 => Ok(CraftableItem::Fence),
            5 => Ok(CraftableItem::Sprinkler),
            6 => Ok(CraftableItem::AdvancedTool),
            _ => Err(error!(crate::errors::FarmingError::InvalidCraftableItem)),
        }
    }

    pub fn get_description(&self) -> &str {
        match self {
            CraftableItem::WateringCanRefill => "Refills watering can to 10 uses",
            CraftableItem::Fertilizer => "Creates 3 fertilizers for soil boosting",
            CraftableItem::CompostBin => "Generates 1 fertilizer per day automatically",
            CraftableItem::Scarecrow => "Protects crops from pests",
            CraftableItem::Fence => "Increases max fertility cap to 110%",
            CraftableItem::Sprinkler => "Auto-waters adjacent plots daily",
            CraftableItem::AdvancedTool => "Waters 3x3 area with watering can",
        }
    }

    /// Get recipe inputs: Vec<(ResourceType, amount)>
    pub fn get_recipe_inputs(&self) -> Vec<(u8, u16)> {
        // Returns as tuples: (resource_type_u8, amount)
        match self {
            CraftableItem::WateringCanRefill => vec![(0, 3), (2, 2)],    // 3 wood + 2 fiber
            CraftableItem::Fertilizer => vec![(2, 5), (3, 3)],          // 5 fiber + 3 seeds
            CraftableItem::CompostBin => vec![(0, 10), (1, 5)],         // 10 wood + 5 stone
            CraftableItem::Scarecrow => vec![(0, 8), (2, 12)],          // 8 wood + 12 fiber
            CraftableItem::Fence => vec![(0, 15), (1, 8)],              // 15 wood + 8 stone
            CraftableItem::Sprinkler => vec![(0, 20), (1, 12), (2, 5)], // 20 wood + 12 stone + 5 fiber
            CraftableItem::AdvancedTool => vec![(0, 5), (1, 3)],        // 5 wood + 3 stone
        }
    }

    pub fn get_output_quantity(&self) -> u16 {
        match self {
            CraftableItem::WateringCanRefill => 1,
            CraftableItem::Fertilizer => 3,
            CraftableItem::CompostBin => 1,
            CraftableItem::Scarecrow => 1,
            CraftableItem::Fence => 1,
            CraftableItem::Sprinkler => 1,
            CraftableItem::AdvancedTool => 1,
        }
    }

    /// Crafting time in seconds (0 = instant)
    pub fn get_crafting_time(&self) -> i64 {
        match self {
            CraftableItem::WateringCanRefill => 0,       // Instant
            CraftableItem::Fertilizer => 0,              // Instant
            CraftableItem::CompostBin => 3600,           // 1 hour
            CraftableItem::Scarecrow => 1800,            // 30 minutes
            CraftableItem::Fence => 2700,                // 45 minutes
            CraftableItem::Sprinkler => 7200,            // 2 hours
            CraftableItem::AdvancedTool => 5400,         // 1.5 hours
        }
    }

    pub fn is_instant(&self) -> bool {
        self.get_crafting_time() == 0
    }
}
