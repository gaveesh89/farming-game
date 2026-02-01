"use client";

import { FC, useState } from "react";
import { GRID_CONFIG, TileState, CROP_METADATA, CROP_TYPES, getCropGrowthStage, getFertilityColor } from "@/app/utils/gameHelpers";
import { detectPatternsForPlot, PatternInfo } from "@/app/utils/patternDetection";
import { PatternOverlay } from "./ui/PatternOverlay";
import TileTooltip from "./TileTooltip";

interface Props {
    grid: TileState[][] | null;
    onTileClick?: (index: number, tile: TileState | null) => void;
    selectedTool?: string;
}

export const FarmGrid: FC<Props> = ({ grid, onTileClick, selectedTool }) => {
    const tiles = Array.from({ length: GRID_CONFIG.TOTAL_TILES }, (_, i) => i);
    const [hoveredTile, setHoveredTile] = useState<number | null>(null);
    const [hoveredPatterns, setHoveredPatterns] = useState<PatternInfo[]>([]);

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

    const getGrowthPercentage = (tile: TileState | null, crop: any) => {
        if (!tile || !crop || tile.cropType === CROP_TYPES.EMPTY) return 0;
        const timeElapsed = Math.floor(Date.now() / 1000) - tile.plantedAt;
        const percentage = Math.min(100, (timeElapsed / crop.growthTime) * 100);
        return Math.floor(percentage);
    };

    const getWaterPercentage = (tile: TileState | null) => {
        // TODO: Add water level to TileState in gameHelpers.ts
        // For now, return a default value
        return 70;
    };

    const handleTileHover = (index: number) => {
        setHoveredTile(index);
        if (grid) {
            const tile = getTileState(index);
            if (tile && tile.cropType !== CROP_TYPES.EMPTY && tile.isReady) {
                const patterns = detectPatternsForPlot(grid, index);
                setHoveredPatterns(patterns);
            } else {
                setHoveredPatterns([]);
            }
        }
    };

    const handleTileLeave = () => {
        setHoveredTile(null);
        setHoveredPatterns([]);
    };

    // Check if current tile is part of any pattern being displayed
    const isPartOfPattern = (index: number) => {
        return hoveredPatterns.some(pattern => 
            pattern.participatingPlots.includes(index)
        );
    };

    return (
        <div className="relative grid grid-cols-5 gap-3 max-w-[600px] mx-auto p-4 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl shadow-xl border-2 border-green-200 dark:border-green-800">
            {tiles.map((index) => {
                const tile = getTileState(index);
                const crop = tile && tile.cropType !== CROP_TYPES.EMPTY ? CROP_METADATA[tile.cropType] : null;
                const harvestStatus = getHarvestStatus(tile);
                const hasRotationBonus = isRotationBonus(tile);
                const growthPercent = getGrowthPercentage(tile, crop);
                const waterPercent = getWaterPercentage(tile);
                const growthStage = tile && crop ? getCropGrowthStage(
                    tile.plantedAt,
                    crop.growthTime,
                    Math.floor(Date.now() / 1000),
                    crop.growthStages
                ) : null;
                const stageNames = ['Seedling', 'Growing', 'Maturing', 'Ready'];
                const stageName = growthStage ? stageNames[growthStage.stage] || 'Growing' : '';

                return (
                    <div key={index} className="relative">
                        <button
                            onClick={() => onTileClick?.(index, tile)}
                            onMouseEnter={() => handleTileHover(index)}
                            onMouseLeave={handleTileLeave}
                            className={`
              aspect-square rounded-xl flex flex-col items-center justify-between p-2 text-xs border-4 transition-all duration-300 relative overflow-visible group w-full shadow-md hover:shadow-xl
              ${selectedTool === 'water' || selectedTool === 'fertilize' ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
              ${harvestStatus === 'ready' ? 'border-green-500 shadow-green-500/50 animate-pulse-green' : ''}
              ${harvestStatus === 'late' || harvestStatus === 'overdue' ? 'border-orange-500 shadow-orange-500/50 animate-pulse' : ''}
              ${isPartOfPattern(index) ? 'ring-4 ring-purple-400 ring-offset-2 z-10' : ''}
              ${crop
                                    ? "bg-white dark:bg-slate-800 border-green-300 dark:border-green-700 hover:scale-105"
                                    : "bg-amber-50 dark:bg-slate-900 border-amber-200 dark:border-amber-800 hover:scale-105 hover:border-green-300"
                                }
            `}
                        >
                        {crop ? (
                            <div className="relative flex flex-col items-center w-full h-full justify-between">
                                {/* Top Row: Badges */}
                                <div className="absolute -top-3 left-0 right-0 flex justify-between px-1 z-10">
                                    {hasRotationBonus && (
                                        <div className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                                            +10%
                                        </div>
                                    )}
                                    {crop.isRestorative && (
                                        <div className="bg-blue-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full shadow-lg ml-auto">
                                            ♻️
                                        </div>
                                    )}
                                </div>

                                {/* Crop Icon & Name */}
                                {tile && tile.plantedAt > 0 && (
                                    <div className="flex flex-col items-center mt-1">
                                        <span className="text-3xl drop-shadow-lg transform group-hover:scale-110 transition-transform">
                                            {getCropGrowthStage(
                                                tile.plantedAt,
                                                crop.growthTime,
                                                Math.floor(Date.now() / 1000),
                                                crop.growthStages
                                            ).emoji}
                                        </span>
                                        <span className="text-[8px] font-bold text-gray-600 dark:text-gray-400 mt-0.5">
                                            {crop.emoji} {crop.name}
                                        </span>
                                    </div>
                                )}

                                {/* Growth Progress Bar */}
                                {tile && !tile.isReady && (
                                    <div className="w-full mt-1">
                                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                                                style={{ width: `${growthPercent}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center mt-0.5">
                                            <span className="text-[8px] text-gray-500 dark:text-gray-400">{stageName}</span>
                                            <span className="text-[8px] font-bold text-green-600 dark:text-green-400">{growthPercent}%</span>
                                        </div>
                                    </div>
                                )}

                                {/* Ready Status */}
                                {tile?.isReady && harvestStatus === 'ready' && (
                                    <div className="w-full bg-green-500 text-white text-center py-1 rounded-md text-[10px] font-bold mt-1">
                                        ✨ READY!
                                    </div>
                                )}

                                {/* Time Remaining or Warning */}
                                {tile && (
                                    <div className="text-[9px] font-bold text-center">
                                        {tile.isReady ? (
                                            harvestStatus === 'late' || harvestStatus === 'overdue' ? (
                                                <span className="text-orange-600 dark:text-orange-400">⚠️ Decaying</span>
                                            ) : (
                                                <span className="text-green-600 dark:text-green-400">⏰ Harvest now!</span>
                                            )
                                        ) : tile.timeRemaining > 0 ? (
                                            <span className="text-gray-600 dark:text-gray-400">⏰ {tile.timeRemaining}s</span>
                                        ) : null}
                                    </div>
                                )}

                                {/* Water & Fertility Stats */}
                                <div className="w-full mt-auto space-y-1">
                                    <div className="flex items-center justify-between text-[9px]">
                                        <span className="text-blue-600 dark:text-blue-400">💧</span>
                                        <div className="flex-1 mx-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-blue-500 rounded-full"
                                                style={{ width: `${waterPercent}%` }}
                                            />
                                        </div>
                                        <span className="text-blue-600 dark:text-blue-400 font-bold">{waterPercent}%</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[9px]">
                                        <span className="text-amber-600 dark:text-amber-400">🌍</span>
                                        <div className="flex-1 mx-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${
                                                    tile && tile.fertility >= 80 ? 'bg-green-500' :
                                                    tile && tile.fertility >= 50 ? 'bg-yellow-500' :
                                                    tile && tile.fertility >= 30 ? 'bg-orange-500' :
                                                    'bg-red-500'
                                                }`}
                                                style={{ width: `${tile?.fertility || 0}%` }}
                                            />
                                        </div>
                                        <span className={`font-bold ${getFertilityColor(tile?.fertility || 0)}`}>{tile?.fertility || 0}%</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-2 w-full h-full">
                                <div className="text-3xl opacity-30 group-hover:opacity-50 transition-opacity">
                                    +
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-400">
                                    PLANT
                                </span>
                                {/* Show fertility on empty tiles */}
                                {tile && (
                                    <div className="w-full mt-auto space-y-1">
                                        <div className="flex items-center justify-between text-[9px]">
                                            <span className="text-blue-600 dark:text-blue-400">💧</span>
                                            <div className="flex-1 mx-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${waterPercent}%` }}
                                                />
                                            </div>
                                            <span className="text-blue-600 dark:text-blue-400 font-bold text-[8px]">{waterPercent}%</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[9px]">
                                            <span className="text-amber-600 dark:text-amber-400">🌍</span>
                                            <div className="flex-1 mx-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${
                                                        tile.fertility >= 80 ? 'bg-green-500' :
                                                        tile.fertility >= 50 ? 'bg-yellow-500' :
                                                        tile.fertility >= 30 ? 'bg-orange-500' :
                                                        'bg-red-500'
                                                    }`}
                                                    style={{ width: `${tile.fertility}%` }}
                                                />
                                            </div>
                                            <span className={`font-bold text-[8px] ${getFertilityColor(tile.fertility)}`}>{tile.fertility}%</span>
                                        </div>
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

            {/* Pattern Visualization Overlay */}
            {hoveredTile !== null && hoveredPatterns.length > 0 && (
                <PatternOverlay
                    patterns={hoveredPatterns}
                    hoveredPlot={hoveredTile}
                />
            )}
        </div>
    );
};
