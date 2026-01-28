'use client';

import React from 'react';
import { TileState, CROP_METADATA } from '../app/utils/gameHelpers';

interface AlertBannerProps {
    tiles: (TileState | null)[];
}

interface Alert {
    type: 'success' | 'warning' | 'info';
    message: string;
    icon: string;
}

export default function AlertBanner({ tiles }: AlertBannerProps) {
    const alerts: Alert[] = [];
    
    // Count ready crops
    const readyCrops = tiles.filter(tile => tile && tile.isReady).length;
    if (readyCrops > 0) {
        alerts.push({
            type: 'success',
            message: `${readyCrops} crop${readyCrops > 1 ? 's' : ''} ready to harvest! ✨`,
            icon: '🌾'
        });
    }
    
    // Count late harvests (past optimal window)
    const currentTime = Math.floor(Date.now() / 1000);
    const lateCrops = tiles.filter(tile => {
        if (!tile || !tile.isReady || tile.cropType === 0) return false;
        const crop = CROP_METADATA[tile.cropType as keyof typeof CROP_METADATA];
        if (!crop) return false;
        const timeSinceMature = currentTime - (tile.plantedAt + crop.growthTime);
        return timeSinceMature > crop.optimalHarvestWindow;
    }).length;
    
    if (lateCrops > 0) {
        alerts.push({
            type: 'warning',
            message: `${lateCrops} crop${lateCrops > 1 ? 's' : ''} past optimal harvest - yields decaying! ⚠️`,
            icon: '⏰'
        });
    }
    
    // Count low fertility tiles
    const lowFertilityTiles = tiles.filter(tile => tile && tile.fertility < 30).length;
    if (lowFertilityTiles > 5) {
        alerts.push({
            type: 'info',
            message: `${lowFertilityTiles} tiles have low fertility - plant restorative crops or leave fallow`,
            icon: '🌱'
        });
    }
    
    // Count rotation opportunities
    const rotationOpportunities = tiles.filter(tile => {
        if (!tile || tile.cropType === 0) return false;
        const crop = CROP_METADATA[tile.cropType as keyof typeof CROP_METADATA];
        if (!crop) return false;
        return tile.lastCropType !== 0 && tile.lastCropType !== tile.cropType && !crop.isRestorative;
    }).length;
    
    if (rotationOpportunities >= 3) {
        alerts.push({
            type: 'info',
            message: `${rotationOpportunities} tiles with crop rotation bonus! (+10 fertility)`,
            icon: '♻️'
        });
    }
    
    if (alerts.length === 0) return null;
    
    return (
        <div className="mb-4 space-y-2">
            {alerts.map((alert, index) => (
                <div
                    key={index}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg shadow-md border-2 transition-all ${
                        alert.type === 'success'
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-400 text-green-900 dark:text-green-100'
                            : alert.type === 'warning'
                            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-400 text-orange-900 dark:text-orange-100'
                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 text-blue-900 dark:text-blue-100'
                    }`}
                >
                    <span className="text-2xl">{alert.icon}</span>
                    <span className="flex-1 font-semibold text-sm">{alert.message}</span>
                </div>
            ))}
        </div>
    );
}
