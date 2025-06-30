import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getTableName } from '../services/databaseMappingService';
import { debug } from '../utils/debugHelpers';

interface UseRealtimeOptions {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
}

export function useRealtime({
  table,
  event = '*',
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onChange
}: UseRealtimeOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setIsConnected(false);
      setIsLoading(false);
      setError(new Error('Supabase not configured'));
      return;
    }

    setIsLoading(true);
    setError(null);

    // Set a timeout to prevent hanging in "connecting" state
    timeoutRef.current = setTimeout(() => {
      if (isLoading && !isConnected) {
        debug.warn(`Realtime connection to ${table} timed out after 10 seconds`);
        setIsLoading(false);
        setError(new Error('Connection timed out'));
      }
    }, 10000);

    // Map the table name to the actual database table
    const dbTable = getTableName(table as any);
    debug.log(`Setting up realtime subscription for table: ${table} → ${dbTable}`);

    // Create channel
    const channel = supabase
      .channel(`realtime-${dbTable}`)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table: dbTable,
          filter
        },
        (payload) => {
          debug.log('Realtime update:', payload);
          
          // Call specific event handlers
          switch (payload.eventType) {
            case 'INSERT':
              onInsert?.(payload);
              break;
            case 'UPDATE':
              onUpdate?.(payload);
              break;
            case 'DELETE':
              onDelete?.(payload);
              break;
          }
          
          // Call general change handler
          onChange?.(payload);
        }
      )
      .subscribe((status) => {
        debug.log('Realtime subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
        setIsLoading(status === 'SUBSCRIBED' ? false : isLoading);
        
        // If subscription failed, set error
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setError(new Error(`Failed to subscribe to ${dbTable}: ${status}`));
          setIsLoading(false);
        }
      });

    channelRef.current = channel;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (channelRef.current) {
        debug.log(`Removing realtime channel for table: ${dbTable}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
      setIsLoading(false);
    };
  }, [table, event, filter, onInsert, onUpdate, onDelete, onChange]);

  // Function to manually retry connection
  const retryConnection = useCallback(() => {
    if (channelRef.current) {
      debug.log('Manually retrying realtime connection');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsLoading(true);
      setError(null);
      
      // Map the table name to the actual database table
      const dbTable = getTableName(table as any);
      
      // Create new channel
      const channel = supabase
        .channel(`realtime-${dbTable}-retry-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event,
            schema: 'public',
            table: dbTable,
            filter
          },
          (payload) => {
            debug.log('Realtime update (retry):', payload);
            
            // Call specific event handlers
            switch (payload.eventType) {
              case 'INSERT':
                onInsert?.(payload);
                break;
              case 'UPDATE':
                onUpdate?.(payload);
                break;
              case 'DELETE':
                onDelete?.(payload);
                break;
            }
            
            // Call general change handler
            onChange?.(payload);
          }
        )
        .subscribe((status) => {
          debug.log('Realtime subscription status (retry):', status);
          setIsConnected(status === 'SUBSCRIBED');
          setIsLoading(status === 'SUBSCRIBED' ? false : isLoading);
          
          // If subscription failed, set error
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setError(new Error(`Failed to subscribe to ${dbTable}: ${status}`));
            setIsLoading(false);
          }
        });
      
      channelRef.current = channel;
    }
  }, [table, event, filter, onInsert, onUpdate, onDelete, onChange]);

  return { isConnected, isLoading, error, retryConnection };
}

