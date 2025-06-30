import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, MoreVertical } from 'lucide-react';

interface MobileOptimizedCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  swipeable?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
  priority?: 'high' | 'medium' | 'low';
}

export default function MobileOptimizedCard({
  children,
  title,
  subtitle,
  actions,
  swipeable = false,
  onSwipeLeft,
  onSwipeRight,
  className = '',
  priority = 'medium'
}: MobileOptimizedCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const isDragging = useRef(false);

  // Intersection Observer for progressive loading
  useEffect(() => {
    if (priority === 'low' && cardRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('mobile-fade-in');
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(cardRef.current);
      return () => observer.disconnect();
    }
  }, [priority]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!swipeable) return;
    
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    isDragging.current = false;
    setIsPressed(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipeable) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startX.current;
    const deltaY = touch.clientY - startY.current;

    // Determine if this is a horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      isDragging.current = true;
      setSwipeOffset(deltaX);
      e.preventDefault(); // Prevent scrolling
    }
  };

  const handleTouchEnd = () => {
    if (!swipeable) return;

    setIsPressed(false);
    
    if (isDragging.current) {
      const threshold = 100;
      
      if (swipeOffset > threshold && onSwipeRight) {
        onSwipeRight();
        // Haptic feedback simulation
        if (cardRef.current) {
          cardRef.current.classList.add('haptic-medium');
          setTimeout(() => {
            cardRef.current?.classList.remove('haptic-medium');
          }, 150);
        }
      } else if (swipeOffset < -threshold && onSwipeLeft) {
        onSwipeLeft();
        // Haptic feedback simulation
        if (cardRef.current) {
          cardRef.current.classList.add('haptic-medium');
          setTimeout(() => {
            cardRef.current?.classList.remove('haptic-medium');
          }, 150);
        }
      }
    }
    
    setSwipeOffset(0);
    isDragging.current = false;
  };

  const cardClasses = `
    mobile-optimized gesture-feedback
    bg-white dark:bg-slate-800 
    rounded-2xl shadow-lg hover:shadow-xl
    border border-slate-200 dark:border-slate-700
    transition-all duration-300 transform
    ${isPressed ? 'scale-98' : 'scale-100'}
    ${swipeable ? 'swipeable' : ''}
    ${className}
  `;

  const cardStyle = swipeable ? {
    transform: `translateX(${swipeOffset}px)`,
    transition: isDragging.current ? 'none' : 'transform 0.3s ease-out'
  } : {};

  return (
    <div
      ref={cardRef}
      className={cardClasses}
      style={cardStyle}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="article"
      tabIndex={0}
    >
      {/* Header */}
      {(title || subtitle || actions) && (
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-mobile-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-mobile-sm text-slate-600 dark:text-slate-400 truncate mt-1">
                {subtitle}
              </p>
            )}
          </div>
          
          {actions && (
            <div className="flex items-center gap-2 ml-3">
              {actions}
              <button
                onClick={() => setShowActions(!showActions)}
                className="touch-target p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="More actions"
              >
                <MoreVertical className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {children}
      </div>

      {/* Swipe indicators */}
      {swipeable && (
        <>
          {swipeOffset > 50 && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500">
              <ChevronRight className="w-6 h-6" />
            </div>
          )}
          {swipeOffset < -50 && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-500">
              <ChevronRight className="w-6 h-6 transform rotate-180" />
            </div>
          )}
        </>
      )}

      {/* Actions dropdown */}
      {showActions && actions && (
        <div className="absolute top-full right-4 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 min-w-[200px]">
          <div className="p-2">
            {actions}
          </div>
        </div>
      )}
    </div>
  );
}