/*
 * Thoughts Service - Database Operations for Shower Thoughts
 * Handles CRUD operations, favorites, and user history with Supabase
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Local storage fallback keys
const LOCAL_THOUGHTS_KEY = 'showergpt-user-thoughts';
const LOCAL_FAVORITES_KEY = 'showergpt-user-favorites';

/**
 * Save a shower thought to the database or local storage
 */
export async function saveThought(thought, userId = null) {
  try {
    // If Supabase is configured and user is authenticated, save to database
    if (isSupabaseConfigured() && userId && supabase) {
      const thoughtData = {
        content: thought.content,
        topic: thought.topic || null,
        mood: thought.mood,
        source: thought.source || 'template',
        tokens_used: thought.tokensUsed || null,
        cost: thought.cost || null,
        user_id: userId,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('shower_thoughts')
        .insert([thoughtData])
        .select()
        .single();

      if (error) throw error;

      return {
        ...thought,
        id: data.id,
        timestamp: new Date(data.created_at)
      };
    } else {
      // Fallback to local storage
      const localThoughts = getLocalThoughts();
      const thoughtWithId = {
        ...thought,
        id: thought.id || generateLocalId(),
        timestamp: thought.timestamp || new Date()
      };
      
      localThoughts.unshift(thoughtWithId);
      localStorage.setItem(LOCAL_THOUGHTS_KEY, JSON.stringify(localThoughts.slice(0, 100))); // Keep last 100
      
      return thoughtWithId;
    }
  } catch (error) {
    console.error('Error saving thought:', error);
    throw new Error('Failed to save thought. Please try again.');
  }
}

/**
 * Get user's shower thoughts from database or local storage
 */
export async function getUserThoughts(userId = null, limit = 50) {
  try {
    // If Supabase is configured and user is authenticated, get from database
    if (isSupabaseConfigured() && userId && supabase) {
      const { data, error } = await supabase
        .from('shower_thoughts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(thought => ({
        id: thought.id,
        content: thought.content,
        topic: thought.topic,
        mood: thought.mood,
        source: thought.source || 'template',
        tokensUsed: thought.tokens_used,
        cost: thought.cost,
        timestamp: new Date(thought.created_at),
        isFavorite: false, // Will be set by favorites check
        variations: []
      }));
    } else {
      // Fallback to local storage
      return getLocalThoughts().slice(0, limit);
    }
  } catch (error) {
    console.error('Error getting user thoughts:', error);
    throw new Error('Failed to load thoughts. Please try again.');
  }
}

/**
 * Delete a shower thought from database or local storage
 */
export async function deleteThought(thoughtId, userId = null) {
  try {
    // If Supabase is configured and user is authenticated, delete from database
    if (isSupabaseConfigured() && userId && supabase) {
      const { error } = await supabase
        .from('shower_thoughts')
        .delete()
        .eq('id', thoughtId)
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // Fallback to local storage
      const localThoughts = getLocalThoughts();
      const updatedThoughts = localThoughts.filter(thought => thought.id !== thoughtId);
      localStorage.setItem(LOCAL_THOUGHTS_KEY, JSON.stringify(updatedThoughts));
    }

    return true;
  } catch (error) {
    console.error('Error deleting thought:', error);
    throw new Error('Failed to delete thought. Please try again.');
  }
}

/**
 * Add thought to favorites
 */
export async function addToFavorites(thought, userId = null) {
  try {
    // If Supabase is configured and user is authenticated, save to database
    if (isSupabaseConfigured() && userId && supabase) {
      const favoriteData = {
        user_id: userId,
        thought_id: thought.id,
        content: thought.content,
        topic: thought.topic || null,
        mood: thought.mood,
        source: thought.source || 'template',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_favorites')
        .insert([favoriteData])
        .select()
        .single();

      if (error) {
        // Handle duplicate favorites gracefully
        if (error.code === '23505') {
          return thought; // Already favorited
        }
        throw error;
      }

      return {
        ...thought,
        isFavorite: true
      };
    } else {
      // Fallback to local storage
      const localFavorites = getLocalFavorites();
      const favoriteThought = {
        ...thought,
        isFavorite: true,
        favoritedAt: new Date()
      };
      
      // Check if already favorited
      if (!localFavorites.some(fav => fav.id === thought.id)) {
        localFavorites.unshift(favoriteThought);
        localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(localFavorites));
      }
      
      return favoriteThought;
    }
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw new Error('Failed to add to favorites. Please try again.');
  }
}

/**
 * Remove thought from favorites
 */
export async function removeFromFavorites(thoughtId, userId = null) {
  try {
    // If Supabase is configured and user is authenticated, remove from database
    if (isSupabaseConfigured() && userId && supabase) {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('thought_id', thoughtId)
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // Fallback to local storage
      const localFavorites = getLocalFavorites();
      const updatedFavorites = localFavorites.filter(fav => fav.id !== thoughtId);
      localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(updatedFavorites));
    }

    return true;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw new Error('Failed to remove from favorites. Please try again.');
  }
}

/**
 * Get user's favorite thoughts
 */
