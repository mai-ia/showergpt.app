import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, authHelpers, isSupabaseConfigured } from '../lib/supabase';
import { getUserProfile, updateUserProfile } from '../lib/dbHelpers';
import { debug } from '../utils/debugHelpers';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateProfile: (updates: any) => Promise<any>;
  updatePassword: (newPassword: string) => Promise<any>;
  resetPassword: (email: string) => Promise<any>;
  deleteAccount: () => Promise<void>;
  userProfile: any;
  refreshProfile: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Load user profile from database with timeout
  const loadUserProfile = async (userId: string) => {
    try {
      debug.log(`Loading user profile for user: ${userId}`);
      
      // Create a promise that rejects after a timeout
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Profile loading timed out after 30 seconds')), 30000);
      });
      
      // Race the actual profile loading against the timeout
      const profile = await Promise.race([
        getUserProfile(userId),
        timeoutPromise
      ]);
      
      setUserProfile(profile);
      debug.log(`User profile loaded: ${profile ? 'success' : 'not found'}`);
      return profile;
    } catch (error) {
      debug.error('Error loading user profile:', error);
      // Don't throw the error, just return null to prevent blocking auth flow
      return null;
    }
  };

  // Refresh user profile
  const refreshProfile = async () => {
    if (user) {
      debug.log(`Refreshing profile for user: ${user.id}`);
      try {
        await loadUserProfile(user.id);
      } catch (error) {
        debug.error('Error refreshing profile:', error);
        // Don't throw, just log the error
      }
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      debug.warn('Supabase not configured, skipping auth initialization');
      setLoading(false);
      return;
    }

    debug.log('Initializing auth context');

    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        debug.log('Getting initial session');
        
        // Create a promise that rejects after a timeout
        const timeoutPromise = new Promise<{data: {session: null}}>((_,reject) => {
          setTimeout(() => {
            debug.warn('Session retrieval timed out after 30 seconds');
            reject(new Error('Session retrieval timed out'));
          }, 30000);
        });
        
        // Race the actual session retrieval against the timeout
        const { data: { session }, error } = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ]);
        
        if (error) {
          debug.error('Error getting session:', error);
        } else {
          debug.log(`Session found: ${session ? 'yes' : 'no'}`);
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            try {
              await loadUserProfile(session.user.id);
            } catch (profileError) {
              debug.error('Error loading user profile during initialization:', profileError);
              // Continue even if profile loading fails
            }
          }
        }
      } catch (error) {
        debug.error('Error in getInitialSession:', error);
        // Continue with null user/session
      } finally {
        // Ensure loading state is always set to false
        setLoading(false);
      }
    };

    // Set a timeout to ensure loading state is reset even if everything fails
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        debug.warn('Auth initialization timed out after 35 seconds, resetting loading state');
        setLoading(false);
      }
    }, 35000);

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        debug.log(`Auth state changed: ${event}, user: ${session?.user?.email || 'none'}`);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            await loadUserProfile(session.user.id);
          } catch (error) {
            debug.error('Error loading user profile during auth state change:', error);
          }
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      debug.log('Cleaning up auth subscription');
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, userData = {}) => {
    debug.log(`Signing up user: ${email}`);
    try {
      const result = await authHelpers.signUp(email, password, userData);
      
      // Create user profile in database
      if (result.user) {
        try {
          debug.log(`Creating profile for new user: ${result.user.id}`);
          await updateUserProfile(result.user.id, {
            email: result.user.email,
            display_name: userData.display_name || email.split('@')[0],
            ...userData
          });
          debug.log('User profile created successfully');
        } catch (profileError) {
          debug.error('Error creating user profile:', profileError);
          // Don't throw here - user is created, profile creation can be retried
        }
      }
      
      return result;
    } catch (error) {
      debug.error('Sign up error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    debug.log(`Signing in user: ${email}`);
    try {
      return await authHelpers.signIn(email, password);
    } catch (error) {
      debug.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    debug.log('Signing out user');
    try {
      await authHelpers.signOut();
    } catch (error) {
      debug.error('Sign out error:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: any) => {
    debug.log('Updating user profile');
    try {
      // Update auth profile
      const result = await authHelpers.updateProfile(updates);
      
      // Update database profile
      if (user) {
        debug.log(`Updating database profile for user: ${user.id}`);
        await updateUserProfile(user.id, updates);
        await refreshProfile();
      }
      
      return result;
    } catch (error) {
      debug.error('Update profile error:', error);
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    debug.log('Updating user password');
    try {
      return await authHelpers.updatePassword(newPassword);
    } catch (error) {
      debug.error('Update password error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    debug.log(`Sending password reset email to: ${email}`);
    try {
      return await authHelpers.resetPassword(email);
    } catch (error) {
      debug.error('Reset password error:', error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    debug.log('Deleting user account');
    try {
      if (!user) {
        debug.error('No user logged in');
        throw new Error('No user logged in');
      }
      
      // Delete user account (this will cascade delete all related data due to foreign key constraints)
      await authHelpers.deleteAccount();
      
      // Clear local state
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
      debug.log('Account deleted successfully');
    } catch (error) {
      debug.error('Delete account error:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    updatePassword,
    resetPassword,
    deleteAccount,
    userProfile,
    refreshProfile,
    isConfigured: isSupabaseConfigured()
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};