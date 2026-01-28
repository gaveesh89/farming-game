"use client";

import { FC } from "react";
import { GRID_CONFIG, TileState, CROP_METADATA, CROP_TYPES, getCropGrowthStage, getFertilityColor } from "@/app/utils/gameHelpers";

interface Props {
    grid: TileState[][] | null;
    onTileClick?: (index: number, tile: TileState | null) => void;
}

export const FarmGrid: FC<Props> = ({ grid, onTileClick }) => {
    const tiles = Array.from({ length: GRID_CONFIG.TOTAL_TILES }, (_, i) => i);

    const getTileState = (index: number) => {
        if (!grid) return null;
        const row = Math.floor(index / GRID_CONFIG.COLS);
        const col = index % GRID_CONFIG.COLS;
        return grid[row]?.[col];
    };

    return (
        <div className="grid grid-cols-5 gap-2 max-w-[400px] mx-auto p-4 bg-amber-100 dark:bg-amber-900/30 rounded-lg shadow-lg border border-amber-200 dark:border-amber-800">
            {tiles.map((index) => {
                const tile = getTileState(index);
                const crop = tile && tile.cropType !== CROP_TYPES.EMPTY ? CROP_METADATA[tile.cropType] : null;

                return (
                    <button
                        key={index}
                        onClick={() => onTileClick?.(index, tile)}
                        className={`
              aspect-square rounded flex flex-col items-center justify-center font-mono text-xs border transition-all duration-200 relative overflow-hidden group
              ${crop
                                ? "bg-amber-200/80 hover:bg-amber-300/80 border-amber-300 dark:bg-amber-800/60 dark:border-amber-700"
                                : "bg-amber-800/5 hover:bg-amber-800/10 border-amber-900/5 dark:bg-white/5 dark:border-white/5"
                            }
            `}
                        title={tile ? `Tile ${index}: ${crop?.name || "Empty"}` : `Tile ${index}`}
                    >
                        {crop ? (
                            <div className="relative flex flex-col items-center">
                                {/* Growth stage emoji */}
                                {tile && tile.plantedAt > 0 && (
                                    <span className="text-2xl drop-shadow-sm transform group-hover:scale-110 transition-transform block">
                                        {getCropGrowthStage(
                                            tile.plantedAt,
                                            crop.growthTime,
                                            Math.floor(Date.now() / 1000),
                                            crop.growthStages
                                        ).emoji}
                                    </span>
                                )}

                                {/* Readiness Indicator */}
                                {tile?.isReady && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-sm border border-white" />
                                )}

                                {/* Timer if not ready */}
                                {tile && !tile.isReady && tile.timeRemaining > 0 && (
                                    <span className="text-[9px] text-amber-900/70 dark:text-amber-100/70 font-bold mt-1 block">
                                        {tile.timeRemaining}s
                                    </span>
                                )}
                                
                                {/* Fertility indicator */}
                                {tile && (
                                    <span className={`text-[8px] font-bold mt-0.5 ${getFertilityColor(tile.fertility)}`}>
                                        {tile.fertility}%
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-0.5">
                                <span className="text-amber-900/20 dark:text-white/10 group-hover:text-amber-900/40">{index}</span>
                                {/* Show fertility even on empty tiles */}
                                {tile && (
                                    <span className={`text-[8px] font-bold ${getFertilityColor(tile.fertility)}`}>
                                        {tile.fertility}%
                                    </span>
                                )}
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
};
