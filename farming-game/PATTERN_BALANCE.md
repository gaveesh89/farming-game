# Pattern Synergies System - Balance Documentation

## Pattern Balance Analysis

This document provides comprehensive balance data for all 8 crop synergy patterns, including detection requirements, bonuses, strategic tradeoffs, and design rationale.

---

## Pattern Summary Table

| Pattern | Tier | Yield Bonus | Fertility | Water | Resource | Rarity | Difficulty | Strategic Value |
|---------|------|-------------|-----------|-------|----------|--------|------------|-----------------|
| Monoculture Row | 1 | +15% | 0 | 0 | - | Medium | Low | Safe, reliable |
| Monoculture Block | 1 | +20% | 0 | 0 | - | Low | Low | Powerful basic |
| Companion Planting | 1 | +5-10% | 0 | 0-5% | - | Medium | Low | Utility |
| Crop Diversity | 2 | +25% | +5 | 0 | - | Low | Medium | Balanced |
| Cross Pattern | 2 | +30% | 0 | 0 | +1 seed | Very Low | High | Premium reward |
| Checkerboard | 2 | +10% | 0 | +2 | - | Very Low | High | Aesthetic |
| Perimeter Defense | 3 | +40% | 0 | 0 | - | Extremely Low | Very High | Challenge reward |
| Rotation Sequence | 3 | +20% | +10 | 0 | - | Very Low | Very High | Long-term invest |

---

## Detailed Pattern Specifications

### TIER 1: Foundational Patterns (Easy Discovery)

#### 1. Monoculture Row
**Detection Requirements:**
- 3+ crops of same type in a horizontal or vertical line
- At least one of the crops must be the harvested crop
- All intermediate plots must have the same crop type
- Crops must be mature

**Visual Example:**
```
[Wheat][Wheat][Wheat][Corn ][Empty]
Harvest middle Wheat → +15% bonus
```

**Bonus Details:**
- **Yield**: +15% (×1.15 multiplier)
- **Fertility**: None
- **Water**: None
- **Resources**: None

**Strategic Implications:**
- ✅ Pros: Simple to achieve, no resource investment, reliable
- ❌ Cons: Takes up valuable horizontal/vertical space, blocks cross patterns
- **Playstyle**: Beginners, efficiency-focused players
- **Trade-off**: Sacrifices grid diversity for guaranteed yield boost

**Balance Rationale:**
- 15% is moderate enough to not be overpowered
- Requires 3 plots minimum, forcing commitment
- Easy to understand pattern encourages early game mastery

---

#### 2. Monoculture Block
**Detection Requirements:**
- 2×2 square of identical crops
- Harvested crop can be any of the 4 positions
- All 4 plots must have same crop type
- All 4 crops must be mature

**Visual Example:**
```
[Wheat][Wheat][Empty]
[Wheat][Wheat][Empty]
[Empty][Empty][Empty]
All 4 Wheat form a block → +20% each when harvested
```

**Bonus Details:**
- **Yield**: +20% (×1.20 multiplier)
- **Fertility**: None
- **Water**: None
- **Resources**: None

**Strategic Implications:**
- ✅ Pros: Compact (4 plots only), +20% reward is powerful, enables stacking with rows
- ❌ Cons: Takes 4 plots, reduces field diversity, rigid 2×2 constraint
- **Playstyle**: Mid-game players, spatial planners
- **Trade-off**: Requires 4 plots vs. row's 3 for slightly better bonus

**Balance Rationale:**
- +20% vs +15% reflects the more compact use of space
- 2×2 is memorable and easy to visualize
- Stacks well with rows for players who plan ahead

---

#### 3. Companion Planting
**Detection Requirements:**
- Two adjacent crops (cardinal neighbors only, no diagonals)
- Specific pairing requirements:
  - Wheat + Carrot: +10% yield
  - Corn + Lettuce: +5% yield + 5% water bonus
- Only applies bonus to the harvested crop

**Visual Example:**
```
[Wheat][Carrot]  ← Wheat gets +10% when harvested
Harvest Wheat → Bonus applied!
```

**Bonus Details - Wheat + Carrot:**
- **Yield**: +10% (×1.10 multiplier)
- **Fertility**: None
- **Water**: None
- **Resources**: None

**Bonus Details - Corn + Lettuce:**
- **Yield**: +5% (×1.05 multiplier)
- **Fertility**: None
- **Water**: +5% efficiency
- **Resources**: None

**Strategic Implications:**
- ✅ Pros: Very flexible, works with any grid layout, multiple combinations
- ❌ Cons: Small bonuses, requires specific crop pairs, only helps harvested crop
- **Playstyle**: Narrative/learning players, mixed crop farmers
- **Trade-off**: Small bonuses but flexible placement

**Balance Rationale:**
- Real companion planting inspiration (agricultural knowledge)
- Wheat+Carrot: 10% (strong pairing, nitrogen-fixing)
- Corn+Lettuce: 5% + water (shade tolerance)
- Bonuses are modest but don't punish diversity

---

### TIER 2: Advanced Patterns (Medium Discovery)

#### 4. Crop Diversity
**Detection Requirements:**
- Center crop surrounded by 4 cardinal neighbors
- All 4 neighbors must be DIFFERENT from center
- All 4 neighbors must be DIFFERENT from each other (no duplicates)
- Center crop can be any type
- All 5 crops must be mature

**Visual Example:**
```
    [Corn]
    [  ↑  ]
[Wheat][Carrot][Lettuce]
    [  ↓  ]
    [Tomato]
Center Carrot with 4 different neighbors → +25% + 5 fertility!
```

**Bonus Details:**
- **Yield**: +25% (×1.25 multiplier)
- **Fertility**: +5 (added to plot after harvest)
- **Water**: None
- **Resources**: None

**Strategic Implications:**
- ✅ Pros: Highest base yield% in early patterns, fertilty restoration, encourages biodiversity
- ❌ Cons: Requires 5 plots (center + 4), high precision, nearly impossible at grid boundaries
- **Playstyle**: Advanced planners, biodiversity enthusiasts
- **Trade-off**: Sacrifice space/monoculture for yield AND soil recovery

**Balance Rationale:**
- 25% is significant reward for complexity
- +5 fertility balances the fertility loss from harvesting
- Encourages organic, diverse farming
- Boundary exclusion (only interior crops) maintains balance

**Crop Diversity Impact:**
- Encourages planting all 5 crop types
- Creates natural "respite zones" in field
- Reduces monoculture risk (disease/pest resistance simulation)

---

#### 5. Cross Pattern
**Detection Requirements:**
- Center crop with identical crops in all 4 cardinal directions (+ shape)
- 5 total plots (center + 4 arms)
- All must be same crop type
- Center must be interior (1,1) to (3,3) only (can't execute at boundary)
- All 5 crops must be mature

**Visual Example:**
```
      [Wheat]
      [  ↑  ]
[Wheat][Wheat][Wheat]
          ↓
     [Wheat]
Cross pattern of Wheat → +30% + 1 seed bonus!
```

**Bonus Details:**
- **Yield**: +30% (×1.30 multiplier)
- **Fertility**: None
- **Water**: None
- **Resources**: +1 seed (added to player inventory)

**Strategic Implications:**
- ✅ Pros: Iconic visual pattern, highest yield% of tier 2, seed production, fun/memorable
- ❌ Cons: Requires 5 same crops, position restricted (only interior), easy to break
- **Playstyle**: Achievement hunters, optimizers, strategic planners
- **Trade-off**: Most rigid pattern, but most satisfying reward

**Balance Rationale:**
- +30% reflects the elegance and precision required
- +1 seed incentivizes pattern chasing
- Interior-only ensures players can't hide optimal patterns at boundaries
- Visually distinctive (+ shape is iconic in farming games)

**Strategic Mastery:**
- Once players achieve this, they understand spatial planning
- Seed bonus creates positive feedback loop
- Natural progression: row → block → cross

---

#### 6. Checkerboard
**Detection Requirements:**
- 3×3 area with alternating crop types
- Two alternating crops A and B fill the board:
  ```
  [A][B][A]
  [B][A][B]
  [A][B][A]
  ```
- All 9 crops must be same maturity state (mature)
- Can detect from any position within 3×3

**Visual Example:**
```
[Wheat][Corn ][Wheat]
[Corn ][Wheat][Corn ]  ← Checkerboard pattern!
[Wheat][Corn ][Wheat]
```

**Bonus Details:**
- **Yield**: +10% (×1.10 multiplier)
- **Fertility**: None
- **Water**: +2 (soil moisture efficiency)
- **Resources**: None

**Strategic Implications:**
- ✅ Pros: Visually beautiful, uses 9 plots compactly, teaches grid thinking
- ❌ Cons: Very rigid pattern, requires extreme coordination, relatively small yield bonus
- **Playstyle**: Aesthetic/creative players, puzzle enthusiasts
- **Trade-off**: Beauty over efficiency (10% is modest)

**Balance Rationale:**
- 10% is modest, reflecting the pattern's rigidity
- +2 water is practical utility, not game-breaking
- Encourages players to think about grid as whole
- Checkerboard is agriculturally nonsensical (justifies low bonus)

---

#### 7. Perimeter Defense
**Detection Requirements:**
- 3×3 area with different crop types around center
- Center can be any crop (A)
- All 8 surrounding positions must have crops
- All 8 surrounding positions must be DIFFERENT from center
- Surrounding crops can be same as each other (unlike diversity)
- Center must be interior position only (1,1) to (3,3)
- All 9 crops must be mature

**Visual Example:**
```
[B][C][D]
[E][A][F]  ← Center A surrounded by 8 crops != A
[G][H][I]
"Defended" center crop = perimeter defense!
```

**Bonus Details:**
- **Yield**: +40% (×1.40 multiplier)
- **Fertility**: None
- **Water**: None
- **Resources**: None (disease immunity is mechanical simulation)

**Strategic Implications:**
- ✅ Pros: Highest yield bonus (40%!), unique mechanic (defensive thinking), epic challenge
- ❌ Cons: Requires 9 plots, massive space commitment, must border all 8 neighbors
- **Playstyle**: Hardcore players, completionists, challenge seekers
- **Trade-off**: Uses 9 plots for 40% on just 1 crop (ROI on 1/9 only)

**Balance Rationale:**
- +40% reflects the extreme coordination and space cost
- Highest bonus in game for single harvest
- "Defense" theme encourages protecting crops strategically
- Limited to interior prevents boundary abuse

**Mechanical Insight:**
- While only center gets bonus, surrounding crops create "buffer zone"
- Encourages thinking about field holistically
- Game's most ambitious pattern

---

### TIER 3: Mastery Patterns (Rare Discovery)

#### 8. Rotation Sequence
**Detection Requirements:**
- 4 different crops in a straight line (horizontal or vertical)
- All 4 crop types must be unique (no duplicates)
- Line can be at any position on grid
- All 4 crops must be mature
- Order doesn't matter (any 4 different crops in a line)

**Visual Example:**
```
[Wheat][Corn][Carrot][Lettuce] ← 4 different crops in row!
Harvest any → +20% + 10 fertility
```

**Bonus Details:**
- **Yield**: +20% (×1.20 multiplier)
- **Fertility**: +10 (significant soil restoration)
- **Water**: None
- **Resources**: None

**Strategic Implications:**
- ✅ Pros: +10 fertility is highest restoration, rewards long-term thinking, achievable anywhere
- ❌ Cons: Requires all 4 crop types, must plan ahead, 4 plots minimum
- **Playstyle**: Long-term planners, crop rotators (agricultural tradition), narrative farmers
- **Trade-off**: Modest 20% yield but exceptional fertility restoration (+10 is huge!)

**Balance Rationale:**
- +20% yield mirrors monoculture row but requires different crops
- +10 fertility is exceptional (worth 2 crop diversity bonuses)
- Mirrors real crop rotation practice (4-year rotation common in agriculture)
- Line flexibility (any row/col) makes it more accessible than cross

**Agricultural Connection:**
- Real practice: rotate crop families to restore soil
- Game implementation: rewards players who diversify and plan ahead
- "Sequence" implies intentional planning, not random placement

---

## Comparative Analysis

### Yield Bonus Ranking
```
1. Perimeter Defense:    +40% (tier 3, extreme)
2. Crop Diversity:       +25% (tier 2, high)
3. Cross Pattern:        +30% (tier 2, high)
4. Monoculture Block:    +20% (tier 1, moderate)
5. Rotation Sequence:    +20% (tier 3, moderate)
6. Monoculture Row:      +15% (tier 1, moderate)
7. Companion Planting:   +5-10% (tier 1, low)
8. Checkerboard:         +10% (tier 2, low)
```

### Complexity vs. Reward
```
High Complexity, High Reward:
  - Perimeter Defense (40%, needs 9 plots)
  - Cross Pattern (30%, needs 5 specific plots)
  
Medium Complexity, Medium Reward:
  - Crop Diversity (25%, needs 5 plots, flexible)
  - Rotation Sequence (20%, needs 4 different crops)
  
Low Complexity, Moderate Reward:
  - Monoculture Block (20%, needs 4 same crops)
  - Monoculture Row (15%, needs 3 same crops)
  
Flexibility Rewards:
  - Companion Planting (10%, very flexible, utility)
  - Checkerboard (10%, 9 plots but preset)
```

### Pattern Stacking Potential
**Best Stackers** (complement each other):
1. Monoculture Row + Monoculture Block = 1.15 × 1.20 = 1.38 (38% total)
2. Cross Pattern + Companion Planting = 1.30 × 1.10 = 1.43 (43% total)
3. Rotation Sequence + none (incompatible with monoculture patterns)

**Impossible Stacks** (mutually exclusive):
- Crop Diversity + Monoculture (can't have center same as neighbors)
- Perimeter Defense + Diversity (too different)

---

## Strategic Playstyles Enabled

### 1. "Maximalist" (Monoculture Focus)
- **Core pattern**: Monoculture Block
- **Secondary**: Monoculture Row
- **Stack value**: Up to 1.38× (38%)
- **Trade-off**: No diversity, high disease risk (thematic)
- **Reward**: Reliable, predictable bonuses

### 2. "Organic Farmer" (Diversity Focus)
- **Core pattern**: Crop Diversity
- **Secondary**: Companion Planting (selective)
- **Stack value**: Up to 1.25× + fertility
- **Trade-off**: Lower raw yield%, requires planning
- **Reward**: Soil restoration, sustainability theme

### 3. "Architect" (Spatial Optimization)
- **Core pattern**: Cross Pattern + Checkerboard + Perimeter Defense
- **Secondary**: Rotation Sequence
- **Stack value**: Highest individual yields (40%+ possible)
- **Trade-off**: Extreme complexity, very tight constraints
- **Reward**: Mastery, visual satisfaction, prestige

### 4. "Pragmatist" (Mixed Approach)
- **Core pattern**: Monoculture Row (easy baseline)
- **Secondary**: Cross Pattern (skill progression)
- **Stack value**: 1.15 × 1.30 = 1.50 (50% total possible)
- **Trade-off**: Moderate complexity for excellent rewards
- **Reward**: Balanced progression, learning journey

---

## Balance Verification Checklist

✅ **No pattern is too weak**: Lowest bonus (5-10%) still valuable  
✅ **No pattern is too strong**: Highest bonus (40%) requires 9-plot commitment  
✅ **Variety enabled**: All crop types can participate in multiple patterns  
✅ **Progression curve**: Tier 1 (easy) → Tier 2 (medium) → Tier 3 (hard)  
✅ **Fair tradeoffs**: Complexity rewarded proportionally  
✅ **Stacking balanced**: Multiplicative stacking prevents overpowering  
✅ **Boundary safe**: Interior-only patterns don't punish edge farming  
✅ **Immature crop handling**: Prevents "lucky" bonuses from new players  
✅ **Resource economy**: Seed bonuses don't inflate economy  
✅ **Accessibility**: Beginners can achieve tier 1 patterns quickly  

---

## Design Philosophy

1. **Deterministic**: All detection is mathematically certain, no RNG
2. **Spatial**: Rewards thinking in 2D grid coordinates
3. **Educational**: Teaches agricultural principles (rotation, companion planting)
4. **Emergent**: Players discover optimal strategies through experimentation
5. **Balanced**: Every pattern has strengths and limitations
6. **Rewarding**: Skill and planning directly translate to yield
7. **Accessible**: From casual (rows/blocks) to hardcore (perimeter defense)

---

## Future Expansion Ideas

If more patterns are needed:

- **Chain Reaction**: 5 crops in specific sequence reward cascading bonuses
- **Zodiac Patterns**: Cross, X, T, L shapes with different bonuses
- **Spiral Pattern**: Crops spiraling inward/outward from center
- **Color Wheel**: 3 crops in specific color arrangement (purely thematic)

All would follow the principle: **More complexity = Higher reward, but never overpowered**.
