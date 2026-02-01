"use client";

import React from "react";
import { CROP_METADATA, TileState } from "@/app/utils/gameHelpers";

interface Pattern {
  name: string;
  bonus: number;
}

interface HarvestModalProps {
  plotIndex: number;
  tile: TileState;
  patterns: Pattern[];
  onHarvest: (plotIndex: number) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const HarvestModal: React.FC<HarvestModalProps> = ({
  plotIndex,
  tile,
  patterns,
  onHarvest,
  onClose,
  isOpen,
}) => {
  if (!isOpen || !tile || tile.cropType === 0) return null;

  const crop = CROP_METADATA[tile.cropType as keyof typeof CROP_METADATA];
  if (!crop) return null;

  // Calculate yield breakdown
  const baseFertility = tile.fertility;
  const fertilityMultiplier = baseFertility / 100;
  const waterMultiplier = 1.0; // Assuming optimal water for simplicity
  const seasonalMultiplier = 1.0; // Would need current season context
  const timingMultiplier = tile.isReady ? 1.0 : 0.8; // Penalty if not optimal
  
  const patternsBonus = patterns.reduce((sum, p) => sum + p.bonus, 0);
  const patternsMultiplier = 1 + (patternsBonus / 100);

  const baseYield = crop.baseYield;
  const afterFertility = baseYield * fertilityMultiplier;
  const afterWater = afterFertility * waterMultiplier;
  const afterSeason = afterWater * seasonalMultiplier;
  const afterTiming = afterSeason * timingMultiplier;
  const finalYield = Math.floor(afterTiming * patternsMultiplier);

  // Calculate fertility change
  const fertilityAfterHarvest = Math.max(0, baseFertility - crop.fertilityCost);
  const fertilityChange = fertilityAfterHarvest - baseFertility;

  // Resource gains
  const seedsGained = 2;
  const fiberGained = crop.fertilityCost >= 15 ? 1 : 0;

  const handleHarvest = () => {
    onHarvest(plotIndex);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-yellow-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <h2 className="text-xl font-bold flex items-center gap-2">
            🌾 Harvest {crop.emoji} {crop.name}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Crop Status */}
        <div className="px-6 py-4 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <span className="text-5xl">{crop.emoji}</span>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">{crop.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>📍 Plot {plotIndex + 1}</span>
                <span>•</span>
                <span className={tile.isReady ? 'text-green-600 font-semibold' : 'text-orange-600'}>
                  {tile.isReady ? '✅ Ready!' : '⚠️ Slightly Early'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Yield Breakdown */}
        <div className="p-6">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">📊 Yield Calculation:</h3>
          
          <div className="space-y-2 bg-gray-50 dark:bg-slate-900 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Base Yield:</span>
              <span className="font-semibold">{baseYield} pts</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">× Fertility ({baseFertility}%):</span>
              <span className="font-semibold">{afterFertility.toFixed(0)} pts</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">× Water (100%):</span>
              <span className="font-semibold">{afterWater.toFixed(0)} pts</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">× Seasonal (100%):</span>
              <span className="font-semibold">{afterSeason.toFixed(0)} pts</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">× Timing ({(timingMultiplier * 100).toFixed(0)}%):</span>
              <span className="font-semibold">{afterTiming.toFixed(0)} pts</span>
            </div>
            
            {patterns.length > 0 && (
              <div className="flex items-center justify-between text-sm border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
                <span className="text-gray-600 dark:text-gray-400 font-semibold">× Patterns (+{patternsBonus}%):</span>
                <span className="font-semibold text-purple-600 dark:text-purple-400">{finalYield} pts</span>
              </div>
            )}
            
            <div className="border-t-2 border-amber-300 dark:border-amber-700 pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-800 dark:text-white">Total Yield:</span>
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  🪙 {finalYield}
                </span>
              </div>
            </div>
          </div>

          {/* Patterns Detected */}
          {patterns.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                ✨ Patterns Detected:
              </h3>
              <div className="flex flex-wrap gap-2">
                {patterns.map((pattern, index) => (
                  <div
                    key={index}
                    className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold"
                  >
                    {pattern.name} +{pattern.bonus}%
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resource Gains */}
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">🎁 Resources Gained:</h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="text-lg">🌱</span>
                  <span>Seeds</span>
                </span>
                <span className="font-bold text-green-600">+{seedsGained}</span>
              </div>
              {fiberGained > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-lg">🌾</span>
                    <span>Fiber</span>
                  </span>
                  <span className="font-bold text-green-600">+{fiberGained}</span>
                </div>
              )}
            </div>
          </div>

          {/* Fertility Impact */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">🌍 Plot Fertility:</h3>
            <div className="flex items-center justify-between bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-600">{baseFertility}%</span>
                <span className="text-xl">→</span>
                <span className={`text-2xl font-bold ${
                  fertilityAfterHarvest >= 80 ? 'text-green-600' :
                  fertilityAfterHarvest >= 50 ? 'text-yellow-600' :
                  'text-orange-600'
                }`}>
                  {fertilityAfterHarvest}%
                </span>
              </div>
              <span className="text-sm font-semibold text-orange-600">
                {fertilityChange}%
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              💡 Tip: Use fertilizer or plant restorative crops to restore fertility
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-900 px-6 py-4 rounded-b-2xl flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleHarvest}
            className="btn-shine px-8 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white rounded-lg font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            🌾 Harvest (+{finalYield} pts)
          </button>
        </div>
      </div>
    </div>
  );
};
