// Game constants

pub const GRID_SIZE: usize = 5;
pub const TILE_COUNT: usize = GRID_SIZE * GRID_SIZE;

// Fertility settings
pub const MAX_FERTILITY: u8 = 100;
pub const MIN_FERTILITY: u8 = 20;

// Starting fertility for new players (kept at 80 to preserve current gameplay)
pub const DEFAULT_PLAYER_FERTILITY: u8 = 80;
// Default fertility for migrated/empty tiles
pub const DEFAULT_MIGRATED_FERTILITY: u8 = 60;

// Game config defaults
pub const DEFAULT_BASE_FERTILITY: u8 = 100;
pub const DEFAULT_ROTATION_BONUS: u8 = 10;
pub const DEFAULT_SEASON_LENGTH: i64 = 0;

// Fallow restore rate: 1 fertility per hour
pub const FALLOW_RESTORE_RATE: i64 = 3600;

// Account versioning
pub const PLAYER_ACCOUNT_VERSION: u8 = 1;

// Seasons
pub const NUM_SEASONS: u8 = 4;
pub const SEASON_LENGTH_DAYS: u32 = 30;
pub const SEASON_LENGTHS: [u32; 4] = [30, 30, 30, 30];

// PDA seeds
pub const PLAYER_SEED: &[u8] = b"player";
pub const GAME_CONFIG_SEED: &[u8] = b"game_config";
pub const SEASON_STATE_SEED: &[u8] = b"season_state";

// Pattern detection constants
pub const MIN_ROW_LENGTH: usize = 3;  // Minimum for monoculture row
pub const BLOCK_SIZE: usize = 2;      // Size for monoculture block

// Pattern bonus multipliers
pub const MONOCULTURE_ROW_BONUS: f32 = 1.15;
pub const MONOCULTURE_BLOCK_BONUS: f32 = 1.20;
pub const COMPANION_WHEAT_CARROT_BONUS: f32 = 1.10;
pub const COMPANION_CORN_LETTUCE_BONUS: f32 = 1.05;
pub const CROP_DIVERSITY_BONUS: f32 = 1.25;
pub const CROSS_PATTERN_BONUS: f32 = 1.30;
pub const CHECKERBOARD_BONUS: f32 = 1.10;
pub const PERIMETER_DEFENSE_BONUS: f32 = 1.40;
pub const ROTATION_SEQUENCE_BONUS: f32 = 1.20;
