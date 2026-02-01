/**
 * Frontend Helper Utilities for Farming Game
 * 
 * This module provides client-side utilities for interacting with the farming game program.
 */

import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

/**
 * Program ID for the farming game
 * Update this with your deployed program ID
 */
export const FARMING_GAME_PROGRAM_ID = new PublicKey(
    "8NND7mQn5q7UQcrVrzrQfsHwYruqnQshMjFuwq4WBaHR"
);

/**
 * Derives the PlayerAccount PDA for a given wallet
 * 
 * Seeds: ["player", wallet_pubkey]
 * 
 * @param walletPublicKey - The player's wallet public key
 * @param programId - The farming game program ID (optional, uses default if not provided)
 * @returns The PDA address and bump seed
 * 
 * @example
 * const [playerPDA, bump] = await derivePlayerPDA(wallet.publicKey);
 */
export async function derivePlayerPDA(
    walletPublicKey: PublicKey,
    programId: PublicKey = FARMING_GAME_PROGRAM_ID
): Promise<[PublicKey, number]> {
    return await PublicKey.findProgramAddress(
        [Buffer.from("player"), walletPublicKey.toBuffer()],
        programId
    );
}

/**
 * Synchronous version of derivePlayerPDA
 */
export function derivePlayerPDASync(
    walletPublicKey: PublicKey,
    programId: PublicKey = FARMING_GAME_PROGRAM_ID
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("player"), walletPublicKey.toBuffer()],
        programId
    );
}

/**
 * Crop type constants
 */
export const CROP_TYPES = {
    EMPTY: 0,
    WHEAT: 1,
    CORN: 2,
} as const;

export type CropType = typeof CROP_TYPES[keyof typeof CROP_TYPES];

/**
 * Crop metadata
 */
export const CROP_METADATA = {
    [CROP_TYPES.WHEAT]: {
        name: "Wheat",
        growthTime: 30, // seconds
        reward: 1, // coins
        emoji: "🌾",
    },
    [CROP_TYPES.CORN]: {
        name: "Corn",
        growthTime: 60, // seconds
        reward: 2, // coins
        emoji: "🌽",
    },
} as const;

/**
 * Farm grid configuration
 */
export const GRID_CONFIG = {
    ROWS: 5,
    COLS: 5,
    TOTAL_TILES: 25,
} as const;

/**
 * Converts a tile index (0..24) to grid coordinates (row, col)
 * 
 * Grid layout (5x5):
 * ```
 * 0  1  2  3  4
 * 5  6  7  8  9
 * 10 11 12 13 14
 * 15 16 17 18 19
 * 20 21 22 23 24
 * ```
 * 
 * @param tileIndex - The tile index (0..24)
 * @returns Object with row and col (both 0-indexed)
 * 
 * @example
 * tileIndexToCoords(0)  // { row: 0, col: 0 }
 * tileIndexToCoords(12) // { row: 2, col: 2 } (center)
 * tileIndexToCoords(24) // { row: 4, col: 4 }
 */
export function tileIndexToCoords(tileIndex: number): { row: number; col: number } {
    if (tileIndex < 0 || tileIndex >= GRID_CONFIG.TOTAL_TILES) {
        throw new Error(`Invalid tile index: ${tileIndex}. Must be 0..24`);
    }

    const row = Math.floor(tileIndex / GRID_CONFIG.COLS);
    const col = tileIndex % GRID_CONFIG.COLS;

    return { row, col };
}

/**
 * Converts grid coordinates (row, col) to a tile index
 * 
 * @param row - Row number (0..4)
 * @param col - Column number (0..4)
 * @returns Tile index (0..24)
 * 
 * @example
 * coordsToTileIndex(0, 0)  // 0
 * coordsToTileIndex(2, 2)  // 12 (center)
 * coordsToTileIndex(4, 4)  // 24
 */
export function coordsToTileIndex(row: number, col: number): number {
    if (row < 0 || row >= GRID_CONFIG.ROWS) {
        throw new Error(`Invalid row: ${row}. Must be 0..4`);
    }
    if (col < 0 || col >= GRID_CONFIG.COLS) {
        throw new Error(`Invalid col: ${col}. Must be 0..4`);
    }

    return row * GRID_CONFIG.COLS + col;
}

/**
 * Tile state interface
 */
export interface TileState {
    cropType: CropType;
    plantedAt: number; // Unix timestamp
    isReady: boolean;
    timeRemaining: number; // seconds until ready (0 if ready)
}

/**
 * Calculates if a crop is ready to harvest and time remaining
 * 
 * @param cropType - Type of crop planted
 * @param plantedAt - Unix timestamp when planted
 * @param currentTime - Current Unix timestamp (optional, defaults to now)
 * @returns Tile state with readiness info
 */
export function calculateTileState(
    cropType: number,
    plantedAt: number,
    currentTime?: number
): TileState {
    const now = currentTime ?? Math.floor(Date.now() / 1000);

    if (cropType === CROP_TYPES.EMPTY) {
        return {
            cropType: CROP_TYPES.EMPTY,
            plantedAt: 0,
            isReady: false,
            timeRemaining: 0,
        };
    }

    const metadata = CROP_METADATA[cropType as keyof typeof CROP_METADATA];
    if (!metadata) {
        throw new Error(`Unknown crop type: ${cropType}`);
    }

    const timeElapsed = now - plantedAt;
    const timeRemaining = Math.max(0, metadata.growthTime - timeElapsed);
    const isReady = timeRemaining === 0;

    return {
        cropType: cropType as CropType,
        plantedAt,
        isReady,
        timeRemaining,
    };
}

/**
 * Formats time remaining in human-readable format
 * 
 * @param seconds - Number of seconds
 * @returns Formatted string (e.g., "1m 30s", "45s")
 */
export function formatTimeRemaining(seconds: number): string {
    if (seconds <= 0) return "Ready!";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
}

/**
 * Creates a 2D grid representation of farm tiles
 * 
 * @param tiles - Array of 25 tiles from PlayerAccount
 * @param currentTime - Current Unix timestamp (optional)
 * @returns 5x5 grid of tile states
 */
export function createFarmGrid(
    tiles: Array<{ cropType: number; plantedAt: any }>,
    currentTime?: number
): TileState[][] {
    if (tiles.length !== GRID_CONFIG.TOTAL_TILES) {
        throw new Error(`Expected ${GRID_CONFIG.TOTAL_TILES} tiles, got ${tiles.length}`);
    }

    const grid: TileState[][] = [];

    for (let row = 0; row < GRID_CONFIG.ROWS; row++) {
        grid[row] = [];
        for (let col = 0; col < GRID_CONFIG.COLS; col++) {
            const tileIndex = coordsToTileIndex(row, col);
            const tile = tiles[tileIndex];

            // Convert BN to number if needed
            const plantedAt = typeof tile.plantedAt === 'number'
                ? tile.plantedAt
                : tile.plantedAt.toNumber();

            grid[row][col] = calculateTileState(tile.cropType, plantedAt, currentTime);
        }
    }

    return grid;
}

/**
 * Account size calculation constants for reference
 */
export const ACCOUNT_SIZES = {
    DISCRIMINATOR: 8,
    PUBKEY: 32,
    U64: 8,
    FARM_TILE: 9, // 1 (crop_type) + 8 (planted_at)
    PLAYER_ACCOUNT: 273, // 8 + 32 + 8 + (25 * 9)
} as const;
