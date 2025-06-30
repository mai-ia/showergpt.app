import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { debug } from '../utils/debugHelpers';
import { table, getTableName } from './databaseMappingService';

// Local storage fallback keys
const LOCAL_THOUGHTS_KEY = 'showergpt-user-thoughts';
const LOCAL_FAVORITES_KEY = 'showergpt-user-favorites';

/**
 * Generate a proper UUID v4
 */
function generateUUID() {
  debug.log('Generating new UUID');
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Normalize ID to ensure it's a proper string format
 */
function normalizeId(id) {
  if (!id) return null;
  const result = typeof id === 'string' ? id : id.toString();
  debug.log(`Normalizing ID: ${id} → ${result}`);
  return result;
}

/**
 * Validate UUID format
 */
function isValidUUID(id) {
  if (!id || typeof id !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isValid = uuidRegex.test(id);
  debug.log(`Validating UUID: ${id} → ${isValid ? 'valid' : 'invalid'}`);
  return isValid;
}

/**
 * Safe UUID conversion for database operations
 */
function safeUUID(id) {
  debug.log(`Converting to safe UUID: ${id}`);
  const normalizedId = normalizeId(id);
  if (!normalizedId) {
    debug.warn('Null or undefined ID provided to safeUUID');
    return null;
  }
  
  // If it's already a valid UUID, return it
  if (isValidUUID(normalizedId)) {
    debug.log(`ID is already a valid UUID: ${normalizedId}`);
    return normalizedId;
  }
  
  // If it's a timestamp-based ID from local storage, generate a new UUID
  if (normalizedId.match(/^\d+/)) {
    const newUuid = generateUUID();
    debug.log(`Converting timestamp-based ID to UUID: ${normalizedId} → ${newUuid}`);
    return newUuid;
  }
  
  debug.warn(`Invalid ID format, generating new UUID: ${normalizedId}`);
  return generateUUID();
}

/**
 * Convert local storage thought to database format
 */
function convertLocalThoughtToDb(thought) {
  debug.log('Converting local thought to DB format:', thought);
  return {
    id: generateUUID(), // Always generate new UUID for database
    content: thought.content,
    topic: thought.topic || null,
    mood: thought.mood,
    category: thought.category || null,
    tags: thought.tags || [],
    source: thought.source || 'template',
    tokens_used: thought.tokensUsed || null,
    cost: thought.cost || null,
    views_count: thought.views || 0,
    likes_count: thought.likes || 0,
    shares_count: thought.shares || 0,
    created_at: thought.timestamp ? new Date(thought.timestamp).toISOString() : new Date().toISOString()
  };
}

/**
 * Helper function to convert timestamp strings back to Date objects
 */
function convertTimestampToDate(thought) {
  debug.log('Converting timestamp strings to Date objects');
  return {
    ...thought,
    timestamp: thought.timestamp ? new Date(thought.timestamp) : new Date(),
    favoritedAt: thought.favoritedAt ? new Date(thought.favoritedAt) : undefined
  };
}

/**
 * Request deduplication cache
 */
const requestCache = new Map();

/**
 * Clear the request cache
 */
function clearRequestCache() {
  debug.log('Clearing request cache');
  requestCache.clear();
}

/**
 * Execute a database query with timeout
 */
async function executeWithTimeout(queryPromise, timeoutMs = 30000, errorMessage = 'Database query timed out') {
  // Create a promise that rejects after the timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  
  // Race the actual query against the timeout
  return Promise.race([queryPromise, timeoutPromise]);
}

/**
 * Deduplicated request wrapper with timeout
 */
async function deduplicatedRequest(key, requestFn, timeoutMs = 30000) {
  debug.log(`Deduplicated request: ${key}`);
  
  if (requestCache.has(key)) {
    debug.log(`Cache hit for key: ${key}`);
    return requestCache.get(key);
  }
  
  debug.log(`Cache miss for key: ${key}, executing request`);
  
  // Create a promise with timeout
  const promise = executeWithTimeout(
    requestFn(),
    timeoutMs,
    `Request timed out after ${timeoutMs}ms: ${key}`
  );
  
  requestCache.set(key, promise);
  
  try {
    const result = await promise;
    debug.log(`Request completed successfully for key: ${key}`);
    return result;
  } catch (error) {
    debug.error(`Request failed for key: ${key}`, error);
    throw error;
  } finally {
    // Clean up cache after a short delay to prevent memory leaks
    debug.log(`Scheduling cache cleanup for key: ${key}`);
    setTimeout(() => {
      debug.log(`Removing from cache: ${key}`);
      requestCache.delete(key);
    }, 1000);
  }
}

/**
 * Save a shower thought to the database or local storage
 */
export async function saveThought(thought, userId = null) {
  debug.group(`saveThought: ${thought.id}`);
  debug.log('Saving thought with params:', { thoughtId: thought.id, userId });
  
  try {
    // If Supabase is configured and user is authenticated, save to database
    if (isSupabaseConfigured() && userId && supabase) {
      debug.log('Saving to Supabase database');
      const thoughtData = convertLocalThoughtToDb(thought);
      thoughtData.user_id = userId;

      debug.log('Prepared thought data for DB:', thoughtData);
      
      // Use the mapped table name with timeout
      const queryPromise = table('shower_thoughts')
        .insert([thoughtData])
        .select()
        .single();
      
      const { data, error } = await executeWithTimeout(
        queryPromise,
        45000,
        `Thought save timed out after 45 seconds for thought ${thought.id}`
      );

      if (error) {
        debug.error('Supabase error saving thought:', error);
        throw error;
      }

      debug.log('Thought saved successfully to DB:', data);
      const result = {
        ...thought,
        id: data.id,
        timestamp: new Date(data.created_at),
        views: data.views_count || 0,
        likes: data.likes_count || 0,
        shares: data.shares_count || 0
      };
      
      // Clear cache to ensure fresh data on next fetch
      clearRequestCache();
      
      debug.log('Returning saved thought:', result);
      debug.groupEnd();
      return result;
    } else {
      // Fallback to local storage
      debug.log('Saving to local storage (Supabase not configured or user not authenticated)');
      const localThoughts = getLocalThoughts();
      const thoughtWithId = {
        ...thought,
        id: thought.id || generateLocalId(),
        timestamp: thought.timestamp || new Date(),
        views: 0,
        likes: 0,
        shares: 0
      };
      
      debug.log('Prepared thought for local storage:', thoughtWithId);
      localThoughts.unshift(thoughtWithId);
      localStorage.setItem(LOCAL_THOUGHTS_KEY, JSON.stringify(localThoughts.slice(0, 100))); // Keep last 100
      
      debug.log('Thought saved to local storage');
      debug.groupEnd();
      return thoughtWithId;
    }
  } catch (error) {
    debug.error('Error saving thought:', error);
    debug.groupEnd();
    throw new Error('Failed to save thought. Please try again.');
  }
}

/**
 * Get user's shower thoughts from database or local storage
 */
export async function getUserThoughts(userId = null, limit = 50, offset = 0) {
  debug.group(`getUserThoughts: ${userId}`);
  debug.log('Getting thoughts with params:', { userId, limit, offset });
  
  try {
    // If Supabase is configured and user is authenticated, get from database
    if (isSupabaseConfigured() && userId && supabase) {
      debug.log('Fetching thoughts from Supabase database');
      const cacheKey = `user-thoughts-${userId}-${limit}-${offset}`;
      
      return await deduplicatedRequest(cacheKey, async () => {
        debug.log('Executing Supabase query for thoughts');
        
        // Use the mapped table name with timeout
        const queryPromise = table('shower_thoughts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        
        const { data, error } = await executeWithTimeout(
          queryPromise,
        45000,
        `Thoughts fetch timed out after 45 seconds for user ${userId}`
        );

        if (error) {
          debug.error('Supabase error getting thoughts:', error);
          throw error;
        }

        debug.log(`Fetched ${data?.length || 0} thoughts from database`);
        
        const thoughts = (data || []).map(thought => ({
          id: thought.id,
          content: thought.content,
          topic: thought.topic,
          mood: thought.mood,
          category: thought.category,
          tags: thought.tags || [],
          source: thought.source || 'template',
          tokensUsed: thought.tokens_used,
          cost: thought.cost,
          views: thought.views_count || 0,
          likes: thought.likes_count || 0,
          shares: thought.shares_count || 0,
          timestamp: new Date(thought.created_at),
          isFavorite: false, // Will be set by favorites check
          variations: []
        }));
        
        // Check favorite status for each thought
        for (let i = 0; i < thoughts.length; i++) {
          try {
            thoughts[i].isFavorite = await isThoughtFavorited(thoughts[i].id, userId);
          } catch (error) {
            debug.warn(`Error checking favorite status for thought ${thoughts[i].id}:`, error);
          }
        }
        
        debug.log('Processed thoughts:', thoughts.length);
        debug.groupEnd();
        return thoughts;
      }, 40000);
    } else {
      // Fallback to local storage
      debug.log('Fetching thoughts from local storage');
      const localThoughts = getLocalThoughts();
      debug.log(`Found ${localThoughts.length} thoughts in local storage`);
      const result = localThoughts.slice(offset, offset + limit);
      debug.log(`Returning ${result.length} thoughts from local storage`);
      debug.groupEnd();
      return result;
    }
  } catch (error) {
    debug.error('Error getting user thoughts:', error);
    debug.groupEnd();
    throw new Error('Failed to load thoughts. Please try again.');
  }
}

/**
 * Delete a shower thought from database or local storage
 */
export async function deleteThought(thoughtId, userId = null) {
  debug.group(`deleteThought: ${thoughtId}`);
  debug.log('Deleting thought with params:', { thoughtId, userId });
  
  try {
    if (!thoughtId && isSupabaseConfigured() && userId) {
      debug.error('Invalid thought ID format:', thoughtId);
      throw new Error('Invalid thought ID format');
    }

    // If Supabase is configured and user is authenticated, delete from database
    if (isSupabaseConfigured() && userId && supabase) {
      debug.log('Deleting from Supabase database');
      
      // Use the mapped table name with timeout
      const queryPromise = table('shower_thoughts')
        .delete()
        .eq('id', thoughtId)
        .eq('user_id', userId);
      
      const { error } = await executeWithTimeout(
        queryPromise,
        40000,
        `Thought delete timed out after 40 seconds for thought ${thoughtId}`
      );

      if (error) {
        debug.error('Supabase error deleting thought:', error);
        throw error;
      }
      
      debug.log('Thought deleted successfully from database');
      
      // Clear cache to ensure fresh data on next fetch
      clearRequestCache();
    } else {
      // Fallback to local storage
      debug.log('Deleting from local storage');
      const localThoughts = getLocalThoughts();
      const updatedThoughts = localThoughts.filter(thought => thought.id !== thoughtId);
      localStorage.setItem(LOCAL_THOUGHTS_KEY, JSON.stringify(updatedThoughts));
      debug.log('Thought deleted from local storage');
    }

    debug.groupEnd();
    return true;
  } catch (error) {
    debug.error('Error deleting thought:', error);
    debug.groupEnd();
    throw new Error('Failed to delete thought. Please try again.');
  }
}

/**
 * Add thought to favorites
 */
export async function addToFavorites(thought, userId = null) {
  debug.group(`addToFavorites: ${thought.id}`);
  debug.log('Adding to favorites with params:', { thoughtId: thought.id, userId });
  
  try {
    // If Supabase is configured and user is authenticated, save to database
    if (isSupabaseConfigured() && userId && supabase) {
      debug.log('Adding to favorites in Supabase database');
      let thoughtToFavorite = thought;
      let thoughtId = thought.id;
      
      // If the thought doesn't have a valid UUID, it's from local storage
      // Save it to the database first to get a proper UUID
      if (!isValidUUID(thoughtId)) {
        debug.log('Thought has invalid UUID, saving to database first:', thoughtId);
        try {
          thoughtToFavorite = await saveThought(thought, userId);
          thoughtId = thoughtToFavorite.id;
          debug.log('Thought saved to database with new ID:', thoughtId);
        } catch (saveError) {
          debug.error('Failed to save thought to database:', saveError);
          throw new Error('Failed to save thought to database before favoriting.');
        }
      }

      const favoriteData = {
        user_id: userId,
        thought_id: thoughtId,
        content: thoughtToFavorite.content,
        topic: thoughtToFavorite.topic || null,
        mood: thoughtToFavorite.mood,
        source: thoughtToFavorite.source || 'template',
        created_at: new Date().toISOString()
      };

      debug.log('Prepared favorite data:', favoriteData);
      
      // Use the mapped table name with timeout
      const queryPromise = table('user_favorites')
        .insert([favoriteData])
        .select()
        .single();
      
      const { data, error } = await executeWithTimeout(
        queryPromise,
          40000,
          `Favorite add timed out after 40 seconds for thought ${thoughtId}`
        );

      if (error) {
        // Handle duplicate favorites gracefully
        if (error.code === '23505') {
          debug.log('Thought already favorited (constraint violation)');
          return { ...thoughtToFavorite, isFavorite: true }; // Already favorited
        }
        debug.error('Supabase error adding to favorites:', error);
        throw error;
      }

      debug.log('Favorite added successfully to database:', data);
      const result = {
        ...thoughtToFavorite,
        isFavorite: true
      };
      
      // Clear cache to ensure fresh data on next fetch
      clearRequestCache();
      
      debug.log('Returning favorited thought:', result);
      debug.groupEnd();
      return result;
    } else {
      // Fallback to local storage
      debug.log('Adding to favorites in local storage');
      const localFavorites = getLocalFavorites();
      const favoriteThought = {
        ...thought,
        isFavorite: true,
        favoritedAt: new Date()
      };
      
      // Check if already favorited
      if (!localFavorites.some(fav => fav.id === thought.id)) {
        debug.log('Adding new favorite to local storage');
        localFavorites.unshift(favoriteThought);
        localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(localFavorites));
      } else {
        debug.log('Thought already favorited in local storage');
      }
      
      debug.log('Returning favorited thought from local storage');
      debug.groupEnd();
      return favoriteThought;
    }
  } catch (error) {
    debug.error('Error adding to favorites:', error);
    debug.groupEnd();
    throw error; // Re-throw to preserve original error message
  }
}

/**
 * Remove thought from favorites
 */
export async function removeFromFavorites(thoughtId, userId = null) {
  debug.group(`removeFromFavorites: ${thoughtId}`);
  debug.log('Removing from favorites with params:', { thoughtId, userId });
  
  try {
    // If Supabase is configured and user is authenticated, remove from database
    if (isSupabaseConfigured() && userId && supabase) {
      debug.log('Removing from favorites in Supabase database');
      if (!thoughtId) {
        debug.warn('Invalid thought ID for favorite removal:', thoughtId);
        debug.groupEnd();
        return true; // Silently succeed for invalid IDs
      }

      debug.log('Executing Supabase query to remove favorite');
      
      // Use the mapped table name with timeout
      const queryPromise = table('user_favorites')
        .delete()
        .eq('thought_id', thoughtId)
        .eq('user_id', userId);
      
      const { error } = await executeWithTimeout(
        queryPromise,
         40000,
         `Favorite removal timed out after 40 seconds for thought ${thoughtId}`
       );

      if (error) {
        debug.error('Supabase error removing from favorites:', error);
        throw error;
      }
      
      debug.log('Favorite removed successfully from database');
      
      // Clear cache to ensure fresh data on next fetch
      clearRequestCache();
    } else {
      // Fallback to local storage
      debug.log('Removing from favorites in local storage');
      const localFavorites = getLocalFavorites();
      const updatedFavorites = localFavorites.filter(fav => fav.id !== thoughtId);
      localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(updatedFavorites));
      debug.log('Favorite removed from local storage');
    }

    debug.groupEnd();
    return true;
  } catch (error) {
    debug.error('Error removing from favorites:', error);
    debug.groupEnd();
    throw new Error('Failed to remove from favorites. Please try again.');
  }
}

/**
 * Get user's favorite thoughts
 */
export async function getUserFavorites(userId = null, limit = 50) {
  debug.group(`getUserFavorites: ${userId}`);
  debug.log('Getting favorites with params:', { userId, limit });
  
  try {
    // If Supabase is configured and user is authenticated, get from database
    if (isSupabaseConfigured() && userId && supabase) {
      debug.log('Fetching favorites from Supabase database');
      const cacheKey = `user-favorites-${userId}-${limit}`;
      
      return await deduplicatedRequest(cacheKey, async () => {
        debug.log('Executing Supabase query for favorites');
        
        // Use the mapped table name with timeout
        const queryPromise = table('user_favorites')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);
        
        const { data, error } = await executeWithTimeout(
          queryPromise,
          40000,
          `Favorites fetch timed out after 40 seconds for user ${userId}`
        );

        if (error) {
          debug.error('Supabase error getting favorites:', error);
          throw error;
        }

        debug.log(`Fetched ${data?.length || 0} favorites from database`);
        
        const favorites = (data || []).map(favorite => ({
          id: favorite.thought_id,
          content: favorite.content,
          topic: favorite.topic,
          mood: favorite.mood,
          source: favorite.source || 'template',
          timestamp: new Date(favorite.created_at),
          isFavorite: true,
          variations: []
        }));
        
        debug.log('Processed favorites:', favorites.length);
        debug.groupEnd();
        return favorites;
      }, 30000);
    } else {
      // Fallback to local storage
      debug.log('Fetching favorites from local storage');
      const localFavorites = getLocalFavorites();
      debug.log(`Found ${localFavorites.length} favorites in local storage`);
      const result = localFavorites.slice(0, limit);
      debug.log(`Returning ${result.length} favorites from local storage`);
      debug.groupEnd();
      return result;
    }
  } catch (error) {
    debug.error('Error getting user favorites:', error);
    debug.groupEnd();
    throw new Error('Failed to load favorites. Please try again.');
  }
}

