use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("8NND7mQn5q7UQcrVrzrQfsHwYruqnQshMjFuwq4WBaHR");

#[program]
pub mod farming_game {
    use super::*;

    pub fn initialize_game(ctx: Context<InitializeGame>) -> Result<()> {
        instructions::initialize_game::handler(ctx)
    }

    pub fn initialize_season(ctx: Context<InitializeSeason>) -> Result<()> {
        instructions::initialize_season::handler(ctx)
    }

    pub fn initialize_player(ctx: Context<InitializePlayer>) -> Result<()> {
        instructions::initialize_player::handler(ctx)
    }

    pub fn plant_crop(ctx: Context<PlantCrop>, tile_index: u8, crop_type: u8) -> Result<()> {
        instructions::plant_crop::handler(ctx, tile_index, crop_type)
    }

    pub fn advance_day(ctx: Context<AdvanceDay>) -> Result<()> {
        instructions::advance_day::handler(ctx)
    }

    pub fn set_season(ctx: Context<SetSeason>, season_index: u8) -> Result<()> {
        instructions::set_season::handler(ctx, season_index)
    }

    pub fn harvest_crop(ctx: Context<HarvestCrop>, tile_index: u8) -> Result<()> {
        instructions::harvest_crop::handler(ctx, tile_index)
    }

    pub fn clear_tile(ctx: Context<ClearTile>, tile_index: u8) -> Result<()> {
        instructions::clear_tile::handler(ctx, tile_index)
    }

    pub fn leave_fallow(ctx: Context<LeaveFallow>, tile_index: u8) -> Result<()> {
        instructions::leave_fallow::handler(ctx, tile_index)
    }

    pub fn close_player(ctx: Context<ClosePlayer>) -> Result<()> {
        instructions::close_player::handler(ctx)
    }

    pub fn water_tile(ctx: Context<WaterTile>, plot_index: u8) -> Result<()> {
        instructions::water_tile::handler(ctx, plot_index)
    }

    pub fn use_fertilizer(ctx: Context<UseFertilizer>, plot_index: u8) -> Result<()> {
        instructions::use_fertilizer::handler(ctx, plot_index)
    }

    pub fn refill_watering_can(ctx: Context<RefillWateringCan>) -> Result<()> {
        instructions::refill_watering_can::handler(ctx)
    }

    pub fn buy_tool(ctx: Context<BuyTool>, tool_type: u8, quantity: u16) -> Result<()> {
        instructions::buy_tool::handler(ctx, tool_type, quantity)
    }

    pub fn gather_resource(ctx: Context<GatherResource>, resource_type: u8, amount: u16) -> Result<()> {
        instructions::gather_resource::handler(ctx, resource_type, amount)
    }

    pub fn craft_item(ctx: Context<CraftItem>, item_id: u8) -> Result<()> {
        instructions::craft_item::handler(ctx, item_id)
    }

    pub fn claim_crafted_item(ctx: Context<ClaimCraftedItem>) -> Result<()> {
        instructions::claim_crafted_item::handler(ctx)
    }

    pub fn collect_compost(ctx: Context<CollectCompost>) -> Result<()> {
        instructions::collect_compost::handler(ctx)
    }

    pub fn check_patterns(ctx: Context<CheckPatterns>, plot_index: u8) -> Result<()> {
        instructions::check_patterns::handler(ctx, plot_index)
    }
}
