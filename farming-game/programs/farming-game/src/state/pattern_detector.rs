use crate::state::crop::CropType;
use crate::state::player::FarmTile;
use super::synergy::PatternType;

/// Pattern detector for the 5x5 farm grid
pub struct PatternDetector;

impl PatternDetector {
    /// Detect all patterns at a given position on the grid
    /// Returns a vector of detected patterns
    pub fn detect_patterns(
        plots: &[FarmTile; 25],
        harvest_row: usize,
        harvest_col: usize,
        current_time: i64,
    ) -> Vec<PatternType> {
        let mut detected = Vec::new();

        // Check each pattern type at this position
        if Self::check_monoculture_row(plots, harvest_row, harvest_col, current_time) {
            detected.push(PatternType::MonocultureRow);
        }
        if Self::check_monoculture_block(plots, harvest_row, harvest_col, current_time) {
            detected.push(PatternType::MonocultureBlock);
        }
        if Self::check_crop_diversity(plots, harvest_row, harvest_col, current_time) {
            detected.push(PatternType::CropDiversity);
        }
        if Self::check_cross_pattern(plots, harvest_row, harvest_col, current_time) {
            detected.push(PatternType::CrossPattern);
        }
        if Self::check_checkerboard(plots, harvest_row, harvest_col, current_time) {
            detected.push(PatternType::Checkerboard);
        }
        if Self::check_perimeter_defense(plots, harvest_row, harvest_col, current_time) {
            detected.push(PatternType::PerimeterDefense);
        }
        if Self::check_rotation_sequence(plots, harvest_row, harvest_col, current_time) {
            detected.push(PatternType::RotationSequence);
        }

        detected
    }

    /// Get the crop type at a specific grid position (returns None if out of bounds, empty, or not mature)
    fn get_crop_at(
        plots: &[FarmTile; 25],
        row: usize,
        col: usize,
        current_time: i64,
    ) -> Option<u8> {
        if row >= 5 || col >= 5 {
            return None;
        }
        let idx = row * 5 + col;
        let tile = &plots[idx];
        if tile.crop_type == 0 {
            return None;
        }

        if let Ok(config) = crate::state::get_crop_config(tile.crop_type) {
            let mature_at = tile.planted_at + config.growth_time;
            if current_time >= mature_at {
                return Some(tile.crop_type);
            }
        }

        None
    }

    /// Check for 3+ same crops in a horizontal or vertical line
    /// The crop at (harvest_row, harvest_col) is part of the line
    fn check_monoculture_row(
        plots: &[FarmTile; 25],
        row: usize,
        col: usize,
        current_time: i64,
    ) -> bool {
        let Some(crop_type) = Self::get_crop_at(plots, row, col, current_time) else {
            return false;
        };

        // Check horizontal (left and right)
        let mut h_count = 1; // Current crop
        
        // Count left
        for i in 1..=col {
            if Self::get_crop_at(plots, row, col - i, current_time) == Some(crop_type) {
                h_count += 1;
            } else {
                break;
            }
        }
        
        // Count right
        for i in 1..(5 - col) {
            if Self::get_crop_at(plots, row, col + i, current_time) == Some(crop_type) {
                h_count += 1;
            } else {
                break;
            }
        }

        if h_count >= 3 {
            return true;
        }

        // Check vertical (up and down)
        let mut v_count = 1;
        
        // Count up
        for i in 1..=row {
            if Self::get_crop_at(plots, row - i, col, current_time) == Some(crop_type) {
                v_count += 1;
            } else {
                break;
            }
        }
        
        // Count down
        for i in 1..(5 - row) {
            if Self::get_crop_at(plots, row + i, col, current_time) == Some(crop_type) {
                v_count += 1;
            } else {
                break;
            }
        }

        v_count >= 3
    }

    /// Check for 2x2 block of same crop where this position is part of the block
    fn check_monoculture_block(
        plots: &[FarmTile; 25],
        row: usize,
        col: usize,
        current_time: i64,
    ) -> bool {
        let Some(crop_type) = Self::get_crop_at(plots, row, col, current_time) else {
            return false;
        };

        // Check all 4 possible 2x2 configurations where this position is part
        let positions = [
            // Top-left of block
            vec![(row, col), (row, col + 1), (row + 1, col), (row + 1, col + 1)],
            // Top-right of block
            vec![(row, col.wrapping_sub(1)), (row, col), (row + 1, col.wrapping_sub(1)), (row + 1, col)],
            // Bottom-left of block
            vec![(row.wrapping_sub(1), col), (row.wrapping_sub(1), col + 1), (row, col), (row, col + 1)],
            // Bottom-right of block
            vec![(row.wrapping_sub(1), col.wrapping_sub(1)), (row.wrapping_sub(1), col), (row, col.wrapping_sub(1)), (row, col)],
        ];

        for config in positions.iter() {
            if config
                .iter()
                .all(|(r, c)| Self::get_crop_at(plots, *r, *c, current_time) == Some(crop_type))
            {
                return true;
            }
        }

        false
    }