/**
 * Check if a thought is favorited by the user
 */
export async function isThoughtFavorited(thoughtId, userId = null) {
  debug.group(`isThoughtFavorited: ${thoughtId}`);
  debug.log('Checking favorite status with params:', { thoughtId, userId });
  
  try {
    // If Supabase is configured and user is authenticated, check database
    if (isSupabaseConfigured() && userId && supabase) {
      debug.log('Checking favorite status in Supabase database');
      if (!thoughtId) {
        debug.warn('Invalid thought ID format:', thoughtId);
        debug.groupEnd();
        return false;
      }

      const cacheKey = `thought-favorited-${userId}-${thoughtId}`;
      
      return await deduplicatedRequest(cacheKey, async () => {
        debug.log('Executing Supabase query to check favorite status');
        
        // Use the mapped table name with timeout
        const queryPromise = table('user_favorites')
          .select('thought_id')
          .eq('thought_id', thoughtId)
          .eq('user_id', userId)
          .limit(1);
        
        const { data, error } = await executeWithTimeout(
          queryPromise,
          30000,
          `Favorite check timed out after 30 seconds for thought ${thoughtId}`
        );

        if (error && error.code !== 'PGRST116') {
          debug.error('Supabase error checking favorite status:', error);
          throw error;
        }
        
        const isFavorited = data && data.length > 0;
        debug.log(`Favorite status: ${isFavorited ? 'favorited' : 'not favorited'}`);
        debug.groupEnd();
        return isFavorited;
      }, 40000);
    } else {
      // Fallback to local storage
      debug.log('Checking favorite status in local storage');
      const localFavorites = getLocalFavorites();
      const isFavorited = localFavorites.some(fav => fav.id === thoughtId);
      debug.log(`Favorite status from local storage: ${isFavorited ? 'favorited' : 'not favorited'}`);
      debug.groupEnd();
      return isFavorited;
    }
  } catch (error) {
    debug.error('Error checking if thought is favorited:', error);
    debug.groupEnd();
    return false;
  }
}

