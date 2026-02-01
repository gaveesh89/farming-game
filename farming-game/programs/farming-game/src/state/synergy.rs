use anchor_lang::prelude::*;
use crate::state::crop::CropType;

/// Pattern types that can be detected on the farm grid
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[repr(u8)]
pub enum PatternType {
    MonocultureRow = 0,      // 3+ same crop in horizontal or vertical line
    MonocultureBlock = 1,    // 2x2 square of same crop
    CompanionPlanting = 2,   // Specific beneficial crop pairs adjacent
    CropDiversity = 3,       // All 4 cardinal neighbors are different crops
    CrossPattern = 4,        // + shape of same crop (center + 4 adjacent)
    Checkerboard = 5,        // Alternating crops in 3x3 area
    PerimeterDefense = 6,    // Different crops forming border around center
    RotationSequence = 7,    // 4 different crops in a line
}

impl PatternType {
    /// Convert u8 to PatternType
    pub fn from_u8(value: u8) -> Result<Self> {
        match value {
            0 => Ok(PatternType::MonocultureRow),
            1 => Ok(PatternType::MonocultureBlock),
            2 => Ok(PatternType::CompanionPlanting),
            3 => Ok(PatternType::CropDiversity),
            4 => Ok(PatternType::CrossPattern),
            5 => Ok(PatternType::Checkerboard),
            6 => Ok(PatternType::PerimeterDefense),
            7 => Ok(PatternType::RotationSequence),
            _ => Err(error!(crate::errors::FarmingError::InvalidPatternType)),
        }
    }

    /// Get human-readable description of the pattern
    pub fn get_description(&self) -> &str {
        match self {
            PatternType::MonocultureRow => "3+ same crops in a row: +15% yield",
            PatternType::MonocultureBlock => "2x2 block of same crop: +20% yield",
            PatternType::CompanionPlanting => "Beneficial crop pairs: +10% yield",
            PatternType::CropDiversity => "Surrounded by different crops: +25% yield, +5 fertility",
            PatternType::CrossPattern => "Cross shape of same crop: +30% yield, +1 seed",
            PatternType::Checkerboard => "Alternating crops in 3x3: +10% yield, pest resistance",
            PatternType::PerimeterDefense => "Border around center crop: +40% yield, disease immunity",
            PatternType::RotationSequence => "4 different crops in line: +20% yield, +10 fertility",
        }
    }
}

/// Bonus structure for a detected pattern
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct PatternBonus {
    pub yield_multiplier: f32,     // e.g., 1.15 for +15%
    pub fertility_bonus: u8,       // Added to plot fertility
    pub water_bonus: u8,           // Added to plot water
    pub resource_bonus: ResourceBonus,
}

/// Additional resources granted by pattern bonuses
#[derive(Clone, Copy, Debug, PartialEq, Default)]
pub struct ResourceBonus {
    pub seeds: u16,
    pub fiber: u16,
    pub wood: u16,
    pub points: u32,
}

impl PatternType {
    /// Get the bonus rewards for detecting this pattern
    pub fn get_bonus(&self) -> PatternBonus {
        match self {
            PatternType::MonocultureRow => PatternBonus {
                yield_multiplier: 1.15,
                fertility_bonus: 0,
                water_bonus: 0,
                resource_bonus: ResourceBonus::default(),
            },
            PatternType::MonocultureBlock => PatternBonus {
                yield_multiplier: 1.20,
                fertility_bonus: 0,
                water_bonus: 0,
                resource_bonus: ResourceBonus::default(),
            },
            PatternType::CompanionPlanting => PatternBonus {
                yield_multiplier: 1.10,
                fertility_bonus: 0,
                water_bonus: 0,
                resource_bonus: ResourceBonus::default(),
            },
            PatternType::CropDiversity => PatternBonus {
                yield_multiplier: 1.25,
                fertility_bonus: 5,
                water_bonus: 0,
                resource_bonus: ResourceBonus::default(),
            },
            PatternType::CrossPattern => PatternBonus {
                yield_multiplier: 1.30,
                fertility_bonus: 0,
                water_bonus: 0,
                resource_bonus: ResourceBonus {
                    seeds: 1,
                    ..Default::default()
                },
            },
            PatternType::Checkerboard => PatternBonus {
                yield_multiplier: 1.10,
                fertility_bonus: 0,
                water_bonus: 2,
                resource_bonus: ResourceBonus::default(),
            },
            PatternType::PerimeterDefense => PatternBonus {
                yield_multiplier: 1.40,
                fertility_bonus: 0,
                water_bonus: 0,
                resource_bonus: ResourceBonus::default(),
            },
            PatternType::RotationSequence => PatternBonus {
                yield_multiplier: 1.20,
                fertility_bonus: 10,
                water_bonus: 0,
                resource_bonus: ResourceBonus::default(),
            },
        }
    }
}

/// Get companion planting bonus for a pair of crops
/// Returns Some(bonus) if the two crops have a beneficial pairing
pub fn get_companion_bonus(crop_a: CropType, crop_b: CropType) -> Option<PatternBonus> {
    match (crop_a, crop_b) {
        // Wheat + Carrot: Classic companion planting
        (CropType::Wheat, CropType::Carrot) | (CropType::Carrot, CropType::Wheat) => {
            Some(PatternBonus {
                yield_multiplier: 1.10,
                fertility_bonus: 0,
                water_bonus: 0,
                resource_bonus: ResourceBonus::default(),
            })
        }
        // Corn + Lettuce: Corn provides shade, lettuce doesn't compete for water
        (CropType::Corn, CropType::Lettuce) | (CropType::Lettuce, CropType::Corn) => {
            Some(PatternBonus {
                yield_multiplier: 1.05,
                fertility_bonus: 0,
                water_bonus: 5,  // Water efficiency bonus
                resource_bonus: ResourceBonus::default(),
            })
        }
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pattern_bonuses() {
        let row_bonus = PatternType::MonocultureRow.get_bonus();
        assert_eq!(row_bonus.yield_multiplier, 1.15);

        let diversity_bonus = PatternType::CropDiversity.get_bonus();
        assert_eq!(diversity_bonus.yield_multiplier, 1.25);
        assert_eq!(diversity_bonus.fertility_bonus, 5);
    }

    #[test]
    fn test_companion_planting() {
        let bonus = get_companion_bonus(CropType::Wheat, CropType::Carrot);
        assert!(bonus.is_some());

        let bonus = get_companion_bonus(CropType::Corn, CropType::Lettuce);
        assert!(bonus.is_some());

        let no_bonus = get_companion_bonus(CropType::Wheat, CropType::Corn);
        assert!(no_bonus.is_none());
    }
}
