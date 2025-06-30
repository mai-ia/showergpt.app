import React, { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}, ref) => {
  const baseClasses = `
    inline-flex items-center justify-center gap-2 font-semibold rounded-2xl
    transition-all duration-300 transform focus:outline-none focus:ring-4 focus:ring-opacity-50
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    hover:scale-105 active:scale-95 will-change-transform
  `;

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800
      text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/25
      focus:ring-blue-500 border border-blue-600
    `,
    secondary: `
      bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300
      dark:from-slate-700 dark:to-slate-600 dark:hover:from-slate-600 dark:hover:to-slate-500
      text-slate-700 dark:text-slate-300 shadow-lg hover:shadow-xl
      focus:ring-slate-500 border border-slate-200 dark:border-slate-600
    `,
    outline: `
      bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800
      text-slate-700 dark:text-slate-300 border-2 border-slate-300 dark:border-slate-600
      hover:border-slate-400 dark:hover:border-slate-500 focus:ring-slate-500
    `,
    ghost: `
      bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800
      text-slate-700 dark:text-slate-300 focus:ring-slate-500
    `,
    danger: `
      bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800
      text-white shadow-lg hover:shadow-xl hover:shadow-red-500/25
      focus:ring-red-500 border border-red-600
    `
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-base min-h-[44px]',
    lg: 'px-6 py-4 text-lg min-h-[52px]',
    xl: 'px-8 py-5 text-xl min-h-[60px]'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7'
  };

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      ) : leftIcon ? (
        <span className={iconSizes[size]}>{leftIcon}</span>
      ) : null}
      
      <span className={loading ? 'opacity-0' : ''}>{children}</span>
      
      {!loading && rightIcon && (
        <span className={iconSizes[size]}>{rightIcon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;