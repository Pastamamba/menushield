// src/hooks/usePullToRefresh.ts
import { useEffect, useRef, useState } from 'react';

interface PullToRefreshConfig {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  disabled?: boolean;
}

export const usePullToRefresh = (config: PullToRefreshConfig) => {
  const { onRefresh, threshold = 80, disabled = false } = config;
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isTriggered, setIsTriggered] = useState(false);
  
  const containerRef = useRef<HTMLElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || disabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only start if we're at the top of the page
      if (window.scrollY > 0) return;
      
      startY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Only proceed if we started from the top
      if (startY.current === 0 || window.scrollY > 0) return;
      
      currentY.current = e.touches[0].clientY;
      const delta = currentY.current - startY.current;

      if (delta > 0) {
        e.preventDefault();
        const distance = Math.min(delta * 0.5, threshold + 20); // Add resistance
        setPullDistance(distance);
        
        if (distance >= threshold && !isTriggered) {
          setIsTriggered(true);
          // Haptic feedback when threshold reached
          if ('vibrate' in navigator) {
            navigator.vibrate(50);
          }
        } else if (distance < threshold && isTriggered) {
          setIsTriggered(false);
        }
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } catch (error) {
          console.error('Refresh failed:', error);
        } finally {
          setIsRefreshing(false);
          setIsTriggered(false);
          setPullDistance(0);
        }
      } else {
        // Animate back to 0
        const animateBack = () => {
          setPullDistance(prev => {
            const newDistance = prev * 0.8;
            if (newDistance < 1) {
              setIsTriggered(false);
              return 0;
            }
            requestAnimationFrame(animateBack);
            return newDistance;
          });
        };
        animateBack();
      }
      
      startY.current = 0;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, threshold, disabled, pullDistance, isRefreshing, isTriggered]);

  return {
    containerRef,
    isRefreshing,
    pullDistance,
    isTriggered
  };
};

export default usePullToRefresh;