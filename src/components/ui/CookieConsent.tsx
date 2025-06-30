import React, { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import Button from './Button';

interface CookieConsentProps {
  className?: string;
}

export default function CookieConsent({ className = '' }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem('cookie-consent');
    if (!hasConsented) {
      // Show the banner after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'false');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 p-4 ${className}`}>
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
              <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
                Cookie & Privacy Notice
              </h3>
              
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                This application uses cookies and local storage to enhance your experience. We don't collect personal data or track your activity for marketing purposes. Your data remains on your device unless you choose to create an account and sync to the cloud.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleAccept}
                  variant="primary"
                  size="md"
                >
                  Accept
                </Button>
                
                <Button
                  onClick={handleDecline}
                  variant="outline"
                  size="md"
                >
                  Decline
                </Button>
                
                <Button
                  onClick={() => setIsVisible(false)}
                  variant="ghost"
                  size="md"
                  className="sm:ml-auto"
                >
                  Remind me later
                </Button>
              </div>
            </div>
            
            <button
              onClick={() => setIsVisible(false)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Close cookie notice"
            >
              <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}