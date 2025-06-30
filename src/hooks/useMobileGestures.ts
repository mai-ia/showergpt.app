import { useRef, useCallback, useEffect } from 'react';

interface GestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
}

interface GestureOptions {
  swipeThreshold?: number;
  pinchThreshold?: number;
  longPressDelay?: number;
  preventDefault?: boolean;
}

export function useMobileGestures(
  handlers: GestureHandlers,
  options: GestureOptions = {}
) {
  const {
    swipeThreshold = 50,
    pinchThreshold = 0.1,
    longPressDelay = 500,
    preventDefault = true
  } = options;

  const startTouch = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTap = useRef<number>(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const initialDistance = useRef<number>(0);
  const currentScale = useRef<number>(1);

  const getDistance = useCallback((touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    const now = Date.now();

    if (e.touches.length === 1) {
      startTouch.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: now
      };

      // Start long press timer
      if (handlers.onLongPress) {
        longPressTimer.current = setTimeout(() => {
          handlers.onLongPress?.();
        }, longPressDelay);
      }
    } else if (e.touches.length === 2) {
      // Clear long press timer for multi-touch
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      // Initialize pinch gesture
      initialDistance.current = getDistance(e.touches[0], e.touches[1]);
      currentScale.current = 1;
    }
  }, [handlers, longPressDelay, preventDefault, getDistance]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }

    // Clear long press timer on move
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (e.touches.length === 2 && handlers.onPinch) {
      // Handle pinch gesture
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialDistance.current;
      
      if (Math.abs(scale - currentScale.current) > pinchThreshold) {
        currentScale.current = scale;
        handlers.onPinch(scale);
      }
    }
  }, [handlers, pinchThreshold, preventDefault, getDistance]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }

    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!startTouch.current || e.touches.length > 0) {
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startTouch.current.x;
    const deltaY = touch.clientY - startTouch.current.y;
    const deltaTime = Date.now() - startTouch.current.time;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Check for swipe gestures
    if (distance > swipeThreshold && deltaTime < 300) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0 && handlers.onSwipeRight) {
          handlers.onSwipeRight();
        } else if (deltaX < 0 && handlers.onSwipeLeft) {
          handlers.onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && handlers.onSwipeDown) {
          handlers.onSwipeDown();
        } else if (deltaY < 0 && handlers.onSwipeUp) {
          handlers.onSwipeUp();
        }
      }
    } else if (distance < 10 && deltaTime < 300) {
      // Tap gesture
      const now = Date.now();
      const timeSinceLastTap = now - lastTap.current;

      if (timeSinceLastTap < 300 && handlers.onDoubleTap) {
        // Double tap
        handlers.onDoubleTap();
        lastTap.current = 0; // Reset to prevent triple tap
      } else if (handlers.onTap) {
        // Single tap
        handlers.onTap();
        lastTap.current = now;
      }
    }

    startTouch.current = null;
  }, [handlers, swipeThreshold, preventDefault]);

  const attachGestures = useCallback((element: HTMLElement | null) => {
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefault });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefault });
    element.addEventListener('touchend', handleTouchEnd, { passive: !preventDefault });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, preventDefault]);

  return { attachGestures };
}

// Hook for haptic feedback simulation
export function useHapticFeedback() {
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    // Try to use the Vibration API if available
    if ('vibrator' in navigator || 'vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      
      navigator.vibrate?.(patterns[type]);
    }
    
    // Visual feedback fallback
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      activeElement.classList.add(`haptic-${type}`);
      setTimeout(() => {
        activeElement.classList.remove(`haptic-${type}`);
      }, type === 'light' ? 100 : type === 'medium' ? 150 : 200);
    }
  }, []);

  return { triggerHaptic };
}

// Hook for managing virtual keyboard
export function useVirtualKeyboard() {
  const isKeyboardOpen = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      const viewport = window.visualViewport;
      if (viewport) {
        const heightDiff = window.innerHeight - viewport.height;
        isKeyboardOpen.current = heightDiff > 150; // Threshold for keyboard detection
        
        // Adjust layout for keyboard
        if (isKeyboardOpen.current) {
          document.body.classList.add('keyboard-open');
        } else {
          document.body.classList.remove('keyboard-open');
        }
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport?.removeEventListener('resize', handleResize);
    }
  }, []);

  return { isKeyboardOpen: isKeyboardOpen.current };
}