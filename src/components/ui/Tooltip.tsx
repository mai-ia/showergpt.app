import React, { useState, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string | ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
  disabled?: boolean;
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  delay = 500,
  className = '',
  disabled = false
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    if (disabled) return;
    
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const scrollX = window.pageXOffset;
        const scrollY = window.pageYOffset;
        
        let x = 0;
        let y = 0;
        
        switch (position) {
          case 'top':
            x = rect.left + scrollX + rect.width / 2;
            y = rect.top + scrollY - 8;
            break;
          case 'bottom':
            x = rect.left + scrollX + rect.width / 2;
            y = rect.bottom + scrollY + 8;
            break;
          case 'left':
            x = rect.left + scrollX - 8;
            y = rect.top + scrollY + rect.height / 2;
            break;
          case 'right':
            x = rect.right + scrollX + 8;
            y = rect.top + scrollY + rect.height / 2;
            break;
        }
        
        setTooltipPosition({ x, y });
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const getTooltipClasses = () => {
    const baseClasses = `
      absolute z-[9999] px-3 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-slate-700 
      rounded-xl shadow-2xl border border-slate-700 dark:border-slate-600 backdrop-blur-sm
      transition-all duration-200 pointer-events-none max-w-xs
      ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
    `;
    
    const positionClasses = {
      top: '-translate-x-1/2 -translate-y-full',
      bottom: '-translate-x-1/2 translate-y-0',
      left: '-translate-x-full -translate-y-1/2',
      right: 'translate-x-0 -translate-y-1/2'
    };
    
    return `${baseClasses} ${positionClasses[position]} ${className}`;
  };

  const getArrowClasses = () => {
    const baseClasses = "absolute w-2 h-2 bg-slate-900 dark:bg-slate-700 border border-slate-700 dark:border-slate-600 transform rotate-45";
    
    switch (position) {
      case 'top':
        return `${baseClasses} top-full left-1/2 -translate-x-1/2 -translate-y-1/2`;
      case 'bottom':
        return `${baseClasses} bottom-full left-1/2 -translate-x-1/2 translate-y-1/2`;
      case 'left':
        return `${baseClasses} left-full top-1/2 -translate-x-1/2 -translate-y-1/2`;
      case 'right':
        return `${baseClasses} right-full top-1/2 translate-x-1/2 -translate-y-1/2`;
      default:
        return baseClasses;
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      
      {isVisible && typeof document !== 'undefined' && createPortal(
        <div
          className={getTooltipClasses()}
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y
          }}
          role="tooltip"
        >
          <div className={getArrowClasses()}></div>
          {typeof content === 'string' ? (
            <span className="leading-relaxed">{content}</span>
          ) : (
            content
          )}
        </div>,
        document.body
      )}
    </>
  );
}