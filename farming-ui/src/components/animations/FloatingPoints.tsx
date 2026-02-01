"use client";

import React, { useEffect, useState } from "react";

interface FloatingPointsProps {
  points: number;
  x: number;
  y: number;
  onComplete?: () => void;
}

export const FloatingPoints: React.FC<FloatingPointsProps> = ({
  points,
  x,
  y,
  onComplete,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) {
        onComplete();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className="fixed z-[100] pointer-events-none animate-float-up"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-bold text-2xl px-4 py-2 rounded-full shadow-2xl border-2 border-white">
        +{points} 🪙
      </div>
    </div>
  );
};

interface FloatingPointsContainerProps {
  children?: React.ReactNode;
}

export const FloatingPointsContainer: React.FC<FloatingPointsContainerProps> = ({ children }) => {
  return <div className="relative">{children}</div>;
};