/**
 * Increment thought views
 */
export async function incrementThoughtViews(thoughtId) {
  debug.group(`incrementThoughtViews: ${thoughtId}`);
  debug.log('Incrementing views for thought:', thoughtId);
  
  try {
    if (!thoughtId) {
      debug.warn('Invalid thought ID for view increment:', thoughtId);
      debug.groupEnd();
      return 1;
    }

    if (isSupabaseConfigured() && supabase) {
      debug.log('Incrementing views in Supabase database');
      
      // Create a promise that rejects after a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('View increment timed out after 30 seconds')), 30000);
      });
      
      // Race the actual request against the timeout
      const result = await Promise.race([
        supabase.rpc('increment_shower_thought_views', { thought_id: thoughtId }),
        timeoutPromise
      ]);
      
      const { data, error } = result;

      if (error) {
        debug.error('Database error incrementing views:', error);
        debug.groupEnd();
        return 1;
      }
      debug.log('Views incremented successfully, new count:', data);
      debug.groupEnd();
      return data || 1;
    }
    debug.log('Supabase not configured, returning default view count');
    debug.groupEnd();
    return 1; // Fallback for local storage
  } catch (error) {
    debug.error('Error incrementing views:', error);
    debug.groupEnd();
    return 1;
  }
}

/**
 * Toggle thought like
 */
