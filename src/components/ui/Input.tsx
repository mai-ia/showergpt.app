import React, { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  variant?: 'default' | 'filled' | 'outline';
  inputSize?: 'sm' | 'md' | 'lg';
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  inputSize = 'md',
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseClasses = `
    w-full transition-all duration-300 outline-none
    focus:ring-4 focus:ring-opacity-20 disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantClasses = {
    default: `
      border-2 border-slate-200 dark:border-slate-600 rounded-2xl
      bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
      focus:border-blue-500 focus:ring-blue-500
      placeholder:text-slate-400 dark:placeholder:text-slate-500
    `,
    filled: `
      border-0 rounded-2xl bg-slate-100 dark:bg-slate-800
      text-slate-900 dark:text-slate-100 focus:ring-blue-500
      placeholder:text-slate-400 dark:placeholder:text-slate-500
    `,
    outline: `
      border-2 border-slate-300 dark:border-slate-600 rounded-2xl bg-transparent
      text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-blue-500
      placeholder:text-slate-400 dark:placeholder:text-slate-500
    `
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg'
  };

  const iconPadding = {
    sm: leftIcon ? 'pl-9' : rightIcon ? 'pr-9' : '',
    md: leftIcon ? 'pl-10' : rightIcon ? 'pr-10' : '',
    lg: leftIcon ? 'pl-12' : rightIcon ? 'pr-12' : ''
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const iconPositions = {
    sm: leftIcon ? 'left-3' : rightIcon ? 'right-3' : '',
    md: leftIcon ? 'left-3' : rightIcon ? 'right-3' : '',
    lg: leftIcon ? 'left-4' : rightIcon ? 'right-4' : ''
  };

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className={`absolute ${iconPositions[inputSize]} top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none`}>
            <span className={iconSizes[inputSize]}>{leftIcon}</span>
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={`
            ${baseClasses}
            ${variantClasses[variant]}
            ${sizeClasses[inputSize]}
            ${iconPadding[inputSize]}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        
        {rightIcon && (
          <div className={`absolute ${iconPositions[inputSize]} top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none`}>
            <span className={iconSizes[inputSize]}>{rightIcon}</span>
          </div>
        )}
      </div>
      
      {error && (
        <p
          id={`${inputId}-error`}
          className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-1"
          role="alert"
        >
          <span className="w-4 h-4">⚠️</span>
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p
          id={`${inputId}-helper`}
          className="text-sm text-slate-500 dark:text-slate-400"
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;