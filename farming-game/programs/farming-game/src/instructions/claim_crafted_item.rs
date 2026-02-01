use anchor_lang::prelude::*;
use crate::errors::FarmingError;
use crate::state::{PlayerAccount, recipes::CraftableItem};

#[derive(Accounts)]
pub struct ClaimCraftedItem<'info> {
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

pub fn handler(ctx: Context<ClaimCraftedItem>) -> Result<()> {
    let player_account = &mut ctx.accounts.player_account;
    let clock = &ctx.accounts.clock;
    let current_time = clock.unix_timestamp;
    
    // Check if crafting in progress
    require!(player_account.is_crafting(), FarmingError::NoCraftingInProgress);
    
    // Check if crafting is complete
    require!(player_account.crafting_complete(current_time), FarmingError::CraftingNotComplete);
    
    // Get the crafted item
    let job = player_account.crafting_queue.unwrap();
    let item = CraftableItem::from_u8(job.item_id)?;
    let quantity = item.get_output_quantity();
    
    // Add item to inventory
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
    
    // Clear crafting queue
    player_account.crafting_queue = None;
    
    // Emit event
    emit!(crate::events::CraftingCompleted {
        player: ctx.accounts.authority.key(),
        item_id: job.item_id,
        quantity,
    });
    
    Ok(())
}
