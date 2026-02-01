# Pattern Synergies System - Test Outline

## Overview
This document outlines the comprehensive test suite for the crop synergies and pattern bonuses system in the farming game. All patterns are deterministically detected at harvest time based on grid layout and crop maturity.

---

## Test Group 1: Monoculture Row Detection
**Pattern**: 3+ same crop in horizontal or vertical line  
**Bonus**: +15% yield  
**Detection**: Runtime only, no storage

### Test 1.1: Horizontal row detection
- **Setup**: Plant Wheat at (0,0), (0,1), (0,2)
- **Action**: Harvest crop at (0,1)
- **Expected**: 
  - Pattern detected: MonocultureRow
  - Yield: base × 1.15

### Test 1.2: Vertical row detection
- **Setup**: Plant Corn at (0,0), (1,0), (2,0)
- **Action**: Harvest crop at (1,0)
- **Expected**:
  - Pattern detected: MonocultureRow
  - Yield: base × 1.15

### Test 1.3: 4-crop row
- **Setup**: Plant Lettuce at (2,0), (2,1), (2,2), (2,3)
- **Action**: Harvest any crop in the row
- **Expected**:
  - Pattern detected: MonocultureRow
  - Yield: base × 1.15

### Test 1.4: Incomplete row (2 crops)
- **Setup**: Plant Wheat at (1,1), (1,2)
- **Action**: Harvest crop at (1,1)
- **Expected**:
  - Pattern NOT detected
  - Yield: base (no bonus)

### Test 1.5: Broken row (different crop in middle)
- **Setup**: Plant Wheat at (0,0), (0,1), Tomato at (0,2), Wheat at (0,3)
- **Action**: Harvest crop at (0,1)
- **Expected**:
  - Pattern NOT detected (only 2 consecutive wheat)
  - Yield: base

### Test 1.6: Edge case - row at grid boundary
- **Setup**: Plant Carrot at (0,3), (0,4), (0,5) [but col 5 is out of bounds]
- **Actual**: Plant at (0,3), (0,4) and nothing at (0,5)
- **Action**: Harvest crop at (0,4)
- **Expected**:
  - Pattern NOT detected (only 2 crops)
  - Yield: base

### Test 1.7: Grid corner - vertical row
- **Setup**: Plant Wheat at (3,4), (4,4) (bottom-right corner)
- **Action**: Harvest crop at (4,4)
- **Expected**:
  - Pattern NOT detected (need 3+)
  - Yield: base

---

## Test Group 2: Monoculture Block Detection
**Pattern**: 2x2 square of same crop  
**Bonus**: +20% yield  

### Test 2.1: Basic 2x2 block
- **Setup**: Plant Corn at (0,0), (0,1), (1,0), (1,1)
- **Action**: Harvest crop at (0,0)
- **Expected**:
  - Pattern detected: MonocultureBlock
  - Yield: base × 1.20

### Test 2.2: Harvest different position in block
- **Setup**: Plant Corn at (0,0), (0,1), (1,0), (1,1)
- **Action**: Harvest crop at (1,1)
- **Expected**:
  - Pattern detected: MonocultureBlock
  - Yield: base × 1.20

### Test 2.3: 2x2 block at each corner
- **Setup**: Plant Wheat at (3,3), (3,4), (4,3), (4,4) [bottom-right corner]
- **Action**: Harvest crop at (3,3)
- **Expected**:
  - Pattern detected: MonocultureBlock
  - Yield: base × 1.20

### Test 2.4: Incomplete 2x2 (3 crops)
- **Setup**: Plant Tomato at (1,1), (1,2), (2,1) [missing (2,2)]
- **Action**: Harvest crop at (1,1)
- **Expected**:
  - Pattern NOT detected
  - Yield: base

### Test 2.5: 2x3 rectangle (not square)
- **Setup**: Plant Lettuce at (1,1), (1,2), (1,3), (2,1), (2,2), (2,3)
- **Action**: Harvest crop at (1,1)
- **Expected**:
  - Pattern NOT detected (need exactly 2x2, not 2x3)
  - Yield: base

### Test 2.6: Overlapping blocks
- **Setup**: Plant Carrot at (0,0), (0,1), (0,2), (1,0), (1,1), (1,2)
- **Action**: Harvest crop at (0,1)
- **Expected**:
  - Pattern detected: MonocultureBlock
  - Yield: base × 1.20

---

## Test Group 3: Companion Planting
**Pattern**: Specific crop pairs adjacent  
**Bonuses**:
  - Wheat + Carrot: +10% yield
  - Corn + Lettuce: +5% yield + 5% water efficiency

