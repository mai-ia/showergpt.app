import React, { useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface MobileButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  hapticFeedback?: 'light' | 'medium' | 'heavy';
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export default function MobileButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  hapticFeedback = 'light',
  className = '',
  onClick,
  type = 'button',
  ...props
}: MobileButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleTouchStart = () => {
    setIsPressed(true);
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  const handleClick = () => {
    if (disabled || loading) return;
    
    // Haptic feedback simulation
    if (buttonRef.current) {
      buttonRef.current.classList.add(`haptic-${hapticFeedback}`);
      setTimeout(() => {
        buttonRef.current?.classList.remove(`haptic-${hapticFeedback}`);
      }, hapticFeedback === 'light' ? 100 : hapticFeedback === 'medium' ? 150 : 200);
    }
    
    onClick?.();
  };

  const baseClasses = `
    touch-target relative inline-flex items-center justify-center
    font-semibold rounded-2xl transition-all duration-200
    focus:outline-none focus:ring-4 focus:ring-opacity-50
    disabled:opacity-50 disabled:cursor-not-allowed
    transform active:scale-95
    ${fullWidth ? 'w-full' : ''}
    ${isPressed && !disabled ? 'scale-95' : 'scale-100'}
  `;

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-blue-600 to-blue-700 
      hover:from-blue-700 hover:to-blue-800
      text-white shadow-lg hover:shadow-xl
      focus:ring-blue-500 border border-blue-600
    `,
    secondary: `
      bg-gradient-to-r from-slate-100 to-slate-200 
      hover:from-slate-200 hover:to-slate-300
      dark:from-slate-700 dark:to-slate-600 
      dark:hover:from-slate-600 dark:hover:to-slate-500
      text-slate-700 dark:text-slate-300 
      shadow-lg hover:shadow-xl
      focus:ring-slate-500 border border-slate-200 dark:border-slate-600
    `,
    outline: `
      bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800
      text-slate-700 dark:text-slate-300 
      border-2 border-slate-300 dark:border-slate-600
      hover:border-slate-400 dark:hover:border-slate-500 
      focus:ring-slate-500
    `,
    ghost: `
      bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800
      text-slate-700 dark:text-slate-300 
      focus:ring-slate-500
    `,
    danger: `
      bg-gradient-to-r from-red-600 to-red-700 
      hover:from-red-700 hover:to-red-800
      text-white shadow-lg hover:shadow-xl
      focus:ring-red-500 border border-red-600
    `
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-mobile-sm min-h-[40px]',
    md: 'px-6 py-3 text-mobile-base min-h-[44px]',
    lg: 'px-8 py-4 text-mobile-lg min-h-[48px]',
    xl: 'px-10 py-5 text-mobile-xl min-h-[52px]'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7'
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      {...props}
    >
      {loading ? (
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      ) : leftIcon ? (
        <span className={`${iconSizes[size]} mr-2`}>{leftIcon}</span>
      ) : null}
      
      <span className={loading ? 'opacity-0' : ''}>{children}</span>
      
      {!loading && rightIcon && (
        <span className={`${iconSizes[size]} ml-2`}>{rightIcon}</span>
      )}
    </button>
  );
}