export function usePresence(userId?: string) {
  const { user, userProfile } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const presenceRef = useRef<RealtimeChannel | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase || !userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Set a timeout to prevent hanging in "loading" state
    timeoutRef.current = setTimeout(() => {
      if (isLoading) {
        debug.warn('Presence connection timed out after 10 seconds');
        setIsLoading(false);
        setError(new Error('Presence connection timed out'));
      }
    }, 10000);

    // Update user presence
    const updatePresence = async () => {
      try {
        // Get display name from user profile
        const displayName = userProfile?.display_name || 
                           user?.user_metadata?.display_name || 
                           user?.email?.split('@')[0] || 
                           'User';
        
        debug.log('Updating presence with display name:', displayName);
        
        // Create a promise that rejects after a timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Update presence timed out after 5 seconds')), 5000);
        });
        
        // Race the actual request against the timeout
        await Promise.race([
          supabase.rpc('update_user_presence', {
            presence_status: 'online',
            page_location: window.location.pathname,
            user_display_name: displayName
          }),
          timeoutPromise
        ]);
      } catch (error) {
        debug.error('Error updating presence:', error);
      }
    };

    // Initial presence update
    updatePresence();

    // Create presence channel
    const channel = supabase
      .channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat();
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        debug.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        debug.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
            page: window.location.pathname,
            display_name: userProfile?.display_name || 
                         user?.user_metadata?.display_name || 
                         user?.email?.split('@')[0] || 
                         'User'
          });
          setIsLoading(false);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setError(new Error(`Presence subscription failed: ${status}`));
          setIsLoading(false);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }
      });

    presenceRef.current = channel;

    // Update presence on page visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updatePresence();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Update presence periodically
    const presenceInterval = setInterval(updatePresence, 30000); // Every 30 seconds

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (presenceRef.current) {
        debug.log('Removing presence channel');
        supabase.removeChannel(presenceRef.current);
        presenceRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(presenceInterval);
      setIsLoading(false);
    };
  }, [userId, user, userProfile]);

  return { onlineUsers, isLoading, error };
}

export function useLiveNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to new notifications
  const { isConnected, isLoading: realtimeLoading, error: realtimeError } = useRealtime({
    table: 'notifications',
    filter: `user_id=eq.${userId}`,
    onInsert: (payload) => {
      const newNotification = payload.new;
      setNotifications(prev => [newNotification, ...prev]);
      if (!newNotification.read) {
        setUnreadCount(prev => prev + 1);
      }
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(newNotification.title, {
          body: newNotification.message,
          icon: '/favicon.ico'
        });
      }
    },
    onUpdate: (payload) => {
      const updatedNotification = payload.new;
      setNotifications(prev => 
        prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
      );
      
      // Update unread count
      if (updatedNotification.read && payload.old?.read === false) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  });

  // Load initial notifications
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase || !userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Set a timeout to prevent hanging in "loading" state
    timeoutRef.current = setTimeout(() => {
      if (isLoading) {
        debug.warn('Notifications loading timed out after 8 seconds');
        setIsLoading(false);
        setError(new Error('Notifications loading timed out'));
      }
    }, 8000);

    const loadNotifications = async () => {
      try {
        // Create a promise that rejects after a timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Notifications fetch timed out after 5 seconds')), 5000);
        });
        
        // Race the actual request against the timeout
        const result = await Promise.race([
          // Use the mapped table name
          supabase
            .from(getTableName('notifications' as any))
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50),
          timeoutPromise
        ]);
        
        const { data, error } = result;

        if (error) throw error;

        setNotifications(data || []);
        setUnreadCount(data?.filter(n => !n.read).length || 0);
      } catch (error) {
        debug.error('Error loading notifications:', error);
        setError(error instanceof Error ? error : new Error('Failed to load notifications'));
      } finally {
        setIsLoading(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    };

    loadNotifications();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!isSupabaseConfigured() || !supabase) return;

    try {
      // Create a promise that rejects after a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Mark as read timed out after 5 seconds')), 5000);
      });
      
      // Race the actual request against the timeout
      const result = await Promise.race([
        // Use the mapped table name
        supabase
          .from(getTableName('notifications' as any))
          .update({ read: true })
          .eq('id', notificationId),
        timeoutPromise
      ]);
      
      const { error } = result;

      if (error) throw error;
    } catch (error) {
      debug.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase || !userId) return;

    try {
      // Create a promise that rejects after a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Mark all as read timed out after 5 seconds')), 5000);
      });
      
      // Race the actual request against the timeout
      const result = await Promise.race([
        // Use the mapped table name
        supabase
          .from(getTableName('notifications' as any))
          .update({ read: true })
          .eq('user_id', userId)
          .eq('read', false),
        timeoutPromise
      ]);
      
      const { error } = result;

      if (error) throw error;
      setUnreadCount(0);
    } catch (error) {
      debug.error('Error marking all notifications as read:', error);
    }
  }, [userId]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isLoading,
    isConnected,
    error: error || realtimeError
  };
}