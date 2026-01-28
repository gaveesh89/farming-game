"use client";

import { FC, useState } from "react";
import { GRID_CONFIG, TileState, CROP_METADATA, CROP_TYPES, getCropGrowthStage, getFertilityColor } from "@/app/utils/gameHelpers";
import TileTooltip from "./TileTooltip";

interface Props {
    grid: TileState[][] | null;
    onTileClick?: (index: number, tile: TileState | null) => void;
}

export const FarmGrid: FC<Props> = ({ grid, onTileClick }) => {
    const tiles = Array.from({ length: GRID_CONFIG.TOTAL_TILES }, (_, i) => i);
    const [hoveredTile, setHoveredTile] = useState<number | null>(null);

    const getTileState = (index: number) => {
        if (!grid) return null;
        const row = Math.floor(index / GRID_CONFIG.COLS);
        const col = index % GRID_CONFIG.COLS;
        return grid[row]?.[col];
    };

    const getHarvestStatus = (tile: TileState | null) => {
        if (!tile || tile.cropType === CROP_TYPES.EMPTY) return null;
        
        const crop = CROP_METADATA[tile.cropType];
        if (!crop) return null;

        const timeElapsed = Math.floor(Date.now() / 1000) - tile.plantedAt;
        const timeSinceMature = timeElapsed - crop.growthTime;

        if (timeSinceMature < 0) return 'growing';
        if (timeSinceMature <= 20) return 'ready'; // Optimal window (20s)
        if (timeSinceMature <= 60) return 'late'; // Max decay time (60s)
        return 'overdue';
    };

    const isRotationBonus = (tile: TileState | null) => {
        return tile && tile.lastCropType !== 0 && tile.lastCropType !== tile.cropType;
    };

    return (
        <div className="grid grid-cols-5 gap-2 max-w-[500px] mx-auto p-4 bg-amber-100 dark:bg-amber-900/30 rounded-lg shadow-lg border border-amber-200 dark:border-amber-800">
            {tiles.map((index) => {
                const tile = getTileState(index);
                const crop = tile && tile.cropType !== CROP_TYPES.EMPTY ? CROP_METADATA[tile.cropType] : null;
                const harvestStatus = getHarvestStatus(tile);
                const hasRotationBonus = isRotationBonus(tile);

                return (
                    <div key={index} className="relative">
                        <button
                            onClick={() => onTileClick?.(index, tile)}
                            onMouseEnter={() => setHoveredTile(index)}
                            onMouseLeave={() => setHoveredTile(null)}
                            className={`
              aspect-square rounded-lg flex flex-col items-center justify-center font-mono text-xs border-2 transition-all duration-200 relative overflow-visible group w-full
              ${harvestStatus === 'ready' ? 'harvest-ready' : ''}
              ${harvestStatus === 'late' || harvestStatus === 'overdue' ? 'harvest-late' : ''}
              ${crop
                                    ? "bg-amber-200/80 hover:bg-amber-300/80 border-amber-300 dark:bg-amber-800/60 dark:border-amber-700"
                                    : "bg-amber-800/5 hover:bg-amber-800/10 border-amber-900/5 dark:bg-white/5 dark:border-white/5"
                                }
              ${!crop && !harvestStatus ? 'hover:scale-105' : ''}
            `}
                        >
                        {crop ? (
                            <div className="relative flex flex-col items-center w-full">
                                {/* Rotation Bonus Badge */}
                                {hasRotationBonus && (
                                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg badge-pop z-10 border border-white">
                                        +10%
                                    </div>
                                )}

                                {/* Restorative Crop Indicator */}
                                {crop.isRestorative && (
                                    <div className="absolute -top-2 -left-2 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg z-10 border border-white">
                                        ♻️
                                    </div>
                                )}

                                {/* Growth stage emoji */}
                                {tile && tile.plantedAt > 0 && (
                                    <span className="text-3xl drop-shadow-lg transform group-hover:scale-110 transition-transform block mb-1">
                                        {getCropGrowthStage(
                                            tile.plantedAt,
                                            crop.growthTime,
                                            Math.floor(Date.now() / 1000),
                                            crop.growthStages
                                        ).emoji}
                                    </span>
                                )}

                                {/* Status indicators */}
                                {harvestStatus === 'ready' && (
                                    <div className="absolute -top-1 right-1/2 transform translate-x-1/2">
                                        <span className="text-xs">✨</span>
                                    </div>
                                )}
                                
                                {harvestStatus === 'late' && (
                                    <div className="absolute -top-1 right-1/2 transform translate-x-1/2">
                                        <span className="text-xs">⚠️</span>
                                    </div>
                                )}

                                {/* Timer if not ready */}
                                {tile && !tile.isReady && tile.timeRemaining > 0 && (
                                    <span className="text-[10px] text-amber-900/70 dark:text-amber-100/70 font-bold block">
                                        {tile.timeRemaining}s
                                    </span>
                                )}
                                
                                {/* Fertility bar with color coding */}
                                {tile && (
                                    <div className="w-full mt-1 px-1">
                                        <div className="h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full fertility-bar rounded-full transition-all duration-300 ${
                                                    tile.fertility >= 80 ? 'bg-green-500' :
                                                    tile.fertility >= 50 ? 'bg-yellow-500' :
                                                    tile.fertility >= 30 ? 'bg-orange-500' :
                                                    'bg-red-500'
                                                }`}
                                                style={{ width: `${tile.fertility}%` }}
                                            />
                                        </div>
                                        <span className={`text-[9px] font-bold mt-0.5 block ${getFertilityColor(tile.fertility)}`}>
                                            {tile.fertility}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-1 w-full px-1">
                                <span className="text-amber-900/30 dark:text-white/20 text-lg group-hover:text-amber-900/50 dark:group-hover:text-white/30 transition-colors">
                                    {index}
                                </span>
                                {/* Show fertility even on empty tiles */}
                                {tile && (
                                    <div className="w-full">
                                        <div className="h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full fertility-bar rounded-full ${
                                                    tile.fertility >= 80 ? 'bg-green-500' :
                                                    tile.fertility >= 50 ? 'bg-yellow-500' :
                                                    tile.fertility >= 30 ? 'bg-orange-500' :
                                                    'bg-red-500'
                                                }`}
                                                style={{ width: `${tile.fertility}%` }}
                                            />
                                        </div>
                                        <span className={`text-[9px] font-bold mt-0.5 block ${getFertilityColor(tile.fertility)}`}>
                                            {tile.fertility}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </button>
                    
                    {/* Tooltip on hover */}
                    {hoveredTile === index && (
                        <div className="absolute z-50 pointer-events-none"
                             style={{
                                 bottom: '100%',
                                 left: '50%',
                                 transform: 'translateX(-50%)',
                                 marginBottom: '8px'
                             }}>
                            <TileTooltip tile={tile} tileIndex={index} />
                        </div>
                    )}
                </div>
                );
            })}
        </div>
    );
};
