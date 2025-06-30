import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingFallbackProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingFallback({ 
  message = 'Loading...', 
  size = 'md',
  className = ''
}: LoadingFallbackProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-500 mb-4`} />
      <p className="text-slate-600 dark:text-slate-400 text-center">{message}</p>
    </div>
  );
}

// Specific loading components for different sections
export function ThoughtsListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 border border-blue-100 dark:border-slate-700 animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="w-20 h-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="w-16 h-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
          <div className="space-y-3 mb-6">
            <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="w-4/5 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="w-3/4 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ModalSkeleton() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 animate-pulse">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="w-32 h-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
        <div className="p-6 space-y-4">
          <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="w-3/4 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="w-1/2 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    </div>
  );
}