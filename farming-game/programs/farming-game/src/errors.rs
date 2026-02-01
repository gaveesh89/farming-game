use anchor_lang::prelude::*;

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
    #[msg("Cannot plant this crop in the current season")]
    InvalidSeasonForCrop,
    #[msg("Season index must be between 0 and 3")]
    InvalidSeasonIndex,
    #[msg("Can only advance day once per real day")]
    DayAlreadyAdvanced,
    
    // Irrigation & tools errors
    #[msg("Not enough watering can uses remaining")]
    InsufficientToolUses,
    #[msg("Not enough fertilizer in inventory")]
    InsufficientFertilizer,
    #[msg("Not enough points to complete this action")]
    InsufficientPoints,
    #[msg("Cannot water same plot more than once per hour")]
    WateringTooFrequent,
    #[msg("Plot index must be between 0 and 24")]
    InvalidPlotIndex,
    
    // Crafting & resources errors
    #[msg("Insufficient resources for this recipe")]
    InsufficientResources,
    #[msg("Invalid resource type")]
    InvalidResourceType,
    #[msg("Invalid craftable item ID")]
    InvalidCraftableItem,
    #[msg("Cannot gather resource yet (cooldown active)")]
    GatherCooldownActive,
    #[msg("Resource stack would exceed maximum")]
    ResourceStackOverflow,
    #[msg("Already crafting an item")]
    CraftingInProgress,
    #[msg("No crafting job in progress")]
    NoCraftingInProgress,
    #[msg("Crafting not complete yet")]
    CraftingNotComplete,
    #[msg("Cannot gather more than max per action")]
    GatherAmountExceeded,
    
    // Pattern system errors
    #[msg("Invalid pattern type")]
    InvalidPatternType,
    #[msg("Plot position out of grid bounds")]
    PlotOutOfBounds,
}