export async function toggleThoughtLike(thoughtId, userId = null) {
  debug.group(`toggleThoughtLike: ${thoughtId}`);
  debug.log('Toggling like with params:', { thoughtId, userId });
  
  try {
    if (!thoughtId) {
      debug.warn('Invalid thought ID for like toggle:', thoughtId);
      debug.groupEnd();
      return 0;
    }

    if (isSupabaseConfigured() && userId && supabase) {
      debug.log('Toggling like in Supabase database');
      
      // Create a promise that rejects after a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Like toggle timed out after 40 seconds')), 40000);
      });
      
      // Race the actual request against the timeout
      const result = await Promise.race([
        supabase.rpc('toggle_shower_thought_like', { 
          thought_id: thoughtId, 
          user_id: userId 
        }),
        timeoutPromise
      ]);
      
      const { data, error } = result;

      if (error) {
        debug.error('Database error toggling like:', error);
        debug.groupEnd();
        return 0;
      }
      debug.log('Like toggled successfully, new count:', data);
      debug.groupEnd();
      return data || 0;
    }
    debug.log('Supabase not configured or user not authenticated, returning default like count');
    debug.groupEnd();
    return 0; // Fallback for local storage
  } catch (error) {
    debug.error('Error toggling like:', error);
    debug.groupEnd();
    return 0;
  }
}