### Test 3.1: Wheat + Carrot adjacent (horizontal)
- **Setup**: Plant Wheat at (2,2), Carrot at (2,3)
- **Action**: Harvest Wheat at (2,2)
- **Expected**:
  - Pattern detected: CompanionPlanting
  - Yield: base × 1.10
  - Water bonus applied (for future use)

### Test 3.2: Corn + Lettuce adjacent (vertical)
- **Setup**: Plant Corn at (0,0), Lettuce at (1,0)
- **Action**: Harvest Corn at (0,0)
- **Expected**:
  - Pattern detected: CompanionPlanting
  - Yield: base × 1.05
  - Water bonus: +5

### Test 3.3: Diagonal neighbors don't count
- **Setup**: Plant Wheat at (0,0), Carrot at (1,1) [diagonal]
- **Action**: Harvest Wheat at (0,0)
- **Expected**:
  - Pattern NOT detected
  - Yield: base

### Test 3.4: Non-companion pairs
- **Setup**: Plant Wheat at (1,1), Corn at (1,2)
- **Action**: Harvest Wheat at (1,1)
- **Expected**:
  - Pattern NOT detected
  - Yield: base

### Test 3.5: Multiple companions (wheat surrounded by carrots)
- **Setup**: Plant Wheat at (2,2), Carrot at (1,2), (3,2), (2,1), (2,3)
- **Action**: Harvest Wheat at (2,2)
- **Expected**:
  - Pattern detected: CompanionPlanting (bonus applied once, not per neighbor)
  - Yield: base × 1.10

---

## Test Group 4: Crop Diversity
**Pattern**: Center crop surrounded by 4 different crops (cardinal neighbors)  
**Bonus**: +25% yield, +5 fertility

### Test 4.1: All 4 neighbors different
- **Setup**: Plant Wheat at (2,2), Corn at (1,2), Lettuce at (3,2), Carrot at (2,1), Tomato at (2,3)
- **Action**: Harvest Wheat at (2,2)
- **Expected**:
  - Pattern detected: CropDiversity
  - Yield: base × 1.25
  - Fertility bonus: +5 (applied to plot after harvest)

### Test 4.2: One neighbor missing
- **Setup**: Plant Wheat at (0,0), Corn at (0,1), Lettuce at (1,0) [missing up and left]
- **Action**: Harvest Wheat at (0,0)
- **Expected**:
  - Pattern NOT detected (need exactly 4 neighbors)
  - Yield: base

### Test 4.3: Two neighbors same type
- **Setup**: Plant Wheat at (2,2), Corn at (1,2), Tomato at (3,2), Carrot at (2,1), Carrot at (2,3) [right same as left]
- **Action**: Harvest Wheat at (2,2)
- **Expected**:
  - Pattern NOT detected (all must be different)
  - Yield: base

### Test 4.4: Center crop same type as neighbor
- **Setup**: Plant Wheat at (2,2), Wheat at (1,2), Corn at (3,2), Lettuce at (2,1), Carrot at (2,3)
- **Action**: Harvest Wheat at (2,2)
- **Expected**:
  - Pattern NOT detected (neighbors must differ from center)
  - Yield: base

### Test 4.5: Fertility bonus application
- **Setup**: Plant Wheat at (1,1), surrounded by 4 different crops
- **Before harvest**: Fertility = 60
- **Action**: Harvest Wheat at (1,1)
- **Expected**:
  - New fertility = min(60 + 5, 100) = 65

### Test 4.6: Fertility capped at 100
- **Setup**: Plant Wheat at (1,1) surrounded by 4 different crops
- **Before harvest**: Fertility = 97
- **Action**: Harvest Wheat at (1,1)
- **Expected**:
  - New fertility = min(97 + 5, 100) = 100

---

## Test Group 5: Cross Pattern
**Pattern**: Center crop with same type in all 4 cardinal directions (+ shape)  
**Bonus**: +30% yield, +1 seed

### Test 5.1: Basic cross pattern
- **Setup**: Plant Wheat at (2,1), (2,2), (2,3), (1,2), (3,2)
- **Action**: Harvest center crop at (2,2)
- **Expected**:
  - Pattern detected: CrossPattern
  - Yield: base × 1.30
  - Seeds: +1

### Test 5.2: Center at different position
- **Setup**: Plant Corn at (1,0), (1,1), (1,2), (0,1), (2,1)
- **Action**: Harvest center at (1,1)
- **Expected**:
  - Pattern detected: CrossPattern
  - Yield: base × 1.30

