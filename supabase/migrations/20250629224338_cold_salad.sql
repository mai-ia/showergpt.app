/*
  # Real-time Features Migration

  1. New Tables
    - `online_users` - Track user presence and activity
    - `notifications` - Real-time notification system  
    - `comments` - Comment system for thoughts
    - `live_sessions` - Collaborative thinking sessions

  2. Security
    - Enable RLS on all new tables
    - Add policies for secure access
    - Add real-time subscriptions

  3. Functions
    - User presence tracking
    - Notification creation
    - Interaction counting with real-time updates
*/

-- Enable real-time for existing tables
ALTER PUBLICATION supabase_realtime ADD TABLE thoughts;
ALTER PUBLICATION supabase_realtime ADD TABLE interactions;
ALTER PUBLICATION supabase_realtime ADD TABLE favorites;

-- Online users tracking
CREATE TABLE IF NOT EXISTS online_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  last_seen timestamptz DEFAULT now(),
  status text DEFAULT 'online' CHECK (status IN ('online', 'away', 'offline')),
  current_page text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE online_users ENABLE ROW LEVEL SECURITY;

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
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('like', 'comment', 'favorite', 'mention', 'follow')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

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
  parent_id uuid,
  likes_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraints after table creation
DO $$
BEGIN
  -- Add foreign key to thoughts table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'comments_thought_id_fkey'
  ) THEN
    ALTER TABLE comments ADD CONSTRAINT comments_thought_id_fkey 
    FOREIGN KEY (thought_id) REFERENCES thoughts(id) ON DELETE CASCADE;
  END IF;

  -- Add self-referencing foreign key for parent comments
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'comments_parent_id_fkey'
  ) THEN
    ALTER TABLE comments ADD CONSTRAINT comments_parent_id_fkey 
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

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

-- Live collaboration sessions
CREATE TABLE IF NOT EXISTS live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  host_user_id uuid NOT NULL,
  participants jsonb DEFAULT '[]',
  active boolean DEFAULT true,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;

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

-- Enable real-time for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE online_users;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE live_sessions;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_online_users_user_id ON online_users(user_id);
CREATE INDEX IF NOT EXISTS idx_online_users_status ON online_users(status);
CREATE INDEX IF NOT EXISTS idx_online_users_last_seen ON online_users(last_seen);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comments_thought_id ON comments(thought_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_live_sessions_host ON live_sessions(host_user_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_active ON live_sessions(active);

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_online_users_updated_at ON online_users;
CREATE TRIGGER update_online_users_updated_at
  BEFORE UPDATE ON online_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_live_sessions_updated_at ON live_sessions;
CREATE TRIGGER update_live_sessions_updated_at
  BEFORE UPDATE ON live_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
  page_location text DEFAULT null
)
RETURNS void AS $$
BEGIN
  INSERT INTO online_users (user_id, status, current_page, last_seen)
  VALUES (auth.uid(), presence_status, page_location, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    status = EXCLUDED.status,
    current_page = EXCLUDED.current_page,
    last_seen = EXCLUDED.last_seen,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment thought likes with real-time updates
CREATE OR REPLACE FUNCTION increment_thought_likes(thought_id bigint)
RETURNS integer AS $$
DECLARE
  new_count integer;
BEGIN
  -- First check if the thought exists
  IF NOT EXISTS (SELECT 1 FROM thoughts WHERE id = thought_id) THEN
    RETURN 0;
  END IF;

  -- Update the likes count
  UPDATE thoughts 
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = thought_id
  RETURNING likes_count INTO new_count;
  
  RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment thought views with real-time updates
CREATE OR REPLACE FUNCTION increment_thought_views(thought_id bigint)
RETURNS integer AS $$
DECLARE
  new_count integer;
BEGIN
  -- First check if the thought exists
  IF NOT EXISTS (SELECT 1 FROM thoughts WHERE id = thought_id) THEN
    RETURN 0;
  END IF;

  -- Update the views count
  UPDATE thoughts 
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = thought_id
  RETURNING views_count INTO new_count;
  
  RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle thought like (like/unlike)
CREATE OR REPLACE FUNCTION toggle_thought_like(
  thought_id bigint,
  user_id uuid
)
RETURNS integer AS $$
DECLARE
  new_count integer;
  interaction_exists boolean;
BEGIN
  -- Check if interaction already exists
  SELECT EXISTS(
    SELECT 1 FROM interactions 
    WHERE thought_id = toggle_thought_like.thought_id 
    AND user_id = toggle_thought_like.user_id 
    AND interaction_type = 'like'
  ) INTO interaction_exists;

  IF interaction_exists THEN
    -- Remove the like
    DELETE FROM interactions 
    WHERE thought_id = toggle_thought_like.thought_id 
    AND user_id = toggle_thought_like.user_id 
    AND interaction_type = 'like';
    
    -- Decrement count
    UPDATE thoughts 
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
    WHERE id = toggle_thought_like.thought_id
    RETURNING likes_count INTO new_count;
  ELSE
    -- Add the like
    INSERT INTO interactions (user_id, thought_id, interaction_type)
    VALUES (toggle_thought_like.user_id, toggle_thought_like.thought_id, 'like');
    
    -- Increment count
    UPDATE thoughts 
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = toggle_thought_like.thought_id
    RETURNING likes_count INTO new_count;
  END IF;
  
  RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add missing columns to thoughts table if they don't exist
DO $$
BEGIN
  -- Add likes_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'thoughts' AND column_name = 'likes_count'
  ) THEN
    ALTER TABLE thoughts ADD COLUMN likes_count integer DEFAULT 0;
  END IF;

  -- Add views_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'thoughts' AND column_name = 'views_count'
  ) THEN
    ALTER TABLE thoughts ADD COLUMN views_count integer DEFAULT 0;
  END IF;

  -- Add shares_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'thoughts' AND column_name = 'shares_count'
  ) THEN
    ALTER TABLE thoughts ADD COLUMN shares_count integer DEFAULT 0;
  END IF;
END $$;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_thoughts_likes_count ON thoughts(likes_count);
CREATE INDEX IF NOT EXISTS idx_thoughts_views_count ON thoughts(views_count);
CREATE INDEX IF NOT EXISTS idx_thoughts_shares_count ON thoughts(shares_count);