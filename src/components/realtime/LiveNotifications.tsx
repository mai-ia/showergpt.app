import React, { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Heart, MessageCircle, Star } from 'lucide-react';
import { useLiveNotifications } from '../../hooks/useRealtime';
import { useAuth } from '../../contexts/AuthContext';

export default function LiveNotifications() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useLiveNotifications(user?.id);
  const [isOpen, setIsOpen] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setHasPermission(true);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          setHasPermission(permission === 'granted');
        });
      }
    }
  }, []);

  // Prevent loading state from getting stuck
  useEffect(() => {
    if (notifications.length > 0 || !user) {
      setIsLoading(false);
    }
  }, [notifications, user]);

  const getNotificationIcon = (type: string) => {
    const iconClass = "w-4 h-4 flex-shrink-0";
    switch (type) {
      case 'like':
        return <Heart className={`${iconClass} text-red-500 dark:text-red-400`} />;
      case 'comment':
        return <MessageCircle className={`${iconClass} text-blue-500 dark:text-blue-400`} />;
      case 'favorite':
        return <Star className={`${iconClass} text-yellow-500 dark:text-yellow-400`} />;
      default:
        return <Bell className={`${iconClass} text-slate-500 dark:text-slate-400`} />;
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Don't render if user is not authenticated
  if (!user) return null;

  return (
    <div className="relative">
      {/* Notification Bell - Remove loading spinner */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 rounded-2xl bg-white bg-opacity-20 backdrop-blur-sm text-white hover:bg-opacity-30 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        disabled={isLoading}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                Notifications
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {unreadCount} unread
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-3"></div>
                <p className="text-slate-600 dark:text-slate-400">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400">
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    p-4 border-b border-slate-100 dark:border-slate-700 last:border-b-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors
                    ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  `}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Permission Request */}
          {!hasPermission && 'Notification' in window && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-yellow-50 dark:bg-yellow-900/20">
              <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                <Bell className="w-4 h-4" />
                <span>Enable browser notifications for real-time alerts</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}