import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';

interface MobileInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search';
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  className?: string;
}

export default function MobileInput({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  error,
  helperText,
  leftIcon,
  rightIcon,
  clearable = false,
  autoFocus = false,
  disabled = false,
  required = false,
  maxLength,
  className = ''
}: MobileInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Prevent zoom on iOS
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      // Delay to prevent zoom
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const inputClasses = `
    w-full px-4 py-3 text-mobile-base
    bg-white dark:bg-slate-800
    border-2 rounded-2xl
    transition-all duration-200
    ${isFocused 
      ? 'border-blue-500 ring-4 ring-blue-500 ring-opacity-20' 
      : error 
        ? 'border-red-500' 
        : 'border-slate-300 dark:border-slate-600'
    }
    ${leftIcon ? 'pl-12' : ''}
    ${(rightIcon || clearable || type === 'password') ? 'pr-12' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    placeholder:text-slate-400 dark:placeholder:text-slate-500
    text-slate-900 dark:text-slate-100
    focus:outline-none
  `;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-mobile-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={inputRef}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          className={inputClasses}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoComplete={type === 'password' ? 'current-password' : 'off'}
          autoCapitalize={type === 'email' ? 'none' : 'sentences'}
          autoCorrect={type === 'email' ? 'off' : 'on'}
          spellCheck={type === 'email' ? false : true}
        />
        
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="touch-target p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
          
          {clearable && value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="touch-target p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              aria-label="Clear input"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          
          {rightIcon && !clearable && type !== 'password' && (
            <div className="text-slate-400 dark:text-slate-500">
              {rightIcon}
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <p className="text-mobile-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
          <span className="w-4 h-4">⚠️</span>
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="text-mobile-sm text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      )}
      
      {maxLength && (
        <div className="flex justify-end">
          <span className="text-mobile-xs text-slate-400 dark:text-slate-500">
            {value.length}/{maxLength}
          </span>
        </div>
      )}
    </div>
  );
}