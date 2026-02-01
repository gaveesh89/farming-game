use anchor_lang::prelude::*;
use crate::state::synergy::PatternType;

#[event]
pub struct WaterApplied {
    pub player: Pubkey,
    pub plot_index: u8,
    pub new_water_level: u8,
    pub timestamp: i64,
}

#[event]
pub struct FertilizerApplied {
    pub player: Pubkey,
    pub plot_index: u8,
    pub new_fertility: u8,
}

#[event]
pub struct CanRefilled {
    pub player: Pubkey,
    pub points_spent: u32,
    pub timestamp: i64,
}

#[event]
pub struct ToolPurchased {
    pub player: Pubkey,
    pub tool_type: u8,
    pub quantity: u16,
    pub points_spent: u32,
    pub timestamp: i64,
}

#[event]
pub struct ResourceGathered {
    pub player: Pubkey,
    pub resource_type: u8,
    pub amount: u16,
    pub new_total: u16,
}

#[event]
pub struct ItemCrafted {
    pub player: Pubkey,
    pub item_id: u8,
    pub instant: bool,
}

#[event]
pub struct CraftingCompleted {
    pub player: Pubkey,
    pub item_id: u8,
    pub quantity: u16,
}

#[event]
pub struct CompostCollected {
    pub player: Pubkey,
    pub fertilizer_gained: u16,
    pub days_elapsed: u32,
}

#[event]
pub struct PatternDetected {
    pub player: Pubkey,
    pub plot_index: u8,
    pub pattern_type: PatternType,
    pub yield_multiplier: f32,
    pub fertility_bonus: u8,
    pub water_bonus: u8,
}

#[event]
pub struct PatternsPreview {
    pub player: Pubkey,
    pub plot_index: u8,
    pub pattern_count: u8,
    pub total_yield_multiplier: f32,
}