/**
 * Increment thought shares
 */
export async function incrementThoughtShares(thoughtId) {
  debug.group(`incrementThoughtShares: ${thoughtId}`);
  debug.log('Incrementing shares for thought:', thoughtId);
  
  try {
    if (!thoughtId) {
      debug.warn('Invalid thought ID for share increment:', thoughtId);
      debug.groupEnd();
      return 1;
    }

    if (isSupabaseConfigured() && supabase) {
      debug.log('Incrementing shares in Supabase database');
      
      // Create a promise that rejects after a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Share increment timed out after 30 seconds')), 30000);
      });
      
      // Race the actual request against the timeout
      const result = await Promise.race([
        supabase.rpc('increment_shower_thought_shares', { thought_id: thoughtId }),
        timeoutPromise
      ]);
      
      const { data, error } = result;

      if (error) {
        debug.error('Database error incrementing shares:', error);
        debug.groupEnd();
        return 1;
      }
      debug.log('Shares incremented successfully, new count:', data);
      debug.groupEnd();
      return data || 1;
    }
    debug.log('Supabase not configured, returning default share count');
    debug.groupEnd();
    return 1; // Fallback for local storage
  } catch (error) {
    debug.error('Error incrementing shares:', error);
    debug.groupEnd();
    return 1;
  }
}

