use anchor_lang::prelude::*;
use crate::state::{PlayerAccount, PatternDetector};
use crate::events::PatternsPreview;
use crate::errors::FarmingError;
use crate::state::crop::CropType;

#[derive(Accounts)]
#[instruction(plot_index: u8)]
pub struct CheckPatterns<'info> {
    #[account(
        seeds = [b"player", authority.key().as_ref()],
        bump = player_account.bump,
    )]
    pub player_account: Account<'info, PlayerAccount>,

    #[account(signer)]
    pub authority: Signer<'info>,
}

/// Handler: Check which patterns exist at a plot without harvesting
/// This is read-only and useful for UI previews and testing
pub fn handler(ctx: Context<CheckPatterns>, plot_index: u8) -> Result<()> {
    require!(plot_index < 25, FarmingError::InvalidPlotIndex);

    let player_account = &ctx.accounts.player_account;
    let current_time = Clock::get()?.unix_timestamp;

    // Convert plot_index to (row, col)
    let row = (plot_index / 5) as usize;
    let col = (plot_index % 5) as usize;

    // Detect all patterns at this position
    let detected_patterns = PatternDetector::detect_patterns(
        &player_account.farm_tiles,
        row,
        col,
        current_time,
    );

    // Calculate total yield multiplier (patterns stack multiplicatively)
    let mut total_yield_multiplier = 1.0f32;
    for pattern in detected_patterns.iter() {
        let bonus = pattern.get_bonus();
        total_yield_multiplier *= bonus.yield_multiplier;
    }

    // Check companion planting
    if let Some(companion_crop_type) = PatternDetector::check_companion_planting(
        &player_account.farm_tiles,
        row,
        col,
        current_time,
    ) {
        let tile = &player_account.farm_tiles[plot_index as usize];
        if tile.crop_type != 0 {
            if let (Some(center), Some(neighbor)) = (
                crop_type_from_u8(tile.crop_type),
                crop_type_from_u8(companion_crop_type),
            ) {
                if let Some(companion_bonus) = crate::state::synergy::get_companion_bonus(center, neighbor) {
                    total_yield_multiplier *= companion_bonus.yield_multiplier;
                }
            }
        }
    }

    // Emit event for UI preview
    emit!(PatternsPreview {
        player: player_account.owner,
        plot_index,
        pattern_count: detected_patterns.len() as u8,
        total_yield_multiplier,
    });

    Ok(())
}

fn crop_type_from_u8(value: u8) -> Option<CropType> {
    match value {
        1 => Some(CropType::Wheat),
        2 => Some(CropType::Tomato),
        3 => Some(CropType::Corn),
        4 => Some(CropType::Carrot),
        5 => Some(CropType::Lettuce),
        _ => None,
    }
}
