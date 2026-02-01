"use client";

import React, { useState } from "react";

interface MobileSidebarProps {
  wood: number;
  stone: number;
  fiber: number;
  seeds: number;
  wateringCanUses: number;
  fertilizerCount: number;
  compostBinCount: number;
  selectedTool: string;
  onToolSelect: (tool: "cursor" | "wheat" | "tomato" | "corn" | "carrot" | "lettuce" | "water" | "fertilize") => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({
  wood,
  stone,
  fiber,
  seeds,
  wateringCanUses,
  fertilizerCount,
  compostBinCount,
  selectedTool,
  onToolSelect,
}) => {
  const [activeTab, setActiveTab] = useState<"resources" | "tools" | "tips">(
    "resources"
  );

  return (
    <div className="lg:hidden bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("resources")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === "resources"
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-b-2 border-green-500"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700"
          }`}
        >
          📦 Resources
        </button>
        <button
          onClick={() => setActiveTab("tools")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === "tools"
              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-b-2 border-blue-500"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700"
          }`}
        >
          🛠️ Tools
        </button>
        <button
          onClick={() => setActiveTab("tips")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === "tips"
              ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-b-2 border-purple-500"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700"
          }`}
        >
          💡 Tips
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === "resources" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🪵</span>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Wood
                </span>
              </div>
              <span className="text-sm font-bold text-green-700 dark:text-green-400">
                {wood}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🪨</span>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Stone
                </span>
              </div>
              <span className="text-sm font-bold text-stone-700 dark:text-stone-400">
                {stone}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌾</span>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Fiber
                </span>
              </div>
              <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                {fiber}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌱</span>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Seeds
                </span>
              </div>
              <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">
                {seeds}
              </span>
            </div>
          </div>
        )}

        {activeTab === "tools" && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💧</span>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Watering Can
                  </span>
                </div>
                <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                  {wateringCanUses} uses
                </span>
              </div>
              {wateringCanUses > 0 && (
                <button
                  onClick={() => onToolSelect("water")}
                  className={`w-full px-3 py-2 rounded-lg font-medium transition-all text-xs ${
                    selectedTool === "water"
                      ? "bg-blue-600 text-white shadow-lg scale-105"
                      : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200"
                  }`}
                >
                  {selectedTool === "water" ? "Selected ✓" : "Select Tool"}
                </button>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌿</span>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Fertilizer
                  </span>
                </div>
                <span className="text-sm font-bold text-green-700 dark:text-green-400">
                  {fertilizerCount}
                </span>
              </div>
              {fertilizerCount > 0 && (
                <button
                  onClick={() => onToolSelect("fertilize")}
                  className={`w-full px-3 py-2 rounded-lg font-medium transition-all text-xs ${
                    selectedTool === "fertilize"
                      ? "bg-green-600 text-white shadow-lg scale-105"
                      : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200"
                  }`}
                >
                  {selectedTool === "fertilize" ? "Selected ✓" : "Select Tool"}
                </button>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🗑️</span>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Compost Bins
                  </span>
                </div>
                <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                  {compostBinCount}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tips" && (
          <div className="space-y-3 text-xs text-gray-700 dark:text-gray-300">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="font-bold mb-1">💧 Water Regularly</div>
              <p className="text-gray-600 dark:text-gray-400">
                Keep plots watered to maximize growth and yield
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="font-bold mb-1">🔄 Rotate Crops</div>
              <p className="text-gray-600 dark:text-gray-400">
                Plant different crops for +10% rotation bonus
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <div className="font-bold mb-1">✨ Pattern Bonuses</div>
              <p className="text-gray-600 dark:text-gray-400">
                Hover ready crops to see patterns for extra yield
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