    /// Check if surrounded by all different crops (biodiversity bonus)
    /// Requires all 4 cardinal neighbors to be different from center and each other
    fn check_crop_diversity(
        plots: &[FarmTile; 25],
        row: usize,
        col: usize,
        current_time: i64,
    ) -> bool {
        let Some(center_crop) = Self::get_crop_at(plots, row, col, current_time) else {
            return false;
        };

        // Get all 4 adjacent neighbors (cardinal directions only, not diagonal)
        let neighbors = [
            (row.wrapping_sub(1), col),  // Up
            (row + 1, col),              // Down
            (row, col.wrapping_sub(1)),  // Left
            (row, col + 1),              // Right
        ];

        let mut neighbor_crops = Vec::new();
        for (r, c) in neighbors.iter() {
            if let Some(crop) = Self::get_crop_at(plots, *r, *c, current_time) {
                neighbor_crops.push(crop);
            }
        }

        // Need exactly 4 neighbors (don't accept edge cases)
        if neighbor_crops.len() != 4 {
            return false;
        }

        // All neighbors must be different from center crop
        if neighbor_crops.iter().any(|c| *c == center_crop) {
            return false;
        }

        // All neighbors must be different from each other (all different types)
        for i in 0..neighbor_crops.len() {
            for j in (i + 1)..neighbor_crops.len() {
                if neighbor_crops[i] == neighbor_crops[j] {
                    return false;
                }
            }
        }

        true
    }

    /// Check for cross pattern (+ shape) of same crop
    /// Center crop with matching crops in all 4 cardinal directions
    fn check_cross_pattern(
        plots: &[FarmTile; 25],
        row: usize,
        col: usize,
        current_time: i64,
    ) -> bool {
        let Some(crop_type) = Self::get_crop_at(plots, row, col, current_time) else {
            return false;
        };

        // All 4 cardinal neighbors must exist and have the same crop type
        let cross_positions = [
            (row.wrapping_sub(1), col),  // Up
            (row + 1, col),              // Down
            (row, col.wrapping_sub(1)),  // Left
            (row, col + 1),              // Right
        ];

        cross_positions
            .iter()
            .all(|(r, c)| Self::get_crop_at(plots, *r, *c, current_time) == Some(crop_type))
    }

    /// Check for checkerboard pattern (alternating crops in 3x3 area)
    /// The position can be any corner of the 3x3
    fn check_checkerboard(
        plots: &[FarmTile; 25],
        row: usize,
        col: usize,
        current_time: i64,
    ) -> bool {
        // Try all possible 3x3 positions where this cell is part of it
        let possible_starts = [
            (row, col),                 // Top-left
            (row, col.wrapping_sub(1)),
            (row, col.wrapping_sub(2)),
            (row.wrapping_sub(1), col),
            (row.wrapping_sub(1), col.wrapping_sub(1)),
            (row.wrapping_sub(1), col.wrapping_sub(2)),
            (row.wrapping_sub(2), col),
            (row.wrapping_sub(2), col.wrapping_sub(1)),
            (row.wrapping_sub(2), col.wrapping_sub(2)),
        ];

        for (start_row, start_col) in possible_starts.iter() {
            // Skip if this would go out of bounds
            if *start_row >= 5 || *start_col >= 5 || 
               start_row + 2 >= 5 || start_col + 2 >= 5 {
                continue;
            }

            // Check if 3x3 starting at this position forms a checkerboard
            let mut is_checkerboard = true;
            let mut pattern_crop_a = None;
            let mut pattern_crop_b = None;

            for i in 0..3 {
                for j in 0..3 {
                    let cell_row = start_row + i;
                    let cell_col = start_col + j;
                    let is_even = (i + j) % 2 == 0;

                    if let Some(crop) = Self::get_crop_at(plots, cell_row, cell_col, current_time) {
                        if is_even {
                            if let Some(first) = pattern_crop_a {
                                if crop != first {
                                    is_checkerboard = false;
                                    break;
                                }
                            } else {
                                pattern_crop_a = Some(crop);
                            }
                        } else {
                            if let Some(first) = pattern_crop_b {
                                if crop != first {
                                    is_checkerboard = false;
                                    break;
                                }
                            } else {
                                pattern_crop_b = Some(crop);
                            }
                        }
                    } else {
                        is_checkerboard = false;
                        break;
                    }
                }
                if !is_checkerboard {
                    break;
                }
            }

            // Must have two different crop types in the pattern
            if is_checkerboard && pattern_crop_a.is_some() && pattern_crop_b.is_some() {
                if pattern_crop_a != pattern_crop_b {
                    return true;
                }
            }
        }

        false
    }

