"use client";

import React, { useState } from "react";
import { CROP_METADATA, CROP_TYPES, TileState } from "@/app/utils/gameHelpers";

interface PlantCropModalProps {
  plotIndex: number;
  currentTile: TileState | null;
  currentSeason: number;
  onPlant: (plotIndex: number, cropType: number) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const PlantCropModal: React.FC<PlantCropModalProps> = ({
  plotIndex,
  currentTile,
  currentSeason,
  onPlant,
  onClose,
  isOpen,
}) => {
  const [selectedCrop, setSelectedCrop] = useState<number | null>(null);

  if (!isOpen) return null;

  const seasonNames = ["Spring", "Summer", "Fall", "Winter"];
  const seasonEmojis = ["🌸", "☀️", "🍂", "❄️"];
  
  // Seasonal multipliers (simplified - actual values would come from on-chain config)
  const getSeasonalBonus = (cropType: number) => {
    // Example: Wheat best in Spring, Tomato in Summer, etc.
    const bonuses: { [key: number]: { [season: number]: number } } = {
      [CROP_TYPES.WHEAT]: { 0: 1.2, 1: 1.0, 2: 1.1, 3: 0.8 },
      [CROP_TYPES.TOMATO]: { 0: 1.0, 1: 1.3, 2: 1.1, 3: 0.7 },
      [CROP_TYPES.CORN]: { 0: 1.1, 1: 1.2, 2: 1.0, 3: 0.6 },
      [CROP_TYPES.CARROT]: { 0: 1.1, 1: 0.9, 2: 1.3, 3: 1.0 },
      [CROP_TYPES.LETTUCE]: { 0: 1.2, 1: 0.8, 2: 1.1, 3: 0.9 },
    };
    return bonuses[cropType]?.[currentSeason] || 1.0;
  };

  const hasRotationBonus = currentTile && currentTile.lastCropType !== 0 && selectedCrop && currentTile.lastCropType !== selectedCrop;

  const calculateProjectedYield = (cropType: number) => {
    const crop = CROP_METADATA[cropType as keyof typeof CROP_METADATA];
    if (!crop) return 0;

    const fertility = currentTile?.fertility || 80;
    const seasonalMultiplier = getSeasonalBonus(cropType);
    const rotationMultiplier = hasRotationBonus ? 1.1 : 1.0;
    const fertilityMultiplier = fertility / 100;

    const projectedYield = Math.floor(
      crop.baseYield * seasonalMultiplier * rotationMultiplier * fertilityMultiplier
    );

    return projectedYield;
  };

  const handlePlant = () => {
    if (selectedCrop) {
      onPlant(plotIndex, selectedCrop);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <h2 className="text-xl font-bold flex items-center gap-2">
            🌱 Plant Crop - Plot {plotIndex + 1}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Season Info */}
        <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xl">{seasonEmojis[currentSeason]}</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Current Season: {seasonNames[currentSeason]}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-xs">
              (Different crops perform better in different seasons)
            </span>
          </div>
        </div>

        {/* Plot Info */}
        {currentTile && (
          <div className="px-6 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Fertility:</span>
                <span className={`font-bold ${
                  currentTile.fertility >= 80 ? 'text-green-600' :
                  currentTile.fertility >= 50 ? 'text-yellow-600' :
                  'text-orange-600'
                }`}>
                  {currentTile.fertility}%
                </span>
              </div>
              {currentTile.lastCropType !== 0 && (
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Last Crop:</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {CROP_METADATA[currentTile.lastCropType as keyof typeof CROP_METADATA]?.emoji} {CROP_METADATA[currentTile.lastCropType as keyof typeof CROP_METADATA]?.name}
                  </span>
                  <span className="text-xs text-green-600 dark:text-green-400">(+10% if different)</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Crop Selection Grid */}
        <div className="p-6">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Select Crop to Plant:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[CROP_TYPES.WHEAT, CROP_TYPES.TOMATO, CROP_TYPES.CORN, CROP_TYPES.CARROT, CROP_TYPES.LETTUCE].map((cropType) => {
              const crop = CROP_METADATA[cropType as keyof typeof CROP_METADATA];
              const seasonalBonus = getSeasonalBonus(cropType);
              const projectedYield = calculateProjectedYield(cropType);
              const isSelected = selectedCrop === cropType;
              const rotationBonus = currentTile && currentTile.lastCropType !== 0 && currentTile.lastCropType !== cropType;

              return (
                <button
                  key={cropType}
                  onClick={() => setSelectedCrop(cropType)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-lg scale-105'
                      : 'border-gray-300 dark:border-gray-600 hover:border-green-400 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{crop.emoji}</span>
                      <div>
                        <h4 className="font-bold text-gray-800 dark:text-white">{crop.name}</h4>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ⏱️ {crop.growthTime}s
                        </div>
                      </div>
                    </div>
                    {rotationBonus && (
                      <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                        +10%
                      </span>
                    )}
                  </div>

                  {/* Yield Projection */}
                  <div className="space-y-1 mb-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Base Yield:</span>
                      <span className="font-semibold">{crop.baseYield} pts</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Seasonal:</span>
                      <span className={`font-semibold ${
                        seasonalBonus >= 1.2 ? 'text-green-600' :
                        seasonalBonus >= 1.0 ? 'text-yellow-600' :
                        'text-orange-600'
                      }`}>
                        ×{seasonalBonus.toFixed(1)}
                        {seasonalBonus >= 1.2 ? ' ⭐' : seasonalBonus < 1.0 ? ' ⚠️' : ''}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-1 mt-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-gray-700 dark:text-gray-300">Projected:</span>
                        <span className="font-bold text-green-600 dark:text-green-400">~{projectedYield} pts</span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Stats */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>🌍 -{crop.fertilityCost}%</span>
                    {crop.isRestorative && <span className="text-green-600">♻️ Restorative</span>}
                  </div>
                </button>
              );
            })}
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
            onClick={handlePlant}
            disabled={!selectedCrop}
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-semibold shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50"
          >
            {selectedCrop ? `Plant ${CROP_METADATA[selectedCrop as keyof typeof CROP_METADATA]?.emoji} ${CROP_METADATA[selectedCrop as keyof typeof CROP_METADATA]?.name}` : 'Select a Crop'}
          </button>
        </div>
      </div>
    </div>
  );
};
