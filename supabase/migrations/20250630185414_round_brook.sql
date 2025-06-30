/*
  # Fix Policy Conflicts in Real-time Features Migration

  1. Changes
    - Add DROP POLICY IF EXISTS statements before creating policies
    - Add UNIQUE constraint to online_users table
    - Fix policy creation with proper error handling
    - Ensure all tables have proper constraints and indexes
  
  2. Security
    - Maintain all security policies with proper checks
    - Ensure RLS is enabled on all tables
*/

-- Add UNIQUE constraint to online_users if it doesn't exist
DO $$ 
BEGIN
  -- Check if the unique constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'online_users_user_id_key' 
    AND conrelid = 'online_users'::regclass
  ) THEN
    -- Add unique constraint to prevent conflicts
    ALTER TABLE online_users ADD CONSTRAINT online_users_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Drop existing policies before recreating them
DO $$ 
BEGIN
  -- Drop policies for online_users
  DROP POLICY IF EXISTS "Users can view online status" ON online_users;
  DROP POLICY IF EXISTS "Users can update own presence" ON online_users;
  
  -- Drop policies for notifications
  DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
  
  -- Drop policies for comments
  DROP POLICY IF EXISTS "Comments viewable by everyone" ON comments;
  DROP POLICY IF EXISTS "Users can insert own comments" ON comments;
  DROP POLICY IF EXISTS "Users can update own comments" ON comments;
  DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
  
  -- Drop policies for live_sessions
  DROP POLICY IF EXISTS "Live sessions viewable by participants" ON live_sessions;
  DROP POLICY IF EXISTS "Host can manage sessions" ON live_sessions;
END $$;

-- Recreate policies for online_users
CREATE POLICY "Users can view online status"
  ON online_users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update own presence"
  ON online_users
  FOR ALL
  TO public
  USING (auth.uid() = user_id);

-- Recreate policies for notifications
CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id);

-- Recreate policies for comments
CREATE POLICY "Comments viewable by everyone"
  ON comments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert own comments"
  ON comments
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments
  FOR DELETE
  TO public
  USING (auth.uid() = user_id);

-- Recreate policies for live_sessions
CREATE POLICY "Live sessions viewable by participants"
  ON live_sessions
  FOR SELECT
  TO public
  USING (
    auth.uid() = host_user_id OR 
    auth.uid()::text = ANY(SELECT jsonb_array_elements_text(participants))
  );

CREATE POLICY "Host can manage sessions"
  ON live_sessions
  FOR ALL
  TO public
  USING (auth.uid() = host_user_id);

-- Update the user_presence function to include display_name
CREATE OR REPLACE FUNCTION update_user_presence(
  presence_status text DEFAULT 'online',
  page_location text DEFAULT null,
  user_display_name text DEFAULT null
)
RETURNS void AS $$
BEGIN
  INSERT INTO online_users (user_id, status, current_page, last_seen, display_name)
  VALUES (auth.uid(), presence_status, page_location, now(), user_display_name)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    status = EXCLUDED.status,
    current_page = EXCLUDED.current_page,
    last_seen = EXCLUDED.last_seen,
    display_name = COALESCE(EXCLUDED.display_name, online_users.display_name),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the updated function
GRANT EXECUTE ON FUNCTION update_user_presence(text, text, text) TO authenticated;

-- Add display_name column to online_users if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'online_users' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE online_users ADD COLUMN display_name text;
  END IF;
END $$;

-- Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_sessions_host_user_id ON live_sessions(host_user_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_active ON live_sessions(active);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_online_users_last_seen ON online_users(last_seen DESC);