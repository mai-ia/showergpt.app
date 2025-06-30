import React from 'react';
import { Users, Circle } from 'lucide-react';
import { usePresence } from '../../hooks/useRealtime';
import { useAuth } from '../../contexts/AuthContext';

export default function OnlineUsers() {
  const { user } = useAuth();
  const { onlineUsers, isLoading } = usePresence(user?.id);

  if (!user || (onlineUsers.length === 0 && !isLoading)) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-xl">
          <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">
            Online Now
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {isLoading 
              ? 'Loading users...' 
              : `${onlineUsers.length} user${onlineUsers.length !== 1 ? 's' : ''} active`}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {onlineUsers.slice(0, 10).map((presence: any, index) => (
            <div
              key={presence.user_id || index}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {/* Use display_name from presence data if available */}
                  {presence.display_name 
                    ? presence.display_name.slice(0, 2).toUpperCase() 
                    : presence.user_id?.slice(0, 2).toUpperCase() || '??'}
                </div>
                <div className="absolute -bottom-1 -right-1">
                  <Circle className="w-3 h-3 text-green-500 fill-current" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                  {/* Display the user's display name if available */}
                  {presence.display_name || `User ${presence.user_id?.slice(-4) || 'Unknown'}`}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {presence.page || 'Browsing'}
                </div>
              </div>
            </div>
          ))}
          
          {onlineUsers.length > 10 && (
            <div className="text-center py-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                +{onlineUsers.length - 10} more online
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}