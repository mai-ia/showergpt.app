import { useEffect, useRef, useState } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      return;
    }

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
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [table, event, filter, onInsert, onUpdate, onDelete, onChange]);

  return { isConnected };
}

export function usePresence(userId?: string) {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const presenceRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase || !userId) {
      return;
    }

    // Update user presence
    const updatePresence = async () => {
      try {
        await supabase.rpc('update_user_presence', {
          presence_status: 'online',
          page_location: window.location.pathname
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
            page: window.location.pathname
          });
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
      if (presenceRef.current) {
        supabase.removeChannel(presenceRef.current);
        presenceRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(presenceInterval);
    };
  }, [userId]);

  return { onlineUsers };
}

export function useLiveNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Subscribe to new notifications
  useRealtime({
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
      return;
    }

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
      }
    };

    loadNotifications();
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
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
  };

  const markAllAsRead = async () => {
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
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
}