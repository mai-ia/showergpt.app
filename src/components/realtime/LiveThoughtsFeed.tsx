import React, { useState, useEffect } from 'react';
import { Zap, Users, Eye, TrendingUp } from 'lucide-react';
import { ShowerThought } from '../../types';
import { useRealtime } from '../../hooks/useRealtime';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import ThoughtCard from '../ThoughtCard';

interface LiveThoughtsFeedProps {
  onThoughtUpdate?: (thought: ShowerThought) => void;
}

export default function LiveThoughtsFeed({ onThoughtUpdate }: LiveThoughtsFeedProps) {
  const { user } = useAuth();
  const [liveThoughts, setLiveThoughts] = useState<ShowerThought[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  // Subscribe to new public thoughts
  const { isConnected } = useRealtime({
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

    const loadPublicThoughts = async () => {
      try {
        const { data, error } = await supabase
          .from('thoughts')
          .select(`
            *,
            profiles!thoughts_user_id_fkey(username, full_name, avatar_url)
          `)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        const thoughts = (data || []).map(transformThought);
        setLiveThoughts(thoughts);
      } catch (error) {
        console.error('Error loading public thoughts:', error);
      }
    };

    loadPublicThoughts();
  }, []);

  // Simulate viewer count (in real app, this would come from presence)
  useEffect(() => {
    const updateViewerCount = () => {
      setViewerCount(Math.floor(Math.random() * 50) + 10);
    };

    updateViewerCount();
    const interval = setInterval(updateViewerCount, 30000);
    return () => clearInterval(interval);
  }, []);

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
                {isConnected ? 'Connected to live updates' : 'Connecting...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{viewerCount} viewing</span>
            </div>
            {isLive && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <TrendingUp className="w-4 h-4" />
                <span className="font-medium">Live Update!</span>
              </div>
            )}
          </div>
        </div>
      </div>

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

      {liveThoughts.length === 0 && (
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