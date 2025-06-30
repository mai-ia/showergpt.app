import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'pulse' | 'shower';
  className?: string;
  color?: 'blue' | 'green' | 'purple' | 'red';
}

export default function LoadingSpinner({
  size = 'md',
  variant = 'default',
  className = '',
  color = 'blue'
}: LoadingSpinnerProps) {
  // Return null to hide all spinners
  return null;
}