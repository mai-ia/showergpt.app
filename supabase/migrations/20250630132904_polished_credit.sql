/*
  # Realtime and Comments System Fix

  1. New Tables
     - `online_users`: Tracks online user presence and status
     - `notifications`: Stores user notifications
     - `comments`: Comment system for thoughts
     - `live_sessions`: Real-time collaboration sessions

  2. Security
     - Enable RLS on all tables
     - Add appropriate policies with existence checks
     - Create indexes for better performance

  3. Functions
     - Create utility functions for presence, notifications, and interactions
*/

-- Enable real-time for existing tables (with error handling)
DO $$ 
BEGIN
  -- Only add tables to publication if they're not already members
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'thoughts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE thoughts;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'interactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE interactions;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'favorites'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE favorites;
  END IF;
END $$;

-- Online users tracking
CREATE TABLE IF NOT EXISTS online_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen timestamptz DEFAULT now(),
  status text DEFAULT 'online' CHECK (status IN ('online', 'away', 'offline')),
  current_page text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  display_name text
);

ALTER TABLE online_users ENABLE ROW LEVEL SECURITY;

-- Drop policies first if they exist to avoid the "already exists" error
DO $$ 
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can view online status" ON online_users;
  DROP POLICY IF EXISTS "Users can update own presence" ON online_users;
END $$;

-- Create policies with safe names
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

-- Notifications system
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('like', 'comment', 'favorite', 'mention', 'follow')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
END $$;

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

-- Comments system
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thought_id bigint NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  likes_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign keys for comments with error handling
DO $$ 
BEGIN
  -- Add foreign key constraint if it doesn't exist already
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'comments_thought_id_fkey' 
    AND conrelid = 'public.comments'::regclass
  ) THEN
    ALTER TABLE comments 
    ADD CONSTRAINT comments_thought_id_fkey 
    FOREIGN KEY (thought_id) REFERENCES thoughts(id) ON DELETE CASCADE;
  END IF;

  -- Add foreign key constraint if it doesn't exist already
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'comments_user_id_fkey' 
    AND conrelid = 'public.comments'::regclass
  ) THEN
    ALTER TABLE comments 
    ADD CONSTRAINT comments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Comments viewable by everyone" ON comments;
  DROP POLICY IF EXISTS "Users can insert own comments" ON comments;
  DROP POLICY IF EXISTS "Users can update own comments" ON comments;
  DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
END $$;

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
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments
  FOR DELETE
  TO public
  USING (auth.uid() = user_id);

-- Live collaboration sessions
CREATE TABLE IF NOT EXISTS live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  host_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  participants jsonb DEFAULT '[]',
  active boolean DEFAULT true,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Live sessions viewable by participants" ON live_sessions;
  DROP POLICY IF EXISTS "Host can manage sessions" ON live_sessions;
END $$;

CREATE POLICY "Live sessions viewable by participants"
  ON live_sessions
  FOR SELECT
  TO public
  USING (
    auth.uid() = host_user_id OR 
    participants @> to_jsonb(auth.uid())
  );

CREATE POLICY "Host can manage sessions"
  ON live_sessions
  FOR ALL
  TO public
  USING (auth.uid() = host_user_id);

-- Enable real-time for new tables (with error handling)
DO $$ 
BEGIN
  -- Only add tables to publication if they're not already members
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'online_users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE online_users;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE comments;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'live_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE live_sessions;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_online_users_user_id ON online_users(user_id);
CREATE INDEX IF NOT EXISTS idx_online_users_status ON online_users(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_comments_thought_id ON comments(thought_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_sessions_host_user_id ON live_sessions(host_user_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_active ON live_sessions(active);

-- Functions for real-time updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at (with existence check)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_online_users_updated_at'
  ) THEN
    CREATE TRIGGER update_online_users_updated_at
      BEFORE UPDATE ON online_users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_comments_updated_at'
  ) THEN
    CREATE TRIGGER update_comments_updated_at
      BEFORE UPDATE ON comments
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_live_sessions_updated_at'
  ) THEN
    CREATE TRIGGER update_live_sessions_updated_at
      BEFORE UPDATE ON live_sessions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  target_user_id uuid,
  notification_type text,
  notification_title text,
  notification_message text,
  notification_data jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (target_user_id, notification_type, notification_title, notification_message, notification_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user presence
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

-- Function to increment interaction counts with real-time updates
CREATE OR REPLACE FUNCTION increment_shower_thought_likes(thought_id bigint)
RETURNS integer AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE thoughts 
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = thought_id
  RETURNING likes_count INTO new_count;
  
  RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_shower_thought_views(thought_id bigint)
RETURNS integer AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE thoughts 
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = thought_id
  RETURNING views_count INTO new_count;
  
  RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_shower_thought_shares(thought_id bigint)
RETURNS integer AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE thoughts 
  SET shares_count = COALESCE(shares_count, 0) + 1
  WHERE id = thought_id
  RETURNING shares_count INTO new_count;
  
  RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle thought like with interaction tracking
CREATE OR REPLACE FUNCTION toggle_shower_thought_like(
  thought_id bigint,
  user_id uuid
)
RETURNS integer AS $$
DECLARE
  interaction_exists boolean;
  new_count integer;
BEGIN
  -- Check if interaction already exists
  SELECT EXISTS (
    SELECT 1 FROM interactions
    WHERE thought_id = toggle_shower_thought_like.thought_id
    AND user_id = toggle_shower_thought_like.user_id
    AND interaction_type = 'like'
  ) INTO interaction_exists;
  
  IF interaction_exists THEN
    -- Remove the like
    DELETE FROM interactions
    WHERE thought_id = toggle_shower_thought_like.thought_id
    AND user_id = toggle_shower_thought_like.user_id
    AND interaction_type = 'like';
    
    -- Decrement like count
    UPDATE thoughts
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
    WHERE id = toggle_shower_thought_like.thought_id
    RETURNING likes_count INTO new_count;
  ELSE
    -- Add the like
    INSERT INTO interactions (user_id, thought_id, interaction_type)
    VALUES (toggle_shower_thought_like.user_id, toggle_shower_thought_like.thought_id, 'like');
    
    -- Increment like count
    UPDATE thoughts
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = toggle_shower_thought_like.thought_id
    RETURNING likes_count INTO new_count;
  END IF;
  
  RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;