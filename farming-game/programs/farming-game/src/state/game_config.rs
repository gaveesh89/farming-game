use anchor_lang::prelude::*;

#[account]
pub struct GameConfig {
    pub authority: Pubkey,
    pub season_length: i64,
    pub base_fertility: u8,
    pub rotation_bonus: u8,
    pub config_version: u8,
    pub bump: u8,
}

impl GameConfig {
    pub const SPACE: usize = 8 // discriminator
        + 32 // authority
        + 8 // season_length
        + 1 // base_fertility
        + 1 // rotation_bonus
        + 1 // config_version
        + 1; // bump
}
