import React, { useState, useEffect } from 'react';
import { Zap, Users, Eye, TrendingUp, RefreshCw, AlertTriangle } from 'lucide-react';
import { ShowerThought } from '../../types';
import { useRealtime } from '../../hooks/useRealtime';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import ThoughtCard from '../ThoughtCard';
import { debug } from '../../utils/debugHelpers';
import Button from '../ui/Button';

interface LiveThoughtsFeedProps {
  onThoughtUpdate?: (thought: ShowerThought) => void;
}

export default function LiveThoughtsFeed({ onThoughtUpdate }: LiveThoughtsFeedProps) {
  const { user } = useAuth();
  const [liveThoughts, setLiveThoughts] = useState<ShowerThought[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isManuallyLoading, setIsManuallyLoading] = useState(false);
  const [connectionTimeout, setConnectionTimeout] = useState(false);

  // Subscribe to new public thoughts
  const { isConnected, isLoading, error: realtimeError, retryConnection } = useRealtime({
    table: 'thoughts',
    filter: 'is_public=eq.true',
    onInsert: (payload) => {
      const newThought = transformThought(payload.new);
      setLiveThoughts(prev => [newThought, ...prev.slice(0, 19)]); // Keep last 20
      
      // Show live indicator
      setIsLive(true);
      setTimeout(() => setIsLive(false), 3000);
    },
    onUpdate: (payload) => {
      const updatedThought = transformThought(payload.new);
      setLiveThoughts(prev => 
        prev.map(t => t.id === updatedThought.id ? updatedThought : t)
      );
      onThoughtUpdate?.(updatedThought);
    }
  });

  // Set a timeout for the connecting state
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isLoading && !isConnected) {
      timeoutId = setTimeout(() => {
        setConnectionTimeout(true);
      }, 15000); // Show timeout message after 15 seconds
    } else {
      setConnectionTimeout(false);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading, isConnected]);

  // Subscribe to interaction updates
  useRealtime({
    table: 'interactions',
    onInsert: (payload) => {
      const interaction = payload.new;
      updateThoughtStats(interaction.thought_id, interaction.interaction_type, 1);
    }
  });

  // Load initial public thoughts
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    
    loadPublicThoughts();
    
    // Simulate viewer count (in real app, this would come from presence)
    const updateViewerCount = () => {
      setViewerCount(Math.floor(Math.random() * 50) + 10);
    };

    updateViewerCount();
    const interval = setInterval(updateViewerCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPublicThoughts = async () => {
    debug.log('LiveThoughtsFeed: Loading public thoughts');
    setIsManuallyLoading(true);
    setError(null);
    
    try {
      // Create a promise that rejects after a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Public thoughts fetch timed out after 15 seconds')), 15000);
      });
      
      // Race the actual request against the timeout
      const result = await Promise.race([
        supabase
          .from('thoughts')
          .select(`
            *,
            profiles!thoughts_user_id_fkey(username, full_name, avatar_url)
          `)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(20),
        timeoutPromise
      ]);
      
      const { data, error } = result;

      if (error) {
        debug.error('LiveThoughtsFeed: Error loading public thoughts:', error);
        setError('Failed to load live thoughts. Please try again.');
        throw error;
      }

      debug.log(`LiveThoughtsFeed: Loaded ${data?.length || 0} public thoughts`);
      const thoughts = (data || []).map(transformThought);
      setLiveThoughts(thoughts);
    } catch (error) {
      debug.error('LiveThoughtsFeed: Error in loadPublicThoughts:', error);
      setError('Failed to load live thoughts. Please try again.');
    } finally {
      setIsManuallyLoading(false);
    }
  };

  const transformThought = (data: any): ShowerThought => ({
    id: data.id,
    content: data.content,
    topic: data.title,
    mood: data.category_id ? 'philosophical' : 'humorous', // Simplified mapping
    category: data.category_id?.toString(),
    tags: data.tags || [],
    source: 'template',
    timestamp: new Date(data.created_at),
    isFavorite: false,
    views: data.views_count || 0,
    likes: data.likes_count || 0,
    shares: data.shares_count || 0,
    author: data.profiles ? {
      username: data.profiles.username,
      fullName: data.profiles.full_name,
      avatar: data.profiles.avatar_url
    } : undefined
  });

  const updateThoughtStats = (thoughtId: string, type: string, delta: number) => {
    setLiveThoughts(prev => 
      prev.map(thought => {
        if (thought.id === thoughtId) {
          const updated = { ...thought };
          switch (type) {
            case 'like':
              updated.likes = (updated.likes || 0) + delta;
              break;
            case 'view':
              updated.views = (updated.views || 0) + delta;
              break;
            case 'share':
              updated.shares = (updated.shares || 0) + delta;
              break;
          }
          return updated;
        }
        return thought;
      })
    );
  };

  const handleRefresh = () => {
    loadPublicThoughts();
    if (!isConnected && !isLoading) {
      retryConnection();
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="text-center">
          <Zap className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            Live Feed Unavailable
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Configure Supabase to enable real-time features
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Status Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}>
                {isConnected && (
                  <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
                )}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                Live Thoughts Feed
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                {isConnected ? 'Connected to live updates' : 
                 isLoading ? 'Connecting...' : 
                 'Connection failed'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Users className="w-4 h-4" />
              <span>{viewerCount} viewing</span>
            </div>
            
            <Button
              onClick={handleRefresh}
              disabled={isManuallyLoading}
              variant="secondary"
              size="sm"
              leftIcon={isManuallyLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            >
              {isManuallyLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
            
            {isLive && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <TrendingUp className="w-4 h-4" />
                <span className="font-medium">Live Update!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connection Timeout Message */}
      {connectionTimeout && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-1">
                Connection Taking Longer Than Expected
              </h3>
              <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                The live connection is taking longer than expected. This could be due to network issues or database connectivity problems.
              </p>
              <button
                onClick={handleRefresh}
                className="mt-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-700 transition-colors"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {(error || realtimeError) && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-700 dark:text-red-300 mb-1">
                Connection Error
              </h3>
              <p className="text-red-600 dark:text-red-400 text-sm">
                {error || realtimeError?.message || 'Failed to connect to live feed'}
              </p>
              <button
                onClick={handleRefresh}
                className="mt-2 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {(isLoading || isManuallyLoading) && liveThoughts.length === 0 && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading live thoughts...</p>
        </div>
      )}

      {/* Live Thoughts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {liveThoughts.map((thought, index) => (
          <div
            key={thought.id}
            className={`
              transition-all duration-500 transform
              ${isLive && index === 0 ? 'scale-105 ring-2 ring-green-500 ring-opacity-50' : ''}
            `}
            style={{
              animationDelay: `${index * 100}ms`
            }}
          >
            <ThoughtCard
              thought={thought}
              showAuthor={true}
              onFavoriteChange={() => {}}
              onRegenerate={() => {}}
              onExport={() => {}}
            />
          </div>
        ))}
      </div>

      {!isLoading && !isManuallyLoading && liveThoughts.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-8 max-w-md mx-auto">
            <Eye className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
              Waiting for Live Thoughts
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              New public thoughts will appear here in real-time
            </p>
          </div>
        </div>
      )}
    </div>
  );
}