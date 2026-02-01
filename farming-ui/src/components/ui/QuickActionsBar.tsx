"use client";

import React from "react";

interface QuickActionsBarProps {
  onPlantAll: () => void;
  onWaterAll: () => void;
  onOpenCrafting: () => void;
  onOpenStats: () => void;
  onOpenHelp: () => void;
  disabled?: boolean;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onPlantAll,
  onWaterAll,
  onOpenCrafting,
  onOpenStats,
  onOpenHelp,
  disabled = false,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-800 to-transparent backdrop-blur-lg border-t border-slate-700 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-2 md:gap-4">
          <button
            onClick={onPlantAll}
            disabled={disabled}
            className="btn-shine flex-1 md:flex-none px-4 md:px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-green-500/50 transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            title="Plant crops on all empty plots"
          >
            <span className="hidden sm:inline">🌱 Plant All</span>
            <span className="sm:hidden">🌱</span>
          </button>

          <button
            onClick={onWaterAll}
            disabled={disabled}
            className="btn-shine flex-1 md:flex-none px-4 md:px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-blue-500/50 transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            title="Water all plots below 60% water level"
          >
            <span className="hidden sm:inline">💧 Water All</span>
            <span className="sm:hidden">💧</span>
          </button>

          <button
            onClick={onOpenCrafting}
            disabled={disabled}
            className="btn-shine flex-1 md:flex-none px-4 md:px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-purple-500/50 transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            title="Open crafting menu"
          >
            <span className="hidden sm:inline">🔨 Craft</span>
            <span className="sm:hidden">🔨</span>
          </button>

          <button
            onClick={onOpenStats}
            disabled={disabled}
            className="btn-shine flex-1 md:flex-none px-4 md:px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-amber-500/50 transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            title="View farm statistics and analytics"
          >
            <span className="hidden sm:inline">📊 Stats</span>
            <span className="sm:hidden">📊</span>
          </button>

          <button
            onClick={onOpenHelp}
            disabled={disabled}
            className="btn-shine flex-1 md:flex-none px-4 md:px-6 py-2.5 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-slate-500/50 transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            title="Open tutorial and help guide"
          >
            <span className="hidden sm:inline">❓ Help</span>
            <span className="sm:hidden">❓</span>
          </button>
        </div>
      </div>
    </div>
  );
};
