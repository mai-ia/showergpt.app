/*
  # Fix Authentication References

  1. Schema Updates
    - Update all foreign key references to use auth.users instead of users table
    - Fix user_profiles table structure
    - Update other tables with proper auth references

  2. Security
    - Ensure all RLS policies work with auth.uid()
    - Update foreign key constraints properly
*/

-- First, let's check and fix the user_profiles table structure
DO $$ 
BEGIN
  -- Drop existing foreign key constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_profiles_user_id_fkey' 
    AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_user_id_fkey;
  END IF;
  
  -- Rename user_id column to id if it exists and id doesn't exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'id'
  ) THEN
    ALTER TABLE user_profiles RENAME COLUMN user_id TO id;
  END IF;
  
  -- Drop existing primary key if it's on user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_profiles_pkey' 
    AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_pkey;
  END IF;
  
  -- Add primary key on id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_profiles_pkey' 
    AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);
  END IF;
  
  -- Add foreign key reference to auth.users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_profiles_id_fkey' 
    AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Fix shower_thoughts table foreign key
DO $$ 
BEGIN
  -- Drop existing foreign key if it references wrong table
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'shower_thoughts_user_id_fkey' 
    AND table_name = 'shower_thoughts'
  ) THEN
    ALTER TABLE shower_thoughts DROP CONSTRAINT shower_thoughts_user_id_fkey;
  END IF;
  
  -- Add correct foreign key reference to auth.users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'shower_thoughts_user_id_fkey' 
    AND table_name = 'shower_thoughts'
  ) THEN
    ALTER TABLE shower_thoughts ADD CONSTRAINT shower_thoughts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Fix user_favorites table foreign key
