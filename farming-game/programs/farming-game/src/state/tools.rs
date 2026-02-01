#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ToolType {
    WateringCan = 0,
    Fertilizer = 1,
    PremiumSeeds = 2,
}

impl ToolType {
    pub fn from_u8(value: u8) -> Option<Self> {
        match value {
            0 => Some(ToolType::WateringCan),
            1 => Some(ToolType::Fertilizer),
            2 => Some(ToolType::PremiumSeeds),
            _ => None,
        }
    }
}

#[derive(Clone, Copy, Debug)]
pub struct ToolConfig {
    pub water_amount: u8,        // How much water it provides (for watering can)
    pub fertility_boost: u8,     // Fertility increase (for fertilizer)
    pub cost_points: u32,        // Points required to buy
}

impl ToolConfig {
    pub fn get_config(tool_type: ToolType) -> Self {
        match tool_type {
            ToolType::WateringCan => ToolConfig {
                water_amount: 50,      // Adds 50% water to a single plot
                fertility_boost: 0,
                cost_points: 20,       // Costs 20 points to refill
            },
            ToolType::Fertilizer => ToolConfig {
                water_amount: 0,
                fertility_boost: 20,   // Adds 20 fertility to a plot
                cost_points: 10,       // Costs 10 points per fertilizer
            },
            ToolType::PremiumSeeds => ToolConfig {
                water_amount: 0,
                fertility_boost: 0,
                cost_points: 15,       // Costs 15 points per premium seed
            },
        }
    }
}

/// Calculate water modifier based on soil moisture level
/// - 60-100% water: 1.0x (optimal)
/// - 40-59% water: 0.85x (slight penalty)
/// - 20-39% water: 0.7x (moderate penalty)
/// - 0-19% water: 0.5x (severe penalty)
pub fn get_water_modifier(water_level: u8) -> f32 {
    match water_level {
        60..=100 => 1.0,
        40..=59 => 0.85,
        20..=39 => 0.7,
        _ => 0.5,
    }
}
