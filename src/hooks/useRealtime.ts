import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setIsConnected(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Create channel
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          filter
        },
        (payload) => {
          console.log('Realtime update:', payload);
          
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
        console.log('Realtime subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
        setIsLoading(false);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
      setIsLoading(false);
    };
  }, [table, event, filter, onInsert, onUpdate, onDelete, onChange]);

  return { isConnected, isLoading };
}

export function usePresence(userId?: string) {
  const { user, userProfile } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const presenceRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase || !userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Update user presence
    const updatePresence = async () => {
      try {
        // Get display name from user profile
        const displayName = userProfile?.display_name || 
                           user?.user_metadata?.display_name || 
                           user?.email?.split('@')[0] || 
                           'User';
        
        console.log('Updating presence with display name:', displayName);
        
        await supabase.rpc('update_user_presence', {
          presence_status: 'online',
          page_location: window.location.pathname,
          user_display_name: displayName
        });
      } catch (error) {
        console.error('Error updating presence:', error);
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
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
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
        }
        setIsLoading(false);
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
      if (presenceRef.current) {
        supabase.removeChannel(presenceRef.current);
        presenceRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(presenceInterval);
      setIsLoading(false);
    };
  }, [userId, user, userProfile]);

  return { onlineUsers, isLoading };
}

export function useLiveNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to new notifications
  const { isConnected } = useRealtime({
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

    const loadNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        setNotifications(data || []);
        setUnreadCount(data?.filter(n => !n.read).length || 0);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!isSupabaseConfigured() || !supabase) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase || !userId) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [userId]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isLoading,
    isConnected
  };
}