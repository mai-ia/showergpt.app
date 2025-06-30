import React from 'react';
import { X, CreditCard, Zap, Lock, CheckCircle } from 'lucide-react';

interface PaymentPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  resetTime?: string;
}

export default function PaymentPromptModal({ isOpen, onClose, resetTime }: PaymentPromptModalProps) {
  if (!isOpen) return null;

  const handleUpgradeClick = () => {
    // This would typically redirect to a payment page or open a Stripe checkout
    // For now, we'll just close the modal
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full border border-blue-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              API Limit Reached
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
            <p className="text-blue-800 dark:text-blue-300">
              You've reached your free API call limit. Your limit will reset at <span className="font-semibold">{resetTime || 'the end of your billing period'}</span>.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Upgrade to Premium
            </h3>
            
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700 dark:text-slate-300">Unlimited AI-powered shower thoughts</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700 dark:text-slate-300">Advanced customization options</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700 dark:text-slate-300">Priority access to new features</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700 dark:text-slate-300">No ads or usage restrictions</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="text-2xl font-bold">$4.99</div>
              <div className="text-sm opacity-80">per month</div>
            </div>
            <button
              onClick={handleUpgradeClick}
              className="w-full bg-white text-blue-600 font-bold py-3 px-4 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Upgrade Now
            </button>
            <div className="flex items-center gap-1 mt-3 justify-center text-sm">
              <Lock className="w-3 h-3" />
              <span>Secure payment with Stripe</span>
            </div>
          </div>

          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            <p>
              You can continue using template-based generation for free.
            </p>
            <button
              onClick={onClose}
              className="mt-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              Continue with free plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}