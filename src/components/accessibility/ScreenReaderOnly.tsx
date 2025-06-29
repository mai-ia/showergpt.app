import React, { ReactNode } from 'react';

interface ScreenReaderOnlyProps {
  children: ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

export default function ScreenReaderOnly({ 
  children, 
  as: Component = 'span',
  className = ''
}: ScreenReaderOnlyProps) {
  return (
    <Component className={`sr-only ${className}`}>
      {children}
    </Component>
  );
}