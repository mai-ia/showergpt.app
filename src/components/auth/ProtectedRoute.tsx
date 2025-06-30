import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from './AuthModal';
import { AlertTriangle } from 'lucide-react';

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
  const [showTimeout, setShowTimeout] = useState(false);

  // Show timeout warning if loading takes too long
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (loading) {
      timeoutId = setTimeout(() => {
        setShowTimeout(true);
      }, 5000); // Show timeout warning after 5 seconds
    } else {
      setShowTimeout(false);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading]);

  // If Supabase is not configured, show children (no auth required)
  if (!isConfigured) {
    return <>{children}</>;
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400">Verifying authentication...</p>
        
        {showTimeout && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl max-w-md">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">
                Authentication is taking longer than expected. This could be due to network issues or database connectivity problems.
              </p>
            </div>
            <div className="mt-2 text-sm text-yellow-600 dark:text-yellow-500">
              You can continue using the app with local storage while we keep trying to connect.
            </div>
          </div>
        )}
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