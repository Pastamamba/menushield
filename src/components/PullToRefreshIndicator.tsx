// src/components/PullToRefreshIndicator.tsx
import React from 'react';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isTriggered: boolean;
  isRefreshing: boolean;
  threshold?: number;
}

export const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({ 
  pullDistance, 
  isTriggered, 
  isRefreshing, 
  threshold = 80 
}) => {
  if (pullDistance === 0 && !isRefreshing) return null;

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 360;

  return (
    <div 
      className="absolute top-0 left-0 right-0 flex justify-center items-center bg-green-50 border-b border-green-200 transition-all duration-200 ease-out z-50"
      style={{ 
        height: `${Math.max(pullDistance, isRefreshing ? 60 : 0)}px`,
        transform: `translateY(-${isRefreshing ? 0 : Math.max(0, 60 - pullDistance)}px)`
      }}
    >
      <div className="flex items-center gap-2 text-green-700">
        {isRefreshing ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm font-medium">Päivitetään menua...</span>
          </>
        ) : (
          <>
            <svg 
              className="w-5 h-5 transition-transform duration-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9" />
            </svg>
            <span className="text-sm font-medium">
              {isTriggered ? "Päästä päivittääksesi" : "Vedä alas päivittääksesi"}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default PullToRefreshIndicator;