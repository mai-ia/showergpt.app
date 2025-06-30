import { supabase, isSupabaseConfigured } from './supabase';
import { table, getTableName } from '../services/databaseMappingService';
import { debug } from '../utils/debugHelpers';

/**
 * Database Helper Functions
 * 
 * These functions provide a simplified interface for common database operations,
 * using the table mapping service to ensure the correct tables are accessed.
 */

/**
 * Execute a database query with timeout
 */
async function executeWithTimeout<T>(
  queryPromise: Promise<T>, 
  timeoutMs: number = 30000, 
  errorMessage: string = 'Database query timed out'
): Promise<T> {
  // Create a promise that rejects after the timeout
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  
  // Race the actual query against the timeout
  return Promise.race([queryPromise, timeoutPromise]);
}

/**
 * Get a user profile by ID
 */
export async function getUserProfile(userId: string) {
  debug.group(`getUserProfile: ${userId}`);
  
  if (!isSupabaseConfigured() || !supabase) {
    debug.error('Supabase not configured');
    debug.groupEnd();
    throw new Error('Supabase not configured');
  }
  
  try {
    debug.log(`Fetching user profile for user: ${userId}`);
    
    // Use the mapped table name with timeout
    const queryPromise = table('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    const { data, error } = await executeWithTimeout(
      queryPromise,
      50000,
      `Profile fetch for user ${userId} timed out after 50 seconds`
    );
    
    if (error && error.code !== 'PGRST116') {
      // Ignore "not found" errors
      debug.error('Error fetching user profile:', error);
      debug.groupEnd();
      throw error;
    }
    
    debug.log(`User profile fetch result:`, data || 'Not found');
    debug.groupEnd();
    return data;
  } catch (error) {
    debug.error('Error in getUserProfile:', error);
    debug.groupEnd();
    throw error;
  }
}

/**
 * Update a user profile
 */
