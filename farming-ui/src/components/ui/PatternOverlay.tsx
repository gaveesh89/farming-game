"use client";

import React from "react";
import { PatternInfo } from "@/app/utils/patternDetection";

interface PatternOverlayProps {
  patterns: PatternInfo[];
  hoveredPlot: number;
}

export const PatternOverlay: React.FC<PatternOverlayProps> = ({
  patterns,
  hoveredPlot,
}) => {
  if (patterns.length === 0) return null;

  const totalBonus = patterns.reduce((sum, p) => sum + p.bonus, 0);

  return (
    <>
      {/* Pattern Highlights on Grid */}
      {patterns.map((pattern, patternIdx) =>
        pattern.participatingPlots.map((plotIdx) => {
          const row = Math.floor(plotIdx / 5);
          const col = plotIdx % 5;

          return (
            <div
              key={`${patternIdx}-${plotIdx}`}
              className="absolute pointer-events-none z-20 transition-opacity duration-200"
              style={{
                left: `${col * 20}%`,
                top: `${row * 20}%`,
                width: "20%",
                height: "20%",
                boxShadow: `inset 0 0 0 3px ${pattern.color}`,
                backgroundColor: `${pattern.color}15`,
                borderRadius: "0.75rem",
              }}
            />
          );
        })
      )}

      {/* Floating Pattern Info Tooltip */}
      <div
        className="absolute z-30 pointer-events-none animate-bounce-in"
        style={{
          left: "50%",
          top: "-80px",
          transform: "translateX(-50%)",
          minWidth: "200px",
        }}
      >
        <div className="bg-slate-900 text-white rounded-xl shadow-2xl p-3 border-2 border-purple-500">
          <div className="text-xs font-bold mb-2 text-purple-300">
            ✨ Patterns Detected
          </div>
          <div className="space-y-1">
            {patterns.map((pattern, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs"
              >
                <span
                  className="flex items-center gap-1"
                  style={{ color: pattern.color }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: pattern.color }}
                  />
                  {pattern.name}
                </span>
                <span className="font-bold text-amber-400">
                  +{pattern.bonus}%
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-purple-700 mt-2 pt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-purple-200">Total Bonus:</span>
              <span className="font-bold text-amber-400">+{totalBonus}%</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
