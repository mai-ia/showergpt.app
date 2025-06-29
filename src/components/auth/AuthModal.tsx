import React, { useState } from 'react';
import { X } from 'lucide-react';
import LoginForm from './LoginForm';
import ForgotPasswordForm from './ForgotPasswordForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);

  if (!isOpen) return null;

  const handleToggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
  };

  const handleForgotPassword = () => {
    setMode('forgot');
  };

  const handleBackToLogin = () => {
    setMode('login');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-blue-200">
        <div className="sticky top-0 bg-white rounded-t-3xl border-b border-slate-200 p-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">
            {mode === 'forgot' ? 'Reset Password' : 'Authentication'}
          </h1>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        <div className="p-6">
          {mode === 'forgot' ? (
            <ForgotPasswordForm onBackToLogin={handleBackToLogin} />
          ) : (
            <LoginForm
              onToggleMode={handleToggleMode}
              isRegisterMode={mode === 'register'}
              onClose={onClose}
            />
          )}

          {mode === 'login' && (
            <div className="mt-6 text-center">
              <button
                onClick={handleForgotPassword}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Forgot your password?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}