export async function updateUserProfile(userId: string, profileData: any) {
  debug.group(`updateUserProfile: ${userId}`);
  
  if (!isSupabaseConfigured() || !supabase) {
    debug.error('Supabase not configured');
    debug.groupEnd();
    throw new Error('Supabase not configured');
  }
  
  try {
    debug.log(`Updating user profile for user: ${userId}`);
    debug.log('Profile data:', profileData);
    
    // Use the mapped table name with timeout
    const queryPromise = table('user_profiles')
      .upsert({
        id: userId,
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    const { data, error } = await executeWithTimeout(
      queryPromise,
      40000,
      `Profile update for user ${userId} timed out after 40 seconds`
    );
    
    if (error) {
      debug.error('Error updating user profile:', error);
      debug.groupEnd();
      throw error;
    }
    
    debug.log('User profile updated successfully');
    debug.groupEnd();
    return data;
  } catch (error) {
    debug.error('Error in updateUserProfile:', error);
    debug.groupEnd();
    throw error;
  }
}

/**
 * Get user thoughts
 */
export async function getUserThoughts(userId: string, limit = 50, offset = 0) {
  debug.group(`getUserThoughts: ${userId}`);
  
  if (!isSupabaseConfigured() || !supabase) {
    debug.error('Supabase not configured');
    debug.groupEnd();
    throw new Error('Supabase not configured');
  }
  
  try {
    debug.log(`Fetching thoughts for user: ${userId}`);
    debug.log(`Limit: ${limit}, Offset: ${offset}`);
    
    // Use the mapped table name with timeout
    const queryPromise = table('shower_thoughts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    const { data, error } = await executeWithTimeout(
      queryPromise,
      40000,
      `Thoughts fetch for user ${userId} timed out after 40 seconds`
    );

    if (error) {
      debug.error('Supabase error getting thoughts:', error);
      debug.groupEnd();
      throw error;
    }

    debug.log(`Fetched ${data?.length || 0} thoughts from database`);
    debug.groupEnd();
    return data || [];
  } catch (error) {
    debug.error('Error in getUserThoughts:', error);
    debug.groupEnd();
    throw error;
  }
}

/**
 * Get user favorites
 */
export async function getUserFavorites(userId: string, limit = 50) {
  debug.group(`getUserFavorites: ${userId}`);
  
  if (!isSupabaseConfigured() || !supabase) {
    debug.error('Supabase not configured');
    debug.groupEnd();
    throw new Error('Supabase not configured');
  }
  
  try {
    debug.log(`Fetching favorites for user: ${userId}`);
    debug.log(`Limit: ${limit}`);
    
    // Use the mapped table name with timeout
    const queryPromise = table('user_favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    const { data, error } = await executeWithTimeout(
      queryPromise,
      30000,
      `Favorites fetch for user ${userId} timed out after 30 seconds`
    );
    
    if (error) {
      debug.error('Error fetching user favorites:', error);
      debug.groupEnd();
      throw error;
    }
    
    debug.log(`Fetched ${data?.length || 0} favorites`);
    debug.groupEnd();
    return data || [];
  } catch (error) {
    debug.error('Error in getUserFavorites:', error);
    debug.groupEnd();
    throw error;
  }
}

/**
 * Get categories
 */
export async function getCategories() {
  debug.group('getCategories');
  
  if (!isSupabaseConfigured() || !supabase) {
    debug.error('Supabase not configured');
    debug.groupEnd();
    throw new Error('Supabase not configured');
  }
  
  try {
    debug.log('Fetching categories');
    
    // Use the mapped table name with timeout
    const queryPromise = table('categories')
      .select('*')
      .order('name');
    
    const { data, error } = await executeWithTimeout(
      queryPromise,
      20000,
      'Categories fetch timed out after 20 seconds'
    );
    
    if (error) {
      debug.error('Error fetching categories:', error);
      debug.groupEnd();
      throw error;
    }
    
    debug.log(`Fetched ${data?.length || 0} categories`);
    debug.groupEnd();
    return data || [];
  } catch (error) {
    debug.error('Error in getCategories:', error);
    debug.groupEnd();
    throw error;
  }
}

/**
 * Get comments for a thought
 */
export async function getComments(thoughtId: string) {
  debug.group(`getComments: ${thoughtId}`);
  
  if (!isSupabaseConfigured() || !supabase) {
    debug.error('Supabase not configured');
    debug.groupEnd();
    throw new Error('Supabase not configured');
  }
  
  try {
    debug.log(`Fetching comments for thought: ${thoughtId}`);
    
    // Use the mapped table name with timeout
    const queryPromise = table('comments')
      .select(`
        *,
        profiles!comments_user_id_fkey(username, full_name, avatar_url)
      `)
      .eq('thought_id', thoughtId)
      .order('created_at', { ascending: false });
    
    const { data, error } = await executeWithTimeout(
      queryPromise,
      20000,
      `Comments fetch for thought ${thoughtId} timed out after 20 seconds`
    );
    
    if (error) {
      debug.error('Error fetching comments:', error);
      debug.groupEnd();
      throw error;
    }
    
    debug.log(`Fetched ${data?.length || 0} comments`);
    debug.groupEnd();
    return data || [];
  } catch (error) {
    debug.error('Error in getComments:', error);
    debug.groupEnd();
    throw error;
  }
}

/**
 * Add a comment to a thought
 */
export async function addComment(thoughtId: string, userId: string, content: string, parentId?: string) {
  debug.group(`addComment: ${thoughtId}`);
  
  if (!isSupabaseConfigured() || !supabase) {
    debug.error('Supabase not configured');
    debug.groupEnd();
    throw new Error('Supabase not configured');
  }
  
  try {
    debug.log(`Adding comment for thought: ${thoughtId}`);
    debug.log(`User: ${userId}, Content: ${content}`);
    
    // Use the mapped table name with timeout
    const queryPromise = table('comments')
      .insert({
        thought_id: thoughtId,
        user_id: userId,
        content,
        parent_id: parentId || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    const { data, error } = await executeWithTimeout(
      queryPromise,
      30000,
      `Comment creation for thought ${thoughtId} timed out after 30 seconds`
    );
    
    if (error) {
      debug.error('Error adding comment:', error);
      debug.groupEnd();
      throw error;
    }
    
    debug.log('Comment added successfully:', data);
    debug.groupEnd();
    return data;
  } catch (error) {
    debug.error('Error in addComment:', error);
    debug.groupEnd();
    throw error;
  }
}

/**
 * Create a notification
 */
export async function createNotification(userId: string, type: string, title: string, message: string, data: any = {}) {
  debug.group(`createNotification: ${userId}`);
  
  if (!isSupabaseConfigured() || !supabase) {
    debug.error('Supabase not configured');
    debug.groupEnd();
    throw new Error('Supabase not configured');
  }
  
  try {
    debug.log(`Creating notification for user: ${userId}`);
    debug.log(`Type: ${type}, Title: ${title}`);
    
    // Use the mapped table name with timeout
    const queryPromise = table('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data,
        read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    const { data: notificationData, error } = await executeWithTimeout(
      queryPromise,
      20000,
      `Notification creation for user ${userId} timed out after 20 seconds`
    );
    
    if (error) {
      debug.error('Error creating notification:', error);
      debug.groupEnd();
      throw error;
    }
    
    debug.log('Notification created successfully:', notificationData);
    debug.groupEnd();
    return notificationData;
  } catch (error) {
    debug.error('Error in createNotification:', error);
    debug.groupEnd();
    throw error;
  }
}

export default {
  getUserProfile,
  updateUserProfile,
  getUserThoughts,
  getUserFavorites,
  getCategories,
  getComments,
  addComment,
  createNotification
};