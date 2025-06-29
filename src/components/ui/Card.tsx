import React, { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  interactive?: boolean;
}

export default function Card({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  interactive = false,
  className = '',
  ...props
}: CardProps) {
  const baseClasses = `
    rounded-3xl transition-all duration-300 will-change-transform
    ${interactive ? 'cursor-pointer' : ''}
  `;

  const variantClasses = {
    default: `
      bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
      shadow-lg hover:shadow-xl
    `,
    elevated: `
      bg-white dark:bg-slate-800 shadow-2xl hover:shadow-3xl
      border border-slate-100 dark:border-slate-700
    `,
    outlined: `
      bg-transparent border-2 border-slate-200 dark:border-slate-700
      hover:border-slate-300 dark:hover:border-slate-600
    `,
    glass: `
      bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50
      shadow-xl hover:shadow-2xl
    `
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const hoverClasses = hover || interactive ? `
    hover:scale-105 hover:-translate-y-1 active:scale-100 active:translate-y-0
  ` : '';

  return (
    <div
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${hoverClasses}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

// Card sub-components
export function CardHeader({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mb-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-xl font-bold text-slate-800 dark:text-slate-200 ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-slate-600 dark:text-slate-400 mt-1 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 ${className}`} {...props}>
      {children}
    </div>
  );
}