import React from 'react';
import { Loader2, Droplets } from 'lucide-react';

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
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    purple: 'text-purple-500',
    red: 'text-red-500'
  };

  if (variant === 'dots') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`
              ${size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : size === 'lg' ? 'w-3 h-3' : 'w-4 h-4'}
              ${colorClasses[color].replace('text-', 'bg-')}
              rounded-full animate-bounce
            `}
            style={{
              animationDelay: `${i * 150}ms`,
              animationDuration: '1s'
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div
        className={`
          ${sizeClasses[size]}
          ${colorClasses[color].replace('text-', 'bg-')}
          rounded-full animate-pulse
          ${className}
        `}
      />
    );
  }

  if (variant === 'shower') {
    return (
      <div className={`relative ${sizeClasses[size]} ${className}`}>
        <div className={`absolute inset-0 ${colorClasses[color].replace('text-', 'border-')} border-2 border-t-transparent rounded-full animate-spin`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Droplets className={`${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-6 h-6'} ${colorClasses[color]} animate-pulse`} />
        </div>
      </div>
    );
  }

  return (
    <Loader2 className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin ${className}`} />
  );
}