    /// Check for perimeter defense pattern (border of different crops around center)
    /// 3x3 area where center is surrounded by 8 different crops
    fn check_perimeter_defense(
        plots: &[FarmTile; 25],
        row: usize,
        col: usize,
        current_time: i64,
    ) -> bool {
        let Some(center_crop) = Self::get_crop_at(plots, row, col, current_time) else {
            return false;
        };

        // Need at least (1,1) to (3,3) to have a 3x3 with center
        if row < 1 || row > 3 || col < 1 || col > 3 {
            return false;
        }

        // Get all 8 surrounding cells
        let perimeter = [
            (row - 1, col - 1), (row - 1, col), (row - 1, col + 1),
            (row, col - 1),                     (row, col + 1),
            (row + 1, col - 1), (row + 1, col), (row + 1, col + 1),
        ];

        // All perimeter cells must:
        // 1. Have crops
        // 2. Be different from center crop
        // 3. Not need to be different from each other (just defending the center)
        perimeter.iter().all(|(r, c)| {
            if let Some(crop) = Self::get_crop_at(plots, *r, *c, current_time) {
                crop != center_crop
            } else {
                false
            }
        })
    }

    /// Check for rotation sequence (4 different crops in a line)
    /// Horizontal or vertical line with all 4 different crop types
    fn check_rotation_sequence(
        plots: &[FarmTile; 25],
        row: usize,
        col: usize,
        current_time: i64,
    ) -> bool {
        // Check horizontal sequences containing this position
        if Self::check_rotation_sequence_horizontal(plots, row, col, current_time) {
            return true;
        }

        // Check vertical sequences containing this position
        if Self::check_rotation_sequence_vertical(plots, row, col, current_time) {
            return true;
        }

        false
    }

    /// Helper: check horizontal rotation sequence
    fn check_rotation_sequence_horizontal(
        plots: &[FarmTile; 25],
        row: usize,
        col: usize,
        current_time: i64,
    ) -> bool {
        // Try all 4-crop windows containing this column
        let start_positions = [
            (col.wrapping_sub(3), col),
            (col.wrapping_sub(2), col + 1),
            (col.wrapping_sub(1), col + 2),
            (col, col + 3),
        ];

        for (start_col, end_col) in start_positions.iter() {
            if *start_col >= 5 || *end_col >= 5 {
                continue;
            }

            let mut crops = Vec::new();
            for c in *start_col..=*end_col {
                if let Some(crop) = Self::get_crop_at(plots, row, c, current_time) {
                    crops.push(crop);
                } else {
                    break;
                }
            }

            // Check if we have 4 different crops
            if crops.len() == 4 {
                let mut unique = true;
                for i in 0..crops.len() {
                    for j in (i + 1)..crops.len() {
                        if crops[i] == crops[j] {
                            unique = false;
                            break;
                        }
                    }
                    if !unique {
                        break;
                    }
                }
                if unique {
                    return true;
                }
            }
        }

        false
    }

    /// Helper: check vertical rotation sequence
    fn check_rotation_sequence_vertical(
        plots: &[FarmTile; 25],
        row: usize,
        col: usize,
        current_time: i64,
    ) -> bool {
        // Try all 4-crop windows containing this row
        let start_positions = [
            (row.wrapping_sub(3), row),
            (row.wrapping_sub(2), row + 1),
            (row.wrapping_sub(1), row + 2),
            (row, row + 3),
        ];

        for (start_row, end_row) in start_positions.iter() {
            if *start_row >= 5 || *end_row >= 5 {
                continue;
            }

            let mut crops = Vec::new();
            for r in *start_row..=*end_row {
                if let Some(crop) = Self::get_crop_at(plots, r, col, current_time) {
                    crops.push(crop);
                } else {
                    break;
                }
            }

            // Check if we have 4 different crops
            if crops.len() == 4 {
                let mut unique = true;
                for i in 0..crops.len() {
                    for j in (i + 1)..crops.len() {
                        if crops[i] == crops[j] {
                            unique = false;
                            break;
                        }
                    }
                    if !unique {
                        break;
                    }
                }
                if unique {
                    return true;
                }
            }
        }

        false
    }

    /// Check companion planting (specific beneficial crop pairs adjacent)
    /// Returns the companion crop type if a beneficial pairing is detected
    pub fn check_companion_planting(
        plots: &[FarmTile; 25],
        row: usize,
        col: usize,
        current_time: i64,
    ) -> Option<u8> {
        let Some(crop_type) = Self::get_crop_at(plots, row, col, current_time) else {
            return None;
        };

        let neighbors = [
            (row.wrapping_sub(1), col),
            (row + 1, col),
            (row, col.wrapping_sub(1)),
            (row, col + 1),
        ];

        for (r, c) in neighbors.iter() {
            if let Some(neighbor_crop) = Self::get_crop_at(plots, *r, *c, current_time) {
                // Check if this pair has a companion bonus
                if let (Some(center), Some(neighbor)) = (
                    Self::crop_type_from_u8(crop_type),
                    Self::crop_type_from_u8(neighbor_crop),
                ) {
                    if super::synergy::get_companion_bonus(center, neighbor).is_some() {
                        return Some(neighbor_crop);
                    }
                }
            }
        }

        None
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
}