DO $$ 
BEGIN
  -- Drop existing foreign key if it references wrong table
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_favorites_user_id_fkey' 
    AND table_name = 'user_favorites'
  ) THEN
    ALTER TABLE user_favorites DROP CONSTRAINT user_favorites_user_id_fkey;
  END IF;
  
  -- Add correct foreign key reference to auth.users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_favorites_user_id_fkey' 
    AND table_name = 'user_favorites'
  ) THEN
    ALTER TABLE user_favorites ADD CONSTRAINT user_favorites_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Fix interactions table foreign key (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interactions') THEN
    -- Drop existing foreign key if it references wrong table
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'interactions_user_id_fkey' 
      AND table_name = 'interactions'
    ) THEN
      ALTER TABLE interactions DROP CONSTRAINT interactions_user_id_fkey;
    END IF;
    
    -- Add correct foreign key reference to auth.users
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'interactions_user_id_fkey' 
      AND table_name = 'interactions'
    ) THEN
      ALTER TABLE interactions ADD CONSTRAINT interactions_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Fix comments table foreign key (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') THEN
    -- Drop existing foreign key if it references wrong table
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'comments_user_id_fkey' 
      AND table_name = 'comments'
    ) THEN
      ALTER TABLE comments DROP CONSTRAINT comments_user_id_fkey;
    END IF;
    
    -- Add correct foreign key reference to auth.users
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'comments_user_id_fkey' 
      AND table_name = 'comments'
    ) THEN
      ALTER TABLE comments ADD CONSTRAINT comments_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Fix notifications table foreign key (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    -- Drop existing foreign key if it references wrong table
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'notifications_user_id_fkey' 
      AND table_name = 'notifications'
    ) THEN
      ALTER TABLE notifications DROP CONSTRAINT notifications_user_id_fkey;
    END IF;
    
    -- Add correct foreign key reference to auth.users
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'notifications_user_id_fkey' 
      AND table_name = 'notifications'
    ) THEN
      ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Fix online_users table foreign key (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'online_users') THEN
    -- Drop existing foreign key if it references wrong table
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'online_users_user_id_fkey' 
      AND table_name = 'online_users'
    ) THEN
      ALTER TABLE online_users DROP CONSTRAINT online_users_user_id_fkey;
    END IF;
    
    -- Add correct foreign key reference to auth.users
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'online_users_user_id_fkey' 
      AND table_name = 'online_users'
    ) THEN
      ALTER TABLE online_users ADD CONSTRAINT online_users_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Fix live_sessions table foreign key (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'live_sessions') THEN
    -- Drop existing foreign key if it references wrong table
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'live_sessions_host_user_id_fkey' 
      AND table_name = 'live_sessions'
    ) THEN
      ALTER TABLE live_sessions DROP CONSTRAINT live_sessions_host_user_id_fkey;
    END IF;
    
    -- Add correct foreign key reference to auth.users
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'live_sessions_host_user_id_fkey' 
      AND table_name = 'live_sessions'
    ) THEN
      ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_host_user_id_fkey 
      FOREIGN KEY (host_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Fix favorites table foreign key (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'favorites') THEN
    -- Drop existing foreign key if it references wrong table
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'favorites_user_id_fkey' 
      AND table_name = 'favorites'
    ) THEN
      ALTER TABLE favorites DROP CONSTRAINT favorites_user_id_fkey;
    END IF;
    
    -- Add correct foreign key reference to auth.users
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'favorites_user_id_fkey' 
      AND table_name = 'favorites'
    ) THEN
      ALTER TABLE favorites ADD CONSTRAINT favorites_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Fix profiles table foreign key (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    -- Drop existing foreign key if it references wrong table
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'profiles_id_fkey' 
      AND table_name = 'profiles'
    ) THEN
      ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
    END IF;
    
    -- Add correct foreign key reference to auth.users
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'profiles_id_fkey' 
      AND table_name = 'profiles'
    ) THEN
      ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey 
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Update RLS policies to ensure they work correctly with auth.uid()
DO $$ 
BEGIN
  -- Update user_profiles policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    -- Drop and recreate policies for user_profiles
    DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
    
    CREATE POLICY "Users can insert own profile" ON user_profiles
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = id);
      
    CREATE POLICY "Users can read own profile" ON user_profiles
      FOR SELECT TO authenticated
      USING (auth.uid() = id);
      
    CREATE POLICY "Users can update own profile" ON user_profiles
      FOR UPDATE TO authenticated
      USING (auth.uid() = id);
  END IF;
  
  -- Update shower_thoughts policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shower_thoughts') THEN
    -- Drop and recreate policies for shower_thoughts
    DROP POLICY IF EXISTS "Users can insert own thoughts" ON shower_thoughts;
    DROP POLICY IF EXISTS "Users can read own thoughts" ON shower_thoughts;
    DROP POLICY IF EXISTS "Users can update own thoughts" ON shower_thoughts;
    DROP POLICY IF EXISTS "Users can delete own thoughts" ON shower_thoughts;
    
    CREATE POLICY "Users can insert own thoughts" ON shower_thoughts
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY "Users can read own thoughts" ON shower_thoughts
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can update own thoughts" ON shower_thoughts
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can delete own thoughts" ON shower_thoughts
      FOR DELETE TO authenticated
      USING (auth.uid() = user_id);
  END IF;
  
  -- Update user_favorites policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_favorites') THEN
    -- Drop and recreate policies for user_favorites
    DROP POLICY IF EXISTS "Users can insert own favorites" ON user_favorites;
    DROP POLICY IF EXISTS "Users can read own favorites" ON user_favorites;
    DROP POLICY IF EXISTS "Users can delete own favorites" ON user_favorites;
    
    CREATE POLICY "Users can insert own favorites" ON user_favorites
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY "Users can read own favorites" ON user_favorites
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can delete own favorites" ON user_favorites
      FOR DELETE TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create a function to safely get user profile with proper auth reference
CREATE OR REPLACE FUNCTION get_user_profile(target_user_id uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  display_name text,
  bio text,
  favorite_mood text,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
DECLARE
  lookup_user_id uuid;
BEGIN
  -- Use provided user_id or current authenticated user
  lookup_user_id := COALESCE(target_user_id, auth.uid());
  
  -- Return user profile if it exists
  RETURN QUERY
  SELECT 
    up.id,
    up.display_name,
    up.bio,
    up.favorite_mood,
    up.created_at,
    up.updated_at
  FROM user_profiles up
  WHERE up.id = lookup_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION get_user_profile(uuid) TO authenticated;