/**
 * Reorder favorites (for drag and drop)
 */
export async function reorderFavorites(userId, orderedIds) {
  debug.group('reorderFavorites');
  debug.log('Reordering favorites with params:', { userId, orderedIdsCount: orderedIds?.length });
  
  try {
    if (isSupabaseConfigured() && userId && supabase) {
      debug.log('Reordering favorites in Supabase database');
      // Filter out any null/undefined IDs
      const validIds = orderedIds.filter(Boolean);
      
      if (validIds.length !== orderedIds.length) {
        debug.warn('Some invalid IDs found in reorder operation');
      }

      debug.log(`Processing ${validIds.length} valid IDs for reordering`);
      
      // Update the order in the database with timeout
      for (let i = 0; i < validIds.length; i++) {
        debug.log(`Setting order_index=${i} for thought_id=${validIds[i]}`);
        
        // Use the mapped table name with timeout
        const queryPromise = table('user_favorites')
          .update({ order_index: i })
          .eq('user_id', userId)
          .eq('thought_id', validIds[i]);
        
        await executeWithTimeout(
        queryPromise,
        30000,
       `Reorder operation timed out for thought_id=${validIds[i]}`
      );
      }
      
      debug.log('Favorites reordered successfully');
      
      // Clear cache to ensure fresh data on next fetch
      clearRequestCache();
    } else {
      debug.log('Supabase not configured or user not authenticated, skipping reorder');
    }
    // For local storage, the order is maintained by the array order
    debug.groupEnd();
    return true;
  } catch (error) {
    debug.error('Error reordering favorites:', error);
    debug.groupEnd();
    throw new Error('Failed to reorder favorites. Please try again.');
  }
}

