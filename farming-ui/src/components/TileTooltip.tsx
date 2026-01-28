'use client';

import React from 'react';
import { TileState, CROP_METADATA, getFertilityColor } from '../app/utils/gameHelpers';

interface TileTooltipProps {
    tile: TileState | null;
    tileIndex: number;
}

export default function TileTooltip({ tile, tileIndex }: TileTooltipProps) {
    if (!tile || tile.cropType === 0) {
        // Empty tile - show fertility info
        return (
            <div className="p-3 bg-gray-900 text-white rounded-lg shadow-xl text-xs min-w-[200px]">
                <div className="font-bold mb-2 text-amber-300">Tile #{tileIndex}</div>
                <div className="space-y-1">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Fertility:</span>
                        <span className={`font-bold ${getFertilityColor(tile?.fertility || 100)}`}>
                            {tile?.fertility || 100}%
                        </span>
                    </div>
                    {tile && tile.fertility < 80 && (
                        <div className="text-orange-300 mt-2 pt-2 border-t border-gray-700">
                            💡 Plant restorative crops (Carrot/Lettuce) to restore fertility
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const crop = CROP_METADATA[tile.cropType];
    const currentTime = Math.floor(Date.now() / 1000);
    const timeElapsed = currentTime - tile.plantedAt;
    const timeSinceMature = timeElapsed - crop.growthTime;
    
    // Calculate yield prediction
    let yieldEstimate: number = crop.baseYield;
    let yieldStatus = 'Growing...';
    let statusColor = 'text-blue-300';
    
    if (timeSinceMature >= 0) {
        // Crop is mature - calculate decay
        const decayTime = Math.max(0, timeSinceMature - crop.optimalHarvestWindow);
        const decayPercent = Math.min(100, (decayTime * 100) / crop.maxDecayTime);
        const yieldLoss = ((crop.baseYield - crop.minYield) * decayPercent) / 100;
        yieldEstimate = Math.floor(crop.baseYield - yieldLoss);
        
        // Apply fertility modifier
        const fertilityModifier = 0.4 + (tile.fertility * 0.6) / 100;
        yieldEstimate = Math.floor(yieldEstimate * fertilityModifier);
        
        if (timeSinceMature <= crop.optimalHarvestWindow) {
            yieldStatus = '✨ OPTIMAL WINDOW';
            statusColor = 'text-green-400 font-bold animate-pulse';
        } else if (decayPercent < 50) {
            yieldStatus = '⚠️ Decaying';
            statusColor = 'text-orange-400';
        } else {
            yieldStatus = '❌ Heavily Decayed';
            statusColor = 'text-red-400 font-bold';
        }
    }
    
    return (
        <div className="p-3 bg-gray-900 text-white rounded-lg shadow-xl text-xs min-w-[220px]">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{crop.emoji}</span>
                <div>
                    <div className="font-bold text-amber-300">{crop.name}</div>
                    <div className={`text-[10px] ${statusColor}`}>{yieldStatus}</div>
                </div>
            </div>
            
            <div className="space-y-1.5 border-t border-gray-700 pt-2">
                {/* Yield Estimate */}
                <div className="flex justify-between items-center bg-green-900/30 px-2 py-1 rounded">
                    <span className="text-gray-400">Expected Yield:</span>
                    <span className="font-bold text-green-300">💰 {yieldEstimate}</span>
                </div>
                
                {/* Fertility Impact */}
                <div className="flex justify-between">
                    <span className="text-gray-400">Fertility:</span>
                    <span className={`font-bold ${getFertilityColor(tile.fertility)}`}>
                        {tile.fertility}% ({tile.fertility >= 80 ? '+60%' : tile.fertility >= 50 ? '~0%' : `-${Math.floor((1 - (0.4 + tile.fertility * 0.6 / 100)) * 100)}%`} yield)
                    </span>
                </div>
                
                {/* Time Info */}
                {timeElapsed < crop.growthTime ? (
                    <div className="flex justify-between">
                        <span className="text-gray-400">Time to Mature:</span>
                        <span className="font-bold text-blue-300">{crop.growthTime - timeElapsed}s</span>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Mature For:</span>
                            <span className="font-bold text-yellow-300">{timeSinceMature}s</span>
                        </div>
                        {timeSinceMature > crop.optimalHarvestWindow && (
                            <div className="flex justify-between text-orange-300">
                                <span>Decay Time:</span>
                                <span className="font-bold">{timeSinceMature - crop.optimalHarvestWindow}s</span>
                            </div>
                        )}
                    </>
                )}
                
                {/* Rotation Bonus Indicator */}
                {tile.lastCropType !== 0 && tile.lastCropType !== tile.cropType && !crop.isRestorative && (
                    <div className="bg-green-900/50 px-2 py-1 rounded mt-2 text-green-300 border border-green-500/30">
                        ♻️ Rotation Bonus: +10 fertility after harvest
                    </div>
                )}
                
                {/* Restorative Indicator */}
                {crop.isRestorative && (
                    <div className="bg-blue-900/50 px-2 py-1 rounded mt-2 text-blue-300 border border-blue-500/30">
                        🌱 Restorative: +10 fertility on harvest
                    </div>
                )}
            </div>
        </div>
    );
}
