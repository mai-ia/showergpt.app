import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from './AuthModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  fallback, 
  requireAuth = true 
}: ProtectedRouteProps) {
  const { user, loading, isConfigured } = useAuth();

  // If Supabase is not configured, show children (no auth required)
  if (!isConfigured) {
    return <>{children}</>;
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // If authentication is required but user is not logged in
  if (requireAuth && !user) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="text-center py-12">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 max-w-md mx-auto">
          <div className="mb-4">
            <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              <span className="text-2xl">🔐</span>
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-3">
            Authentication Required
          </h3>
          <p className="text-slate-600 mb-6">
            Please sign in to access this feature and sync your thoughts across devices.
          </p>
          <AuthModal isOpen={true} onClose={() => {}} />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}