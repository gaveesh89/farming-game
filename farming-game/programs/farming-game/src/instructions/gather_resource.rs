use anchor_lang::prelude::*;
use crate::errors::FarmingError;
use crate::state::{PlayerAccount, resources::ResourceType};

#[derive(Accounts)]
#[instruction(resource_type: u8, amount: u16)]
pub struct GatherResource<'info> {
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

pub fn handler(ctx: Context<GatherResource>, resource_type: u8, amount: u16) -> Result<()> {
    let player_account = &mut ctx.accounts.player_account;
    let clock = &ctx.accounts.clock;
    let current_time = clock.unix_timestamp;
    
    // Parse resource type
    let resource = ResourceType::from_u8(resource_type)?;
    
    // Validate amount
    require!(
        amount > 0 && amount <= resource.max_gather_per_action(),
        FarmingError::GatherAmountExceeded
    );
    
    // Check cooldown
    let cooldown_seconds = resource.gather_cooldown_seconds();
    if cooldown_seconds > 0 {
        let last_gather = player_account.last_gather_time[resource_type as usize];
        if last_gather > 0 {
            require!(
                current_time - last_gather >= cooldown_seconds,
                FarmingError::GatherCooldownActive
            );
        }
    }
    
    // Add resource to inventory (based on type)
    let new_total = match resource {
        ResourceType::Wood => {
            let new = player_account.wood.saturating_add(amount);
            require!(new <= resource.max_stack_size(), FarmingError::ResourceStackOverflow);
            player_account.wood = new;
            new
        }
        ResourceType::Stone => {
            let new = player_account.stone.saturating_add(amount);
            require!(new <= resource.max_stack_size(), FarmingError::ResourceStackOverflow);
            player_account.stone = new;
            new
        }
        ResourceType::Fiber => {
            let new = player_account.fiber.saturating_add(amount);
            require!(new <= resource.max_stack_size(), FarmingError::ResourceStackOverflow);
            player_account.fiber = new;
            new
        }
        ResourceType::Seeds => {
            // Seeds cannot be manually gathered
            return Err(FarmingError::GatherAmountExceeded.into());
        }
    };
    
    // Update cooldown
    if cooldown_seconds > 0 {
        player_account.last_gather_time[resource_type as usize] = current_time;
    }
    
    // Emit event
    emit!(crate::events::ResourceGathered {
        player: ctx.accounts.authority.key(),
        resource_type,
        amount,
        new_total,
    });
    
    Ok(())
}
