import React, { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from './AuthModal';

interface AuthGuardProps {
  children: React.ReactNode;
  feature: string;
  description?: string;
}

export default function AuthGuard({ children, feature, description }: AuthGuardProps) {
  const { user, isConfigured } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // If Supabase is not configured, show children without auth
  if (!isConfigured) {
    return <>{children}</>;
  }

  // If user is authenticated, show children
  if (user) {
    return <>{children}</>;
  }

  // Show auth prompt for unauthenticated users
  return (
    <>
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6 text-center">
        <div className="mb-4">
          <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
            <span className="text-2xl">✨</span>
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-slate-800 mb-2">
          Unlock {feature}
        </h3>
        
        <p className="text-slate-600 mb-6">
          {description || `Sign in to access ${feature.toLowerCase()} and sync your data across devices.`}
        </p>
        
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <LogIn className="w-5 h-5" />
            Sign In
          </button>
          
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <UserPlus className="w-5 h-5" />
            Sign Up
          </button>
        </div>
      </div>

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </>
  );
}