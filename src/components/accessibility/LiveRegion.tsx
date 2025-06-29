import React, { ReactNode } from 'react';

interface LiveRegionProps {
  children: ReactNode;
  level?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  className?: string;
}

export default function LiveRegion({
  children,
  level = 'polite',
  atomic = false,
  relevant = 'additions text',
  className = ''
}: LiveRegionProps) {
  return (
    <div
      aria-live={level}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={`sr-only ${className}`}
    >
      {children}
    </div>
  );
}