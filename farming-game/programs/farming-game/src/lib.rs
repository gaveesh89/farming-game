use anchor_lang::prelude::*;

declare_id!("7nktNDR2jguCMTya6kXUw7WLEV3s7E69mknQKp1yCrAQ");

// Constants
pub const TILE_COUNT: usize = 25;

#[program]
pub mod farming_game {
    use super::*;

    /// Initialize a new player account (PDA)
    pub fn initialize_player(ctx: Context<InitializePlayer>) -> Result<()> {
        let player_account = &mut ctx.accounts.player_account;

        // Set the owner to the signer's pubkey
        player_account.owner = ctx.accounts.signer.key();

        // Initialize coins to 0
        player_account.coins = 0;

        // Initialize all 25 farm tiles to empty state (crop_type=0, planted_at=0)
        player_account.farm_tiles = [FarmTile::default(); TILE_COUNT];

        msg!("Player account initialized for: {}", player_account.owner);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePlayer<'info> {
    /// The player account PDA to be created
    /// Space: 8 (discriminator) + 32 (owner) + 8 (coins) + (25 * 9) (tiles) = 273
    #[account(
        init,
        payer = signer,
        space = 8 + 32 + 8 + (TILE_COUNT * 9),
        seeds = [b"player", signer.key().as_ref()],
        bump
    )]
    pub player_account: Account<'info, PlayerAccount>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct PlayerAccount {
    pub owner: Pubkey,
    pub coins: u64,
    pub farm_tiles: [FarmTile; TILE_COUNT],
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
pub struct FarmTile {
    pub crop_type: u8,
    pub planted_at: i64,
}
