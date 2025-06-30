import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

export default function MobileModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = ''
}: MobileModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Focus the modal
      modalRef.current?.focus();
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Add safe area padding for notched devices
      document.body.style.paddingTop = 'env(safe-area-inset-top)';
      document.body.style.paddingBottom = 'env(safe-area-inset-bottom)';
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      document.body.style.paddingTop = '';
      document.body.style.paddingBottom = '';
      
      // Restore focus to the previously focused element
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingTop = '';
      document.body.style.paddingBottom = '';
    };
  }, [isOpen]);

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    full: 'w-full h-full max-w-none'
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm mobile-fade-in" />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className={`
          relative bg-white dark:bg-slate-800 shadow-2xl
          border border-slate-200 dark:border-slate-700
          w-full mx-4 mb-4 sm:mx-0 sm:mb-0
          ${size === 'full' 
            ? 'h-full rounded-none sm:rounded-3xl' 
            : 'max-h-[90vh] rounded-t-3xl sm:rounded-3xl'
          }
          ${sizeClasses[size]}
          overflow-hidden mobile-slide-up
          focus:outline-none mobile-focus-trap
          ${className}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 safe-area-top">
            {title && (
              <h2 
                id="modal-title" 
                className="text-mobile-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="touch-target p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ml-auto"
                aria-label="Close modal"
              >
                <X className="w-6 h-6 text-slate-600 dark:text-slate-400" />
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className={`
          overflow-y-auto 
          ${size === 'full' ? 'flex-1' : 'max-h-[calc(90vh-120px)]'}
          safe-area-bottom
        `}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}