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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
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
      const { error } = await supabase.auth.signOut();
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
      const { data: { session }, error } = await supabase.auth.getSession();
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
      const { data: { user }, error } = await supabase.auth.getUser();
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
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      });
      
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
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
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
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
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
      const { error } = await supabase.auth.admin.deleteUser();
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
      const { data, error } = await supabase
        .from('shower_thoughts')
        .insert([{
          ...thought,
          user_id: userId,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) {
        debug.error('Save thought error:', error);
        debug.groupEnd();
        throw error;
      }
      
      debug.log('Thought saved successfully:', data.id);
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
      const { data, error } = await supabase
        .from('shower_thoughts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
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
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert([{
          id: userId,
          ...profileData,
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
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
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
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
      // Delete in order due to foreign key constraints
      const operations = [
        supabase.from('user_favorites').delete().eq('user_id', userId),
        supabase.from('shower_thoughts').delete().eq('user_id', userId),
        supabase.from('user_profiles').delete().eq('id', userId)
      ];
      
      for (const operation of operations) {
        const { error } = await operation;
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