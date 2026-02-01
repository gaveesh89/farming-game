use anchor_lang::prelude::*;

use crate::constants::{NUM_SEASONS, SEASON_LENGTHS};

#[account]
pub struct SeasonState {
    pub current_season: u8,   // 0=Spring, 1=Summer, 2=Fall, 3=Winter
    pub days_passed: u32,
    pub season_start_day: u32,
    pub authority: Pubkey,
    pub bump: u8,
}

impl SeasonState {
    pub const SPACE: usize = 8 // discriminator
        + 1 // current_season
        + 4 // days_passed
        + 4 // season_start_day
        + 32 // authority
        + 1; // bump

    pub fn season_length(&self) -> u32 {
        let idx = self.current_season.min(NUM_SEASONS - 1) as usize;
        SEASON_LENGTHS[idx]
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[repr(u8)]
pub enum Season {
    Spring = 0,
    Summer = 1,
    Fall = 2,
    Winter = 3,
}

impl Season {
    pub fn from_u8(value: u8) -> Self {
        match value {
            0 => Season::Spring,
            1 => Season::Summer,
            2 => Season::Fall,
            3 => Season::Winter,
            _ => Season::Spring,
        }
    }

    pub fn get_name(&self) -> &'static str {
        match self {
            Season::Spring => "Spring",
            Season::Summer => "Summer",
            Season::Fall => "Fall",
            Season::Winter => "Winter",
        }
    }

    pub fn get_length_in_days(&self) -> u32 {
        let idx = *self as usize;
        SEASON_LENGTHS[idx]
    }
}