export async function getUserFavorites(userId = null, limit = 50) {
  try {
    // If Supabase is configured and user is authenticated, get from database
    if (isSupabaseConfigured() && userId && supabase) {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(favorite => ({
        id: favorite.thought_id,
        content: favorite.content,
        topic: favorite.topic,
        mood: favorite.mood,
        source: favorite.source || 'template',
        timestamp: new Date(favorite.created_at),
        isFavorite: true,
        variations: []
      }));
    } else {
      // Fallback to local storage
      return getLocalFavorites().slice(0, limit);
    }
  } catch (error) {
    console.error('Error getting user favorites:', error);
    throw new Error('Failed to load favorites. Please try again.');
  }
}

/**
 * Check if a thought is favorited by the user
 */
export async function isThoughtFavorited(thoughtId, userId = null) {
  try {
    // If Supabase is configured and user is authenticated, check database
    if (isSupabaseConfigured() && userId && supabase) {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('thought_id')
        .eq('thought_id', thoughtId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" errors
      return !!data;
    } else {
      // Fallback to local storage
      const localFavorites = getLocalFavorites();
      return localFavorites.some(fav => fav.id === thoughtId);
    }
  } catch (error) {
    console.error('Error checking if thought is favorited:', error);
    return false;
  }
}

/**
 * Get user's thought statistics
 */
export async function getUserStats(userId = null) {
  try {
    // If Supabase is configured and user is authenticated, get from database
    if (isSupabaseConfigured() && userId && supabase) {
      const [thoughtsResult, favoritesResult] = await Promise.all([
        supabase
          .from('shower_thoughts')
          .select('id, mood, source, tokens_used, cost')
          .eq('user_id', userId),
        supabase
          .from('user_favorites')
          .select('thought_id')
          .eq('user_id', userId)
      ]);

      if (thoughtsResult.error) throw thoughtsResult.error;
      if (favoritesResult.error) throw favoritesResult.error;

      const thoughts = thoughtsResult.data || [];
      const favorites = favoritesResult.data || [];

      const stats = {
        totalThoughts: thoughts.length,
        totalFavorites: favorites.length,
        moodBreakdown: {
          philosophical: thoughts.filter(t => t.mood === 'philosophical').length,
          humorous: thoughts.filter(t => t.mood === 'humorous').length,
          scientific: thoughts.filter(t => t.mood === 'scientific').length
        },
        sourceBreakdown: {
          template: thoughts.filter(t => t.source === 'template').length,
          openai: thoughts.filter(t => t.source === 'openai').length
        },
        totalTokensUsed: thoughts.reduce((sum, t) => sum + (t.tokens_used || 0), 0),
        totalCost: thoughts.reduce((sum, t) => sum + (t.cost || 0), 0)
      };

      return stats;
    } else {
      // Fallback to local storage
      const localThoughts = getLocalThoughts();
      const localFavorites = getLocalFavorites();

      return {
        totalThoughts: localThoughts.length,
        totalFavorites: localFavorites.length,
        moodBreakdown: {
          philosophical: localThoughts.filter(t => t.mood === 'philosophical').length,
          humorous: localThoughts.filter(t => t.mood === 'humorous').length,
          scientific: localThoughts.filter(t => t.mood === 'scientific').length
        },
        sourceBreakdown: {
          template: localThoughts.filter(t => t.source === 'template').length,
          openai: localThoughts.filter(t => t.source === 'openai').length
        },
        totalTokensUsed: localThoughts.reduce((sum, t) => sum + (t.tokensUsed || 0), 0),
        totalCost: localThoughts.reduce((sum, t) => sum + (t.cost || 0), 0)
      };
    }
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw new Error('Failed to load statistics. Please try again.');
  }
}

/**
 * Sync local data to database when user logs in
 */
export async function syncLocalDataToDatabase(userId) {
  try {
    if (!isSupabaseConfigured() || !userId || !supabase) {
      return { thoughts: 0, favorites: 0 };
    }

    const localThoughts = getLocalThoughts();
    const localFavorites = getLocalFavorites();

    let syncedThoughts = 0;
    let syncedFavorites = 0;

    // Sync thoughts
    for (const thought of localThoughts) {
      try {
        await saveThought(thought, userId);
        syncedThoughts++;
      } catch (error) {
        console.warn('Failed to sync thought:', error);
      }
    }

    // Sync favorites
    for (const favorite of localFavorites) {
      try {
        await addToFavorites(favorite, userId);
        syncedFavorites++;
      } catch (error) {
        console.warn('Failed to sync favorite:', error);
      }
    }

    // Clear local storage after successful sync
    if (syncedThoughts > 0) {
      localStorage.removeItem(LOCAL_THOUGHTS_KEY);
    }
    if (syncedFavorites > 0) {
      localStorage.removeItem(LOCAL_FAVORITES_KEY);
    }

    return { thoughts: syncedThoughts, favorites: syncedFavorites };
  } catch (error) {
    console.error('Error syncing local data:', error);
    throw new Error('Failed to sync local data. Please try again.');
  }
}

// Helper functions for local storage
function getLocalThoughts() {
  try {
    const stored = localStorage.getItem(LOCAL_THOUGHTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading local thoughts:', error);
    return [];
  }
}

function getLocalFavorites() {
  try {
    const stored = localStorage.getItem(LOCAL_FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading local favorites:', error);
    return [];
  }
}

function generateLocalId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Export all functions
export default {
  saveThought,
  getUserThoughts,
  deleteThought,
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
  isThoughtFavorited,
  getUserStats,
  syncLocalDataToDatabase
};