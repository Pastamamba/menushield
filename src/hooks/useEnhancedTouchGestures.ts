import { useEffect, useRef, useCallback } from 'react';
import { performanceMonitor } from '../utils/performanceMonitor';

interface TouchGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onPinch?: (scale: number) => void;
  threshold?: number;
  longPressDelay?: number;
  doubleTapDelay?: number;
  enableHapticFeedback?: boolean;
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

// Enhanced touch gestures hook for native-like mobile experience
export const useEnhancedTouchGestures = (options: TouchGestureOptions = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onDoubleTap,
    onLongPress,
    onPinch,
    threshold = 50,
    longPressDelay = 500,
    doubleTapDelay = 300,
    enableHapticFeedback = true,
  } = options;

  const ref = useRef<HTMLElement>(null);
  const startTouch = useRef<TouchPoint | null>(null);
  const lastTap = useRef<TouchPoint | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  const initialDistance = useRef<number>(0);
  const isPinching = useRef(false);

  // Haptic feedback helper
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!enableHapticFeedback || !('vibrate' in navigator)) return;
    
    const patterns = {
      light: 10,
      medium: 25,
      heavy: 50,
    };
    
    navigator.vibrate(patterns[type]);
  }, [enableHapticFeedback]);

  // Calculate distance between two touches (for pinch gestures)
  const getDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Performance timing for gesture responsiveness
  const measureGesturePerformance = useCallback((gestureType: string, startTime: number) => {
    const duration = performance.now() - startTime;
    performanceMonitor.setMetric(`Gesture: ${gestureType}`, duration);
    
    // Log slow gestures in development
    if (process.env.NODE_ENV === 'development' && duration > 16) {
      console.warn(`⚠️ Slow gesture detected: ${gestureType} took ${duration.toFixed(2)}ms`);
    }
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const gestureStartTime = performance.now();
    const touch = e.touches[0];
    
    if (e.touches.length === 1) {
      // Single touch - prepare for swipe, tap, or long press
      startTouch.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: gestureStartTime,
      };
      
      isLongPress.current = false;
      
      // Start long press timer
      if (onLongPress) {
        longPressTimer.current = setTimeout(() => {
          isLongPress.current = true;
          triggerHapticFeedback('medium');
          onLongPress();
          measureGesturePerformance('LongPress', gestureStartTime);
        }, longPressDelay);
      }
    } else if (e.touches.length === 2 && onPinch) {
      // Two touches - prepare for pinch
      isPinching.current = true;
      initialDistance.current = getDistance(e.touches[0], e.touches[1]);
    }
  }, [onLongPress, onPinch, longPressDelay, triggerHapticFeedback, getDistance, measureGesturePerformance]);

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && isPinching.current && onPinch) {
      // Handle pinch gesture
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialDistance.current;
      onPinch(scale);
    }
    
    // Cancel long press if finger moves significantly
    if (longPressTimer.current && startTouch.current) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - startTouch.current.x);
      const deltaY = Math.abs(touch.clientY - startTouch.current.y);
      
      if (deltaX > threshold / 2 || deltaY > threshold / 2) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  }, [onPinch, getDistance, threshold]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const gestureStartTime = startTouch.current?.time || performance.now();
    
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // Reset pinch state
    if (isPinching.current) {
      isPinching.current = false;
      return;
    }
    
    // Don't process tap/swipe if long press was triggered
    if (isLongPress.current || !startTouch.current) {
      return;
    }
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startTouch.current.x;
    const deltaY = touch.clientY - startTouch.current.y;
    const deltaTime = performance.now() - startTouch.current.time;
    
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    // Determine if it's a swipe or tap
    if (absDeltaX > threshold || absDeltaY > threshold) {
      // It's a swipe
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          triggerHapticFeedback('light');
          onSwipeRight();
          measureGesturePerformance('SwipeRight', gestureStartTime);
        } else if (deltaX < 0 && onSwipeLeft) {
          triggerHapticFeedback('light');
          onSwipeLeft();
          measureGesturePerformance('SwipeLeft', gestureStartTime);
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          triggerHapticFeedback('light');
          onSwipeDown();
          measureGesturePerformance('SwipeDown', gestureStartTime);
        } else if (deltaY < 0 && onSwipeUp) {
          triggerHapticFeedback('light');
          onSwipeUp();
          measureGesturePerformance('SwipeUp', gestureStartTime);
        }
      }
    } else if (deltaTime < 300) {
      // It's a tap - check for double tap
      const currentTap: TouchPoint = {
        x: touch.clientX,
        y: touch.clientY,
        time: performance.now(),
      };
      
      if (lastTap.current && onDoubleTap) {
        const timeDiff = currentTap.time - lastTap.current.time;
        const distanceDiff = Math.sqrt(
          Math.pow(currentTap.x - lastTap.current.x, 2) +
          Math.pow(currentTap.y - lastTap.current.y, 2)
        );
        
        if (timeDiff < doubleTapDelay && distanceDiff < threshold) {
          // Double tap detected
          triggerHapticFeedback('medium');
          onDoubleTap();
          measureGesturePerformance('DoubleTap', gestureStartTime);
          lastTap.current = null;
          return;
        }
      }
      
      // Single tap
      lastTap.current = currentTap;
      if (onTap) {
        // Delay single tap to allow for potential double tap
        setTimeout(() => {
          if (lastTap.current === currentTap) {
            triggerHapticFeedback('light');
            onTap();
            measureGesturePerformance('Tap', gestureStartTime);
          }
        }, doubleTapDelay);
      }
    }
    
    startTouch.current = null;
  }, [
    onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown,
    onTap, onDoubleTap, threshold, doubleTapDelay,
    triggerHapticFeedback, measureGesturePerformance
  ]);

  // Set up event listeners
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Add passive listeners for better scroll performance
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      
      // Cleanup timers
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return ref;
};

// Specialized hook for swipe navigation
export const useSwipeNavigation = (
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold = 75
) => {
  return useEnhancedTouchGestures({
    onSwipeLeft,
    onSwipeRight,
    threshold,
    enableHapticFeedback: true,
  });
};

// Specialized hook for card interactions
export const useCardGestures = (
  onTap?: () => void,
  onLongPress?: () => void,
  enableHaptic = true
) => {
  return useEnhancedTouchGestures({
    onTap,
    onLongPress,
    enableHapticFeedback: enableHaptic,
    longPressDelay: 600, // Slightly longer for cards
  });
};