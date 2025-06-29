import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate Supabase configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase configuration missing. Authentication features will be disabled.');
}

// Create Supabase client
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabase !== null;
};

// Auth helper functions
export const authHelpers = {
  // Sign up with email and password
  async signUp(email, password, userData = {}) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    
    if (error) throw error;
    return data;
  },

  // Sign in with email and password
  async signIn(email, password) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  },

  // Sign out
  async signOut() {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current session
  async getSession() {
    if (!supabase) return null;
    
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Get current user
  async getUser() {
    if (!supabase) return null;
    
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Update user profile
  async updateProfile(updates) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    });
    
    if (error) throw error;
    return data;
  },

  // Update password
  async updatePassword(newPassword) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    return data;
  },

  // Reset password
  async resetPassword(email) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    
    if (error) throw error;
    return data;
  },

  // Delete account
  async deleteAccount() {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { error } = await supabase.auth.admin.deleteUser();
    if (error) throw error;
  }
};

// Database helper functions
export const dbHelpers = {
  // Save user's shower thought to database
  async saveThought(thought, userId) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('shower_thoughts')
      .insert([{
        ...thought,
        user_id: userId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get user's shower thoughts
  async getUserThoughts(userId, limit = 50) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('shower_thoughts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },

  // Update user profile in database
  async updateUserProfile(userId, profileData) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert([{
        user_id: userId,
        ...profileData,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get user profile from database
  async getUserProfile(userId) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" errors
    return data;
  },

  // Delete user profile and all related data
  async deleteUserData(userId) {
    if (!supabase) throw new Error('Supabase not configured');
    
    // Delete in order due to foreign key constraints
    const operations = [
      supabase.from('user_favorites').delete().eq('user_id', userId),
      supabase.from('shower_thoughts').delete().eq('user_id', userId),
      supabase.from('user_profiles').delete().eq('user_id', userId)
    ];
    
    for (const operation of operations) {
      const { error } = await operation;
      if (error) throw error;
    }
  }
};

export default supabase;