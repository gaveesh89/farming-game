"use client";

import React, { useState, useEffect } from "react";

interface TutorialStep {
  title: string;
  description: string;
  targetSelector?: string;
  position: "top" | "bottom" | "left" | "right" | "center";
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "🌾 Welcome to Solana Farm!",
    description:
      "Learn to grow crops, earn rewards, and master pattern bonuses on the Solana blockchain. Let's get started!",
    position: "center",
  },
  {
    title: "👛 Connect Your Wallet",
    description:
      "First, connect your Solana wallet to begin. Click the 'Connect Wallet' button in the top right.",
    position: "top",
  },
  {
    title: "🏗️ Initialize Your Farm",
    description:
      "After connecting, you'll need to initialize the game state, season, and your farm account. This creates your on-chain player data.",
    position: "center",
  },
  {
    title: "🌱 Plant Your First Crop",
    description:
      "Click any empty plot to plant a crop. Different crops have different growth times and yields. Check seasonal bonuses for best results!",
    position: "center",
  },
  {
    title: "⏰ Wait for Growth",
    description:
      "Crops take time to grow (30-60 seconds in this demo). Watch the progress bar and growth stages. Ready crops will glow green!",
    position: "center",
  },
  {
    title: "🌾 Harvest for Rewards",
    description:
      "When crops are ready, click them to harvest! You'll earn points and resources. Timing matters - harvest in the optimal window for max yield.",
    position: "center",
  },
  {
    title: "💧 Water & Maintain",
    description:
      "Use the Water All button to keep crops healthy. Check the Resources panel for tools and materials. Craft items to boost your farm!",
    position: "bottom",
  },
  {
    title: "✨ Master Pattern Bonuses",
    description:
      "Plant crops in patterns for bonus yields! Hover over ready crops to see detected patterns. Try rows, blocks, crosses, and more!",
    position: "center",
  },
];

interface TutorialOverlayProps {
  onComplete: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem("farmGameTutorialCompleted", "true");
    setTimeout(onComplete, 300);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] animate-fade-in">
      {/* Dark Backdrop with Spotlight Effect */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Tutorial Card */}
      <div
        className={`absolute ${
          step.position === "center"
            ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            : step.position === "top"
            ? "top-20 left-1/2 -translate-x-1/2"
            : step.position === "bottom"
            ? "bottom-32 left-1/2 -translate-x-1/2"
            : step.position === "left"
            ? "left-8 top-1/2 -translate-y-1/2"
            : "right-8 top-1/2 -translate-y-1/2"
        } max-w-md w-full mx-4`}
      >
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-4 border-green-500 p-6 animate-bounce-in">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1">
              {TUTORIAL_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentStep
                      ? "w-8 bg-green-500"
                      : idx < currentStep
                      ? "w-2 bg-green-300"
                      : "w-2 bg-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {currentStep + 1}/{TUTORIAL_STEPS.length}
            </span>
          </div>

          {/* Content */}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            {step.title}
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
            {step.description}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-semibold transition-all text-sm"
                >
                  ← Back
                </button>
              )}
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-semibold transition-all text-sm"
              >
                Skip Tutorial
              </button>
            </div>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg font-bold shadow-lg transition-all hover:scale-105 active:scale-95 text-sm"
            >
              {isLastStep ? "Get Started! 🎉" : "Next →"}
            </button>
          </div>
        </div>

        {/* Pointer Arrow (only for non-center positions) */}
        {step.position !== "center" && (
          <div
            className={`absolute w-0 h-0 ${
              step.position === "top"
                ? "bottom-full left-1/2 -translate-x-1/2 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[20px] border-b-green-500"
                : step.position === "bottom"
                ? "top-full left-1/2 -translate-x-1/2 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[20px] border-t-green-500"
                : ""
            }`}
          />
        )}
      </div>

      {/* Hint: Click anywhere to dismiss (after step 2) */}
      {currentStep >= 2 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 text-xs">
          Press ESC or click anywhere to skip
        </div>
      )}
    </div>
  );
};

interface TutorialButtonProps {
  onClick: () => void;
}

export const TutorialButton: React.FC<TutorialButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-6 z-40 p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 animate-pulse"
      title="Restart Tutorial"
    >
      <span className="text-xl">❓</span>
    </button>
  );
};
