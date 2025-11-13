// src/hooks/useSwipeGesture.ts
import { useEffect, useRef } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventTouch?: boolean;
}

export const useSwipeGesture = (config: SwipeConfig) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 75,
    preventTouch = false
  } = config;

  const touchRef = useRef<HTMLElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const element = touchRef.current;
    if (!element) return;

    let startTime: number;

    const handleTouchStart = (e: TouchEvent) => {
      if (preventTouch) e.preventDefault();
      
      const touch = e.touches[0];
      startPos.current = { x: touch.clientX, y: touch.clientY };
      currentPos.current = { x: touch.clientX, y: touch.clientY };
      startTime = Date.now();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (preventTouch) e.preventDefault();
      
      const touch = e.touches[0];
      currentPos.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (preventTouch) e.preventDefault();
      
      const deltaX = currentPos.current.x - startPos.current.x;
      const deltaY = currentPos.current.y - startPos.current.y;
      const deltaTime = Date.now() - startTime;

      // Only detect fast swipes (< 300ms)
      if (deltaTime > 300) return;

      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Determine if it's a horizontal or vertical swipe
      if (absDeltaX > absDeltaY && absDeltaX > threshold) {
        // Horizontal swipe
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
        
        // Add haptic feedback for swipe
        if ('vibrate' in navigator) {
          navigator.vibrate(30);
        }
      } else if (absDeltaY > absDeltaX && absDeltaY > threshold) {
        // Vertical swipe
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
        
        // Add haptic feedback for swipe
        if ('vibrate' in navigator) {
          navigator.vibrate(30);
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: !preventTouch });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventTouch });
    element.addEventListener('touchend', handleTouchEnd, { passive: !preventTouch });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, preventTouch]);

  return touchRef;
};

export default useSwipeGesture;