/**
 * Get user's thought statistics
 */
export async function getUserStats(userId = null) {
  debug.group(`getUserStats: ${userId}`);
  debug.log('Getting user stats with params:', { userId });
  
  try {
    // If Supabase is configured and user is authenticated, get from database
    if (isSupabaseConfigured() && userId && supabase) {
      debug.log('Fetching stats from Supabase database');
      
      debug.log('Executing Supabase queries for thoughts and favorites');
      
      // Use the mapped table names with timeout
      const [thoughtsResult, favoritesResult] = await Promise.all([
        executeWithTimeout(
          table('shower_thoughts')
            .select('id, mood, source, tokens_used, cost, category')
            .eq('user_id', userId),
          40000,
          `Thoughts stats fetch timed out after 40 seconds for user ${userId}`
        ),
        executeWithTimeout(
          table('user_favorites')
            .select('thought_id')
            .eq('user_id', userId),
          40000,
          `Favorites stats fetch timed out after 40 seconds for user ${userId}`
        )
      ]);

      if (thoughtsResult.error) {
        debug.error('Supabase error getting thoughts for stats:', thoughtsResult.error);
        throw thoughtsResult.error;
      }
      if (favoritesResult.error) {
        debug.error('Supabase error getting favorites for stats:', favoritesResult.error);
        throw favoritesResult.error;
      }

      const thoughts = thoughtsResult.data || [];
      const favorites = favoritesResult.data || [];
      
      debug.log(`Found ${thoughts.length} thoughts and ${favorites.length} favorites`);

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
        categoryBreakdown: thoughts.reduce((acc, t) => {
          const category = t.category || 'uncategorized';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {}),
        totalTokensUsed: thoughts.reduce((sum, t) => sum + (t.tokens_used || 0), 0),
        totalCost: thoughts.reduce((sum, t) => sum + (t.cost || 0), 0)
      };

      debug.log('Calculated user stats:', stats);
      debug.groupEnd();
      return stats;
    } else {
      // Fallback to local storage
      debug.log('Calculating stats from local storage');
      const localThoughts = getLocalThoughts();
      const localFavorites = getLocalFavorites();
      
      debug.log(`Found ${localThoughts.length} thoughts and ${localFavorites.length} favorites in local storage`);

      const stats = {
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
        categoryBreakdown: localThoughts.reduce((acc, t) => {
          const category = t.category || 'uncategorized';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {}),
        totalTokensUsed: localThoughts.reduce((sum, t) => sum + (t.tokensUsed || 0), 0),
        totalCost: localThoughts.reduce((sum, t) => sum + (t.cost || 0), 0)
      };

      debug.log('Calculated local storage stats:', stats);
      debug.groupEnd();
      return stats;
    }
  } catch (error) {
    debug.error('Error getting user stats:', error);
    debug.groupEnd();
    throw new Error('Failed to load statistics. Please try again.');
  }
}

/**
 * Sync local data to database when user logs in
 */
export async function syncLocalDataToDatabase(userId) {
  debug.group(`syncLocalDataToDatabase: ${userId}`);
  debug.log('Syncing local data to database for user:', userId);
  
  try {
    if (!isSupabaseConfigured() || !userId || !supabase) {
      debug.log('Supabase not configured or user not authenticated, skipping sync');
      debug.groupEnd();
      return { thoughts: 0, favorites: 0 };
    }

    const localThoughts = getLocalThoughts();
    const localFavorites = getLocalFavorites();
    
    debug.log(`Found ${localThoughts.length} thoughts and ${localFavorites.length} favorites in local storage`);

    let syncedThoughts = 0;
    let syncedFavorites = 0;

    // Create a mapping from local IDs to database UUIDs
    const idMapping = new Map();

    // Sync thoughts first and build ID mapping
    debug.log('Starting to sync thoughts to database');
    for (const thought of localThoughts) {
      try {
        debug.log(`Syncing thought: ${thought.id}`);
        const savedThought = await saveThought(thought, userId);
        // Map the local ID to the new database UUID
        idMapping.set(thought.id, savedThought.id);
        debug.log(`Mapped local ID ${thought.id} to database ID ${savedThought.id}`);
        syncedThoughts++;
      } catch (error) {
        debug.warn(`Failed to sync thought ${thought.id}:`, error);
      }
    }
    debug.log(`Synced ${syncedThoughts} thoughts to database`);

    // Sync favorites using the ID mapping
    debug.log('Starting to sync favorites to database');
    for (const favorite of localFavorites) {
      try {
        // Get the database UUID for this thought
        const databaseId = idMapping.get(favorite.id);
        
        if (databaseId) {
          debug.log(`Syncing favorite: ${favorite.id} → ${databaseId}`);
          // Create a new favorite object with the correct database ID
          const favoriteWithDbId = {
            ...favorite,
            id: databaseId
          };
          
          await addToFavorites(favoriteWithDbId, userId);
          syncedFavorites++;
        } else {
          debug.warn(`Could not find database ID for favorite: ${favorite.id}`);
        }
      } catch (error) {
        debug.warn(`Failed to sync favorite ${favorite.id}:`, error);
      }
    }
    debug.log(`Synced ${syncedFavorites} favorites to database`);

    // Clear local storage after successful sync
    if (syncedThoughts > 0) {
      debug.log('Clearing local thoughts storage after successful sync');
      localStorage.removeItem(LOCAL_THOUGHTS_KEY);
    }
    if (syncedFavorites > 0) {
      debug.log('Clearing local favorites storage after successful sync');
      localStorage.removeItem(LOCAL_FAVORITES_KEY);
    }
    
    // Clear cache to ensure fresh data on next fetch
    clearRequestCache();

    const result = { thoughts: syncedThoughts, favorites: syncedFavorites };
    debug.log('Sync completed successfully:', result);
    debug.groupEnd();
    return result;
  } catch (error) {
    debug.error('Error syncing local data:', error);
    debug.groupEnd();
    throw new Error('Failed to sync local data. Please try again.');
  }
}

// Helper functions for local storage
function getLocalThoughts() {
  debug.log('Getting thoughts from local storage');
  try {
    const stored = localStorage.getItem(LOCAL_THOUGHTS_KEY);
    const thoughts = stored ? JSON.parse(stored) : [];
    debug.log(`Found ${thoughts.length} thoughts in local storage`);
    return thoughts.map(convertTimestampToDate);
  } catch (error) {
    debug.error('Error reading local thoughts:', error);
    return [];
  }
}

function getLocalFavorites() {
  debug.log('Getting favorites from local storage');
  try {
    const stored = localStorage.getItem(LOCAL_FAVORITES_KEY);
    const favorites = stored ? JSON.parse(stored) : [];
    debug.log(`Found ${favorites.length} favorites in local storage`);
    return favorites.map(convertTimestampToDate);
  } catch (error) {
    debug.error('Error reading local favorites:', error);
    return [];
  }
}

function generateLocalId() {
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  debug.log(`Generated local ID: ${id}`);
  return id;
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
  incrementThoughtViews,
  toggleThoughtLike,
  incrementThoughtShares,
  reorderFavorites,
  getUserStats,
  syncLocalDataToDatabase,
  clearRequestCache
};