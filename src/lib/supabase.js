import { createClient } from '@supabase/supabase-js';
import { debug } from '../utils/debugHelpers';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate Supabase configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase configuration missing. Authentication features will be disabled.');
}

// Create a single Supabase client instance
let supabaseInstance = null;

// Initialize Supabase client
const initSupabase = () => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  try {
    debug.log('Initializing Supabase client');
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-client-info': 'showergpt-web'
        }
      },
      // Add default timeout for all requests
      realtime: {
        timeout: 60000 // 60 seconds
      }
    });
    debug.log('Supabase client initialized successfully');
    return supabaseInstance;
  } catch (error) {
    debug.error('Error initializing Supabase client:', error);
    return null;
  }
};

// Get the Supabase client instance
export const supabase = initSupabase();

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseAnonKey && supabase !== null;
};

// Auth helper functions
export const authHelpers = {
  // Sign up with email and password
  async signUp(email, password, userData = {}) {
    debug.group('authHelpers.signUp');
    debug.log('Signing up user:', email);
    
    if (!supabase) {
      debug.error('Supabase not configured');
      debug.groupEnd();
      throw new Error('Supabase not configured');
    }
    
    try {
      // Create a promise that rejects after a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sign up request timed out after 180 seconds')), 180000);
      });
      
      // Race the actual request against the timeout
      const result = await Promise.race([
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: userData
          }
        }),
        timeoutPromise
      ]);
      
      const { data, error } = result;
      
      if (error) {
        debug.error('Sign up error:', error);
        debug.groupEnd();
        throw error;
      }
      
      debug.log('Sign up successful:', data.user?.id);
      debug.groupEnd();
      return data;
    } catch (error) {
      debug.error('Sign up error:', error);
      debug.groupEnd();
      throw error;
    }
  },

  // Sign in with email and password
  async signIn(email, password) {
    debug.group('authHelpers.signIn');
    debug.log('Signing in user:', email);
    
    if (!supabase) {
      debug.error('Supabase not configured');
      debug.groupEnd();
      throw new Error('Supabase not configured');
    }
    
    try {
      // Create a promise that rejects after a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sign in request timed out after 180 seconds')), 180000);
      });
      
      // Race the actual request against the timeout
      const result = await Promise.race([
        supabase.auth.signInWithPassword({
          email,
          password
        }),
        timeoutPromise
      ]);
      
      const { data, error } = result;
      
      if (error) {
        debug.error('Sign in error:', error);
        debug.groupEnd();
        throw error;
      }
      
      debug.log('Sign in successful:', data.user?.id);
      debug.groupEnd();
      return data;
    } catch (error) {
      debug.error('Sign in error:', error);
      debug.groupEnd();
      throw error;
    }
  },

  // Sign out
  async signOut() {
    debug.group('authHelpers.signOut');
    
    if (!supabase) {
      debug.error('Supabase not configured');
      debug.groupEnd();
      throw new Error('Supabase not configured');
    }
    
    try {
      // Create a promise that rejects after a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sign out request timed out after 120 seconds')), 120000);
      });
      
      // Race the actual request against the timeout
      const result = await Promise.race([
        supabase.auth.signOut(),
        timeoutPromise
      ]);
      
      const { error } = result;
      
      if (error) {
        debug.error('Sign out error:', error);
        debug.groupEnd();
        throw error;
      }
      
      debug.log('Sign out successful');
      debug.groupEnd();
    } catch (error) {
      debug.error('Sign out error:', error);
      debug.groupEnd();
      throw error;
    }
  },

  // Get current session
  async getSession() {
    debug.group('authHelpers.getSession');
    
    if (!supabase) {
      debug.log('Supabase not configured, returning null session');
      debug.groupEnd();
      return null;
    }
    
    try {
      // Create a promise that rejects after a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Get session request timed out after 180 seconds')), 180000);
      });
      
      // Race the actual request against the timeout
      const result = await Promise.race([
        supabase.auth.getSession(),
        timeoutPromise
      ]);
      
      const { data: { session }, error } = result;
      
      if (error) {
        debug.error('Get session error:', error);
        debug.groupEnd();
        throw error;
      }
      
      debug.log('Got session:', session?.user?.id || 'No active session');
      debug.groupEnd();
      return session;
    } catch (error) {
      debug.error('Get session error:', error);
      debug.groupEnd();
      throw error;
    }
  },

  // Get current user
  async getUser() {
    debug.group('authHelpers.getUser');
    
    if (!supabase) {
      debug.log('Supabase not configured, returning null user');
      debug.groupEnd();
      return null;
    }
    
    try {
      // Create a promise that rejects after a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Get user request timed out after 180 seconds')), 180000);
      });
      
      // Race the actual request against the timeout
      const result = await Promise.race([
        supabase.auth.getUser(),
        timeoutPromise
      ]);
      
      const { data: { user }, error } = result;
      
      if (error) {
        debug.error('Get user error:', error);
        debug.groupEnd();
        throw error;
      }
      
      debug.log('Got user:', user?.id || 'No user found');
      debug.groupEnd();
      return user;
    } catch (error) {
      debug.error('Get user error:', error);
      debug.groupEnd();
      throw error;
    }
  },

  // Update user profile
  async updateProfile(updates) {
    debug.group('authHelpers.updateProfile');
    debug.log('Updating user profile');
    
    if (!supabase) {
      debug.error('Supabase not configured');
      debug.groupEnd();
      throw new Error('Supabase not configured');
    }
    
    try {
      // Create a promise that rejects after a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Update profile request timed out after 180 seconds')), 180000);
      });
      
      // Race the actual request against the timeout
      const result = await Promise.race([
        supabase.auth.updateUser({
          data: updates
        }),
        timeoutPromise
      ]);
      
      const { data, error } = result;
      
      if (error) {
        debug.error('Update profile error:', error);
        debug.groupEnd();
        throw error;
      }
      
      debug.log('Profile updated successfully');
      debug.groupEnd();
      return data;
    } catch (error) {
      debug.error('Update profile error:', error);
      debug.groupEnd();
      throw error;
    }
  },

  // Update password
  async updatePassword(newPassword) {
    debug.group('authHelpers.updatePassword');
    debug.log('Updating password');
    
    if (!supabase) {
      debug.error('Supabase not configured');
      debug.groupEnd();
      throw new Error('Supabase not configured');
    }
    
    try {
      // Create a promise that rejects after a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Update password request timed out after 180 seconds')), 180000);
      });
      
      // Race the actual request against the timeout
      const result = await Promise.race([
        supabase.auth.updateUser({
          password: newPassword
        }),
        timeoutPromise
      ]);
      
      const { data, error } = result;
      
      if (error) {
        debug.error('Update password error:', error);
        debug.groupEnd();
        throw error;
      }
      
      debug.log('Password updated successfully');
      debug.groupEnd();
      return data;
    } catch (error) {
      debug.error('Update password error:', error);
      debug.groupEnd();
      throw error;
    }
  },

  // Reset password
  async resetPassword(email) {
    debug.group('authHelpers.resetPassword');
    debug.log('Sending password reset email to:', email);
    
    if (!supabase) {
      debug.error('Supabase not configured');
      debug.groupEnd();
      throw new Error('Supabase not configured');
    }
    
    try {
      // Create a promise that rejects after a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Reset password request timed out after 180 seconds')), 180000);
      });
      
      // Race the actual request against the timeout
      const result = await Promise.race([
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`
        }),
        timeoutPromise
      ]);
      
      const { data, error } = result;
      
      if (error) {
        debug.error('Reset password error:', error);
        debug.groupEnd();
        throw error;
      }
      
      debug.log('Password reset email sent successfully');
      debug.groupEnd();
      return data;
    } catch (error) {
      debug.error('Reset password error:', error);
      debug.groupEnd();
      throw error;
    }
  },

  // Delete account
  async deleteAccount() {
    debug.group('authHelpers.deleteAccount');
    debug.log('Deleting user account');
    
    if (!supabase) {
      debug.error('Supabase not configured');
      debug.groupEnd();
      throw new Error('Supabase not configured');
    }
    
    try {
      // Create a promise that rejects after a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Delete account request timed out after 240 seconds')), 240000);
      });
      
      // Race the actual request against the timeout
      const result = await Promise.race([
        supabase.auth.admin.deleteUser(),
        timeoutPromise
      ]);
      
      const { error } = result;
      
      if (error) {
        debug.error('Delete account error:', error);
        debug.groupEnd();
        throw error;
      }
      
      debug.log('Account deleted successfully');
      debug.groupEnd();
    } catch (error) {
      debug.error('Delete account error:', error);
      debug.groupEnd();
      throw error;
    }
  }
};

// Database helper functions
export const dbHelpers = {
  // Save user's shower thought to database
  async saveThought(thought, userId) {
    debug.group('dbHelpers.saveThought');
    debug.log('Saving thought:', thought.id);
    
    if (!supabase) {
      debug.error('Supabase not configured');
      debug.groupEnd();
      throw new Error('Supabase not configured');
    }
    
    try {
      // Create a promise that rejects after a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Save thought request timed out after 240 seconds')), 240000);
      });
      
      // Race the actual request against the timeout
      const result = await Promise.race([
        supabase
          .from('shower_thoughts')
          .insert([{
            ...thought,
            user_id: userId,
            created_at: new Date().toISOString()
          }])
          .select()
          .single(),
        timeoutPromise
      ]);
      
      const { data, error } = result;
      
      if (error) {
        debug.error('Save thought error:', error);
        debug.groupEnd();
        throw error;
      }
      
      debug.log('Thought saved successfully to DB:', data.id);
      debug.groupEnd();
      return data;
    } catch (error) {
      debug.error('Save thought error:', error);
      debug.groupEnd();
      throw error;
    }
  },

  // Get user's shower thoughts
  async getUserThoughts(userId, limit = 50) {
    debug.group('dbHelpers.getUserThoughts');
    debug.log('Getting user thoughts:', userId);
    
    if (!supabase) {
      debug.error('Supabase not configured');
      debug.groupEnd();
      throw new Error('Supabase not configured');
    }
    
    try {
      // Create a promise that rejects after a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Get user thoughts request timed out after 240 seconds')), 240000);
      });
      
      // Race the actual request against the timeout
      const result = await Promise.race([
        supabase
          .from('shower_thoughts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit),
        timeoutPromise
      ]);
      
      const { data, error } = result;
      
      if (error) {
        debug.error('Get user thoughts error:', error);
        debug.groupEnd();
        throw error;
      }
      
      debug.log(`Got ${data?.length || 0} user thoughts`);
      debug.groupEnd();
      return data || [];
    } catch (error) {
      debug.error('Get user thoughts error:', error);
      debug.groupEnd();
      throw error;
    }
  },

  // Update user profile in database
  async updateUserProfile(userId, profileData) {
    debug.group('dbHelpers.updateUserProfile');
    debug.log('Updating user profile:', userId);
    
    if (!supabase) {
      debug.error('Supabase not configured');
      debug.groupEnd();
      throw new Error('Supabase not configured');
    }
    
    try {
      // Create a promise that rejects after a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Update user profile request timed out after 120 seconds')), 120000);
      });
      
      // Race the actual request against the timeout
      const result = await Promise.race([
        supabase
          .from('user_profiles')
          .upsert([{
            id: userId,
            ...profileData,
            updated_at: new Date().toISOString()
          }])
          .select()
          .single(),
        timeoutPromise
      ]);
      
      const { data, error } = result;
      
      if (error) {
        debug.error('Update user profile error:', error);
        debug.groupEnd();
        throw error;
      }
      
      debug.log('User profile updated successfully');
      debug.groupEnd();
      return data;
    } catch (error) {
      debug.error('Update user profile error:', error);
      debug.groupEnd();
      throw error;
    }
  },

  // Get user profile from database
  async getUserProfile(userId) {
    debug.group('dbHelpers.getUserProfile');
    debug.log('Getting user profile:', userId);
    
    if (!supabase) {
      debug.error('Supabase not configured');
      debug.groupEnd();
      throw new Error('Supabase not configured');
    }
    
    try {
      // Create a promise that rejects after a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Get user profile request timed out after 120 seconds')), 120000);
      });
      
      // Race the actual request against the timeout
      const result = await Promise.race([
        supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        timeoutPromise
      ]);
      
      const { data, error } = result;
      
      if (error && error.code !== 'PGRST116') {
        // Ignore "not found" errors
        debug.error('Get user profile error:', error);
        debug.groupEnd();
        throw error;
      }
      
      debug.log('Got user profile:', data?.id || 'Not found');
      debug.groupEnd();
      return data;
    } catch (error) {
      debug.error('Get user profile error:', error);
      debug.groupEnd();
      throw error;
    }
  },

  // Delete user profile and all related data
  async deleteUserData(userId) {
    debug.group('dbHelpers.deleteUserData');
    debug.log('Deleting user data:', userId);
    
    if (!supabase) {
      debug.error('Supabase not configured');
      debug.groupEnd();
      throw new Error('Supabase not configured');
    }
    
    try {
      // Create a promise that rejects after a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Delete user data request timed out after 120 seconds')), 120000);
      });
      
      // Delete in order due to foreign key constraints
      const operations = [
        supabase.from('user_favorites').delete().eq('user_id', userId),
        supabase.from('shower_thoughts').delete().eq('user_id', userId),
        supabase.from('user_profiles').delete().eq('id', userId)
      ];
      
      for (const operation of operations) {
        // Race each operation against the timeout
        const { error } = await Promise.race([
          operation,
          timeoutPromise
        ]);
        
        if (error) {
          debug.error('Delete user data error:', error);
          debug.groupEnd();
          throw error;
        }
      }
      
      debug.log('User data deleted successfully');
      debug.groupEnd();
    } catch (error) {
      debug.error('Delete user data error:', error);
      debug.groupEnd();
      throw error;
    }
  }
};

export default supabase;