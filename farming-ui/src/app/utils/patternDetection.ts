/**
 * Pattern Detection Utilities for Frontend Visualization
 * Detects farming patterns for visual highlighting
 */

import { TileState, CROP_TYPES } from "./gameHelpers";

export interface PatternInfo {
  name: string;
  bonus: number;
  color: string;
  participatingPlots: number[];
}

/**
 * Detect all patterns that include a specific plot
 */
export function detectPatternsForPlot(
  grid: TileState[][],
  plotIndex: number
): PatternInfo[] {
  const patterns: PatternInfo[] = [];
  const row = Math.floor(plotIndex / 5);
  const col = plotIndex % 5;
  const tile = grid[row]?.[col];

  if (!tile || tile.cropType === CROP_TYPES.EMPTY || !tile.isReady) {
    return patterns;
  }

  const cropType = tile.cropType;

  // Check Row Pattern (3+ same crop in a row)
  const rowPattern = checkRowPattern(grid, row, col, cropType);
  if (rowPattern) patterns.push(rowPattern);

  // Check Block Pattern (2x2 same crop)
  const blockPattern = checkBlockPattern(grid, row, col, cropType);
  if (blockPattern) patterns.push(blockPattern);

  // Check Companion Pattern (adjacent to different crop)
  const companionPattern = checkCompanionPattern(grid, row, col, cropType);
  if (companionPattern) patterns.push(companionPattern);

  // Check Cross Pattern (5 crops in + shape)
  const crossPattern = checkCrossPattern(grid, row, col, cropType);
  if (crossPattern) patterns.push(crossPattern);

  // Check Perimeter Pattern (crops on edge)
  const perimeterPattern = checkPerimeterPattern(grid, row, col, cropType);
  if (perimeterPattern) patterns.push(perimeterPattern);

  // Check Diversity Pattern (all 5 crop types ready)
  const diversityPattern = checkDiversityPattern(grid, plotIndex);
  if (diversityPattern) patterns.push(diversityPattern);

  return patterns;
}

function checkRowPattern(
  grid: TileState[][],
  row: number,
  col: number,
  cropType: number
): PatternInfo | null {
  // Check horizontal row
  let count = 1;
  const plots = [row * 5 + col];

  // Check left
  for (let c = col - 1; c >= 0; c--) {
    const t = grid[row]?.[c];
    if (t && t.cropType === cropType && t.isReady) {
      count++;
      plots.push(row * 5 + c);
    } else break;
  }

  // Check right
  for (let c = col + 1; c < 5; c++) {
    const t = grid[row]?.[c];
    if (t && t.cropType === cropType && t.isReady) {
      count++;
      plots.push(row * 5 + c);
    } else break;
  }

  if (count >= 3) {
    return {
      name: "Row Pattern",
      bonus: 15,
      color: "rgb(59, 130, 246)", // blue
      participatingPlots: plots,
    };
  }

  return null;
}

function checkBlockPattern(
  grid: TileState[][],
  row: number,
  col: number,
  cropType: number
): PatternInfo | null {
  // Check all possible 2x2 blocks this tile could be part of
  const offsets = [
    [0, 0], // Top-left
    [0, -1], // Top-right
    [-1, 0], // Bottom-left
    [-1, -1], // Bottom-right
  ];

  for (const [dr, dc] of offsets) {
    const r = row + dr;
    const c = col + dc;

    if (r < 0 || r >= 4 || c < 0 || c >= 4) continue;

    // Check 2x2 block
    const plots: number[] = [];
    let allMatch = true;

    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        const tile = grid[r + i]?.[c + j];
        const idx = (r + i) * 5 + (c + j);
        if (tile && tile.cropType === cropType && tile.isReady) {
          plots.push(idx);
        } else {
          allMatch = false;
          break;
        }
      }
      if (!allMatch) break;
    }

    if (allMatch && plots.length === 4) {
      return {
        name: "Block Pattern",
        bonus: 20,
        color: "rgb(34, 197, 94)", // green
        participatingPlots: plots,
      };
    }
  }

  return null;
}

function checkCompanionPattern(
  grid: TileState[][],
  row: number,
  col: number,
  cropType: number
): PatternInfo | null {
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  const plots = [row * 5 + col];

  for (const [dr, dc] of directions) {
    const r = row + dr;
    const c = col + dc;
    if (r >= 0 && r < 5 && c >= 0 && c < 5) {
      const tile = grid[r]?.[c];
      if (
        tile &&
        tile.cropType !== CROP_TYPES.EMPTY &&
        tile.cropType !== cropType &&
        tile.isReady
      ) {
        plots.push(r * 5 + c);
        return {
          name: "Companion Planting",
          bonus: 10,
          color: "rgb(251, 191, 36)", // amber
          participatingPlots: plots,
        };
      }
    }
  }

  return null;
}

function checkCrossPattern(
  grid: TileState[][],
  row: number,
  col: number,
  cropType: number
): PatternInfo | null {
  // Check if this is the center of a cross (requires center + 4 directions)
  const directions = [
    [-1, 0], // up
    [1, 0], // down
    [0, -1], // left
    [0, 1], // right
  ];

  const plots = [row * 5 + col];
  let allMatch = true;

  for (const [dr, dc] of directions) {
    const r = row + dr;
    const c = col + dc;
    if (r >= 0 && r < 5 && c >= 0 && c < 5) {
      const tile = grid[r]?.[c];
      if (tile && tile.cropType === cropType && tile.isReady) {
        plots.push(r * 5 + c);
      } else {
        allMatch = false;
        break;
      }
    } else {
      allMatch = false;
      break;
    }
  }

  if (allMatch && plots.length === 5) {
    return {
      name: "Cross Pattern",
      bonus: 25,
      color: "rgb(168, 85, 247)", // purple
      participatingPlots: plots,
    };
  }

  return null;
}

function checkPerimeterPattern(
  grid: TileState[][],
  row: number,
  col: number,
  cropType: number
): PatternInfo | null {
  const isEdge = row === 0 || row === 4 || col === 0 || col === 4;

  if (!isEdge) return null;

  // Count all edge plots with same crop type
  const plots: number[] = [];

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const isEdgePlot = r === 0 || r === 4 || c === 0 || c === 4;
      if (isEdgePlot) {
        const tile = grid[r]?.[c];
        if (tile && tile.cropType === cropType && tile.isReady) {
          plots.push(r * 5 + c);
        }
      }
    }
  }

  if (plots.length >= 8) {
    return {
      name: "Perimeter Defense",
      bonus: 15,
      color: "rgb(239, 68, 68)", // red
      participatingPlots: plots,
    };
  }

  return null;
}

function checkDiversityPattern(
  grid: TileState[][],
  plotIndex: number
): PatternInfo | null {
  const cropTypesReady = new Set<number>();
  const allPlots: number[] = [];

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const tile = grid[r]?.[c];
      const idx = r * 5 + c;
      if (tile && tile.cropType !== CROP_TYPES.EMPTY && tile.isReady) {
        cropTypesReady.add(tile.cropType);
        allPlots.push(idx);
      }
    }
  }

  if (cropTypesReady.size === 5) {
    return {
      name: "Biodiversity Bonus",
      bonus: 20,
      color: "rgb(236, 72, 153)", // pink
      participatingPlots: allPlots,
    };
  }

  return null;
}