### Test 5.3: Missing one arm
- **Setup**: Plant Lettuce at (2,0), (2,1), (2,2), (1,1) [missing down]
- **Action**: Harvest center at (2,1)
- **Expected**:
  - Pattern NOT detected
  - Yield: base

### Test 5.4: Different crop in one arm
- **Setup**: Plant Wheat at (2,0), (2,1), (2,2), (1,1), Corn at (3,1) [right is different]
- **Action**: Harvest center at (2,1)
- **Expected**:
  - Pattern NOT detected
  - Yield: base

### Test 5.5: Center position at boundary (no room for full cross)
- **Setup**: Plant Carrot at (0,0), (0,1) [can't fit cross at boundary]
- **Action**: Harvest at (0,0)
- **Expected**:
  - Pattern NOT detected (up and left neighbors out of bounds)
  - Yield: base

---

## Test Group 6: Pattern Stacking
**Pattern**: Multiple patterns apply to same crop  
**Stacking**: Yield multipliers stack multiplicatively

### Test 6.1: Row + Block combo
- **Setup**: Plant Wheat in 2x2 block AND in a row of 3+ horizontally
  ```
  [W][W][W]
  [W][W][E]
  [E][E][E]
  ```
- **Position**: (0,1) is in both row and block
- **Action**: Harvest at (0,1)
- **Expected**:
  - Patterns detected: MonocultureRow, MonocultureBlock
  - Yield: base × 1.15 × 1.20 = base × 1.38

### Test 6.2: Companion + Diversity
- **Setup**: Plant Wheat at center surrounded by Corn, Lettuce, Carrot, Tomato (diversity)
           AND adjacent to Wheat (companion)
- **Cannot achieve** due to diversity requirement (center must have 4 different neighbors)
- **Actual test**: This combination is impossible by design

### Test 6.3: Cross + Companion
- **Setup**: Plant Wheat in cross pattern AND next to Carrot (companion)
- **Action**: Harvest center wheat
- **Expected**:
  - Patterns detected: CrossPattern, CompanionPlanting
  - Yield: base × 1.30 × 1.10 = base × 1.43

### Test 6.4: Multiple patterns with all modifiers
- **Setup**: Complex grid with multiple patterns
- **All modifiers**: fertility × seasonal × water × pattern
- **Example calculation**:
  - Base: 10 points
  - Fertility (80%): ×0.8 = 8
  - Seasonal (Spring): ×1.1 = 8.8
  - Water (70%): ×1.0 = 8.8
  - Pattern: ×1.38 = 12.14 → 12 points
- **Expected**: Patterns stack correctly with existing modifiers

---

## Test Group 7: Checkerboard Pattern
**Pattern**: Alternating crops in 3x3 area  
**Bonus**: +10% yield, +2 water

### Test 7.1: Basic checkerboard
- **Setup**: 3x3 grid with alternating crops
  ```
  [A][B][A]
  [B][A][B]
  [A][B][A]
  ```
- **Action**: Harvest any A or B
- **Expected**:
  - Pattern detected: Checkerboard
  - Yield: base × 1.10

### Test 7.2: Checkerboard detected from any position
- **Setup**: Same as 7.1
- **Action**: Harvest center (A at 1,1)
- **Expected**:
  - Pattern detected: Checkerboard
  - Yield: base × 1.10

---

## Test Group 8: Perimeter Defense Pattern
**Pattern**: Center crop surrounded by 8 different crops (all neighbors different from center)  
**Bonus**: +40% yield, disease immunity

### Test 8.1: Basic perimeter defense
- **Setup**: Plant Wheat at center (1,1), surrounded by 8 non-Wheat crops
- **Action**: Harvest center
- **Expected**:
  - Pattern detected: PerimeterDefense
  - Yield: base × 1.40

### Test 8.2: One neighbor same as center
- **Setup**: Plant Wheat at (1,1), Wheat at (0,0) [corner], 7 other crops around
- **Action**: Harvest at (1,1)
- **Expected**:
  - Pattern NOT detected
  - Yield: base

---

## Test Group 9: Rotation Sequence Pattern
**Pattern**: 4 different crops in a line (horizontal or vertical)  
**Bonus**: +20% yield, +10 fertility

### Test 9.1: 4 different crops horizontally
- **Setup**: Plant Wheat at (2,0), Corn at (2,1), Carrot at (2,2), Lettuce at (2,3)
- **Action**: Harvest any crop
- **Expected**:
  - Pattern detected: RotationSequence
  - Yield: base × 1.20
  - Fertility: +10

### Test 9.2: 4 different crops vertically
- **Setup**: Plant Wheat at (0,0), Corn at (1,0), Carrot at (2,0), Lettuce at (3,0)
- **Action**: Harvest any crop
- **Expected**:
  - Pattern detected: RotationSequence
  - Yield: base × 1.20

### Test 9.3: Only 3 different crops
- **Setup**: Plant Wheat at (1,1), Corn at (1,2), Carrot at (1,3) [only 3]
- **Action**: Harvest
- **Expected**:
  - Pattern NOT detected
  - Yield: base

---

## Test Group 10: Edge Cases & Boundary Conditions

### Test 10.1: Pattern at grid corners
- **All patterns must handle grid boundaries correctly**
- Test each pattern at (0,0), (0,4), (4,0), (4,4)
- **Expected**: Patterns function correctly or correctly don't detect at edges

### Test 10.2: Immature crops don't count
- **Setup**: Plant 3 wheat horizontally, but middle crop not yet mature
- **Action**: Try to harvest mature crop at (0,0)
- **Expected**:
  - Pattern NOT detected (middle crop isn't counting due to immaturity)
  - Yield: base

### Test 10.3: Empty plots break patterns
- **Setup**: Plant wheat at (0,0), (0,1), empty at (0,2), wheat at (0,3)
- **Action**: Harvest at (0,0)
- **Expected**:
  - Pattern NOT detected (row broken by empty plot)
  - Yield: base

### Test 10.4: Patterns don't affect other plots
- **Setup**: Plant 2x2 block of corn, adjacent wheat
- **Action**: Harvest wheat (not in block)
- **Expected**:
  - Pattern NOT detected for wheat
  - Wheat yield: base

### Test 10.5: Harvesting clears patterns
- **Setup**: Plant 3 wheat in row, harvest middle
- **Remaining**: Wheat at (0,0), empty at (0,1), wheat at (0,2)
- **Action**: Harvest wheat at (0,0)
- **Expected**:
  - Pattern NOT detected (row is broken now)
  - Yield: base

---

## Test Group 11: Resource & Bonus Grants

### Test 11.1: Seed bonus from cross pattern
- **Setup**: Plant cross pattern
- **Before harvest**: Seeds = 5
- **Action**: Harvest center
- **Expected**:
  - Seeds = 5 + 1 = 6

### Test 11.2: Resource bonuses cap at max stack
- **Setup**: Plant multiple cross patterns
- **Before harvest**: Seeds = 498
- **Action**: Harvest 3 cross patterns (each +1 seed)
- **Expected**:
  - Seeds = min(498 + 3, 500) = 500

### Test 11.3: Fertility bonus caps at 100
- **Setup**: Plant diversity pattern
- **Before harvest**: Fertility = 96
- **Action**: Harvest crop
- **Expected**:
  - Fertility = min(96 + 5, 100) = 100

---

## Test Group 12: Integration Tests

### Test 12.1: Full 5x5 grid with multiple patterns
- **Setup**: Complex grid with strategic placement
- **Patterns present**: Rows, blocks, diversity zones, cross shapes
- **Action**: Harvest multiple crops
- **Verify**: Each harvest correctly identifies and applies patterns

### Test 12.2: Pattern bonus consistency
- **Setup**: Same grid harvested twice (reload or test)
- **Action**: Harvest same plot twice (different cycle)
- **Expected**: Same patterns detected both times

---

## Acceptance Criteria

✅ All patterns detected correctly based on grid state  
✅ Yield multipliers calculated and applied properly  
✅ Multipliers stack multiplicatively, not additively  
✅ Resource bonuses granted (seeds, fertility, water)  
✅ Bonuses capped at stack limits  
✅ Patterns work correctly at grid boundaries  
✅ Immature crops don't participate in patterns  
✅ Empty plots break patterns appropriately  
✅ Pattern detection is deterministic (no RNG)  
✅ Events emit correctly for each pattern  
✅ No pattern detection overhead on non-matching crops  

---

## Notes for QA/Testing

1. **Maturity**: Crops must be mature (current_time >= planted_at + growth_time) to participate in patterns
2. **Grid coordinates**: Grid is 5x5 (0-24 index), displayed as (row, col) where 0 ≤ row,col ≤ 4
3. **Cardinal directions**: Only up/down/left/right count (no diagonals) for adjacency
4. **Stacking**: Pattern bonuses multiply: final_yield = base × 0.8 × 1.1 × 1.0 × 1.38 = base × 1.212
5. **Events**: PatternDetected event should emit for each detected pattern with bonus details
6. **Read-only**: check_patterns instruction can preview patterns without modifying state
