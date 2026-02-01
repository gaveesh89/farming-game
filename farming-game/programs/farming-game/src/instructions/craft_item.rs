use anchor_lang::prelude::*;
use crate::errors::FarmingError;
use crate::state::{PlayerAccount, recipes::CraftableItem};

#[derive(Accounts)]
#[instruction(item_id: u8)]
pub struct CraftItem<'info> {
    #[account(
        mut,
        seeds = [b"player", authority.key().as_ref()],
        bump = player_account.bump,
        has_one = owner @ FarmingError::InvalidTileIndex
    )]
    pub player_account: Account<'info, PlayerAccount>,
    
    #[account(signer)]
    pub authority: Signer<'info>,
    
    pub owner: Signer<'info>,
    
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<CraftItem>, item_id: u8) -> Result<()> {
    let player_account = &mut ctx.accounts.player_account;
    let clock = &ctx.accounts.clock;
    let current_time = clock.unix_timestamp;
    
    // Parse craftable item
    let item = CraftableItem::from_u8(item_id)?;
    
    // Check if already crafting (unless instant craft allowed)
    if player_account.is_crafting() && !item.is_instant() {
        return Err(FarmingError::CraftingInProgress.into());
    }
    
    // Get recipe inputs
    let recipe_inputs = item.get_recipe_inputs();
    
    // Consume resources
    player_account.consume_resources(&recipe_inputs)?;
    
    // Handle output based on crafting time
    let crafting_time = item.get_crafting_time();
    
    if crafting_time == 0 {
        // Instant craft - add output immediately
        add_crafted_item_to_inventory(player_account, item, item.get_output_quantity())?;
        
        emit!(crate::events::ItemCrafted {
            player: ctx.accounts.authority.key(),
            item_id,
            instant: true,
        });
    } else {
        // Timed craft - queue the job
        player_account.crafting_queue = Some(crate::state::player::CraftingJob {
            item_id,
            started_at: current_time,
            duration: crafting_time,
        });
        
        emit!(crate::events::ItemCrafted {
            player: ctx.accounts.authority.key(),
            item_id,
            instant: false,
        });
    }
    
    Ok(())
}

fn add_crafted_item_to_inventory(
    player_account: &mut PlayerAccount,
    item: CraftableItem,
    quantity: u16,
) -> Result<()> {
    match item {
        CraftableItem::WateringCanRefill => {
            player_account.watering_can_uses = 10;
        }
        CraftableItem::Fertilizer => {
            player_account.fertilizer_count = player_account.fertilizer_count.saturating_add(quantity);
        }
        CraftableItem::CompostBin => {
            player_account.compost_bin_count = player_account.compost_bin_count.saturating_add(quantity as u8);
        }
        CraftableItem::Scarecrow => {
            player_account.scarecrow_count = player_account.scarecrow_count.saturating_add(quantity as u8);
        }
        CraftableItem::Fence => {
            player_account.fence_count = player_account.fence_count.saturating_add(quantity as u8);
        }
        CraftableItem::Sprinkler => {
            player_account.sprinkler_count = player_account.sprinkler_count.saturating_add(quantity as u8);
        }
        CraftableItem::AdvancedTool => {
            player_account.advanced_tools = player_account.advanced_tools.saturating_add(quantity as u8);
        }
    }
    
    Ok(())
}
