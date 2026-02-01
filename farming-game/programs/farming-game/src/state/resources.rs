use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[repr(u8)]
pub enum ResourceType {
    Wood = 0,
    Stone = 1,
    Fiber = 2,
    Seeds = 3,
}

impl ResourceType {
    pub fn from_u8(value: u8) -> Result<Self> {
        match value {
            0 => Ok(ResourceType::Wood),
            1 => Ok(ResourceType::Stone),
            2 => Ok(ResourceType::Fiber),
            3 => Ok(ResourceType::Seeds),
            _ => Err(error!(crate::errors::FarmingError::InvalidResourceType)),
        }
    }

    pub fn max_stack_size(&self) -> u16 {
        match self {
            ResourceType::Wood => 999,
            ResourceType::Stone => 999,
            ResourceType::Fiber => 500,
            ResourceType::Seeds => 500,
        }
    }

    pub fn max_gather_per_action(&self) -> u16 {
        match self {
            ResourceType::Wood => 5,
            ResourceType::Stone => 3,
            ResourceType::Fiber => 8,
            ResourceType::Seeds => 0, // Cannot manually gather seeds (from harvests only)
        }
    }

    pub fn gather_cooldown_seconds(&self) -> i64 {
        match self {
            ResourceType::Wood => 3600,      // 1 hour
            ResourceType::Stone => 3600,     // 1 hour
            ResourceType::Fiber => 1800,     // 30 minutes
            ResourceType::Seeds => 0,        // N/A
        }
    }
}
