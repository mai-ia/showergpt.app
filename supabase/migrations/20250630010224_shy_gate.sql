/*
  # Fix Thought Card Functionality

  1. Add missing RPC functions
    - Ensure all required functions for thought interactions exist
    - Fix permissions for these functions
  
  2. Fix Database Schema
    - Ensure shower_thoughts table has all required columns
    - Add proper indexes for performance
    - Fix foreign key constraints
  
  3. Update RLS Policies
    - Ensure proper access control for all tables
*/

-- First, ensure the shower_thoughts table has all required columns
DO $$ 
BEGIN
  -- Add views_count if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shower_thoughts' AND column_name = 'views_count') THEN
    ALTER TABLE shower_thoughts ADD COLUMN views_count integer DEFAULT 0;
  END IF;
  
  -- Add likes_count if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shower_thoughts' AND column_name = 'likes_count') THEN
    ALTER TABLE shower_thoughts ADD COLUMN likes_count integer DEFAULT 0;
  END IF;
  
  -- Add shares_count if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shower_thoughts' AND column_name = 'shares_count') THEN
    ALTER TABLE shower_thoughts ADD COLUMN shares_count integer DEFAULT 0;
  END IF;
  
  -- Add category if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shower_thoughts' AND column_name = 'category') THEN
    ALTER TABLE shower_thoughts ADD COLUMN category text;
  END IF;
  
  -- Add tags if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shower_thoughts' AND column_name = 'tags') THEN
    ALTER TABLE shower_thoughts ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
END $$;

-- Create or replace function to increment thought views
CREATE OR REPLACE FUNCTION increment_thought_views(thought_id uuid)
RETURNS integer AS $$
DECLARE
  new_count integer;
BEGIN
  -- Update the views count in shower_thoughts
  UPDATE shower_thoughts 
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = thought_id
  RETURNING views_count INTO new_count;
  
  RETURN COALESCE(new_count, 0);
EXCEPTION
  WHEN OTHERS THEN
    -- If there's an error, just return 1
    RETURN 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace function to toggle thought likes
CREATE OR REPLACE FUNCTION toggle_thought_like(thought_id uuid, user_id uuid)
RETURNS integer AS $$
DECLARE
  new_count integer;
  interaction_exists boolean;
BEGIN
  -- Check if user has already liked this thought
  SELECT EXISTS(
    SELECT 1 FROM interactions 
    WHERE interactions.user_id = toggle_thought_like.user_id 
    AND interactions.thought_id = toggle_thought_like.thought_id 
    AND interaction_type = 'like'
  ) INTO interaction_exists;
  
  IF interaction_exists THEN
    -- Remove like
    DELETE FROM interactions 
    WHERE interactions.user_id = toggle_thought_like.user_id 
    AND interactions.thought_id = toggle_thought_like.thought_id 
    AND interaction_type = 'like';
    
    -- Decrement likes count
    UPDATE shower_thoughts 
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
    WHERE id = thought_id
    RETURNING likes_count INTO new_count;
  ELSE
    -- Add like
    INSERT INTO interactions (user_id, thought_id, interaction_type)
    VALUES (user_id, thought_id, 'like')
    ON CONFLICT (user_id, thought_id, interaction_type) DO NOTHING;
    
    -- Increment likes count
    UPDATE shower_thoughts 
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = thought_id
    RETURNING likes_count INTO new_count;
  END IF;
  
  RETURN COALESCE(new_count, 0);
EXCEPTION
  WHEN OTHERS THEN
    -- If there's an error, just return 0
    RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace function to increment shares
CREATE OR REPLACE FUNCTION increment_thought_shares(thought_id uuid)
RETURNS integer AS $$
DECLARE
  new_count integer;
BEGIN
  -- Update the shares count in shower_thoughts
  UPDATE shower_thoughts 
  SET shares_count = COALESCE(shares_count, 0) + 1
  WHERE id = thought_id
  RETURNING shares_count INTO new_count;
  
  RETURN COALESCE(new_count, 0);
EXCEPTION
  WHEN OTHERS THEN
    -- If there's an error, just return 1
    RETURN 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create interactions table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interactions') THEN
    CREATE TABLE interactions (
      id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
      thought_id uuid REFERENCES shower_thoughts(id) ON DELETE CASCADE,
      interaction_type text NOT NULL CHECK (interaction_type IN ('like', 'view', 'share')),
      created_at timestamptz DEFAULT now(),
      UNIQUE(user_id, thought_id, interaction_type)
    );
    
    -- Enable RLS on interactions table
    ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
    
    -- Create policies for interactions
    CREATE POLICY "Users can manage own interactions" ON interactions
      FOR ALL TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can view public interactions" ON interactions
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

-- Add indexes for performance
DO $$ 
BEGIN
  -- Add indexes for shower_thoughts
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_shower_thoughts_views_count') THEN
    CREATE INDEX idx_shower_thoughts_views_count ON shower_thoughts(views_count DESC);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_shower_thoughts_likes_count') THEN
    CREATE INDEX idx_shower_thoughts_likes_count ON shower_thoughts(likes_count DESC);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_shower_thoughts_shares_count') THEN
    CREATE INDEX idx_shower_thoughts_shares_count ON shower_thoughts(shares_count DESC);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_shower_thoughts_category') THEN
    CREATE INDEX idx_shower_thoughts_category ON shower_thoughts(category);
  END IF;
  
  -- Add indexes for interactions if the table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interactions') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_interactions_user_id') THEN
      CREATE INDEX idx_interactions_user_id ON interactions(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_interactions_thought_id') THEN
      CREATE INDEX idx_interactions_thought_id ON interactions(thought_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_interactions_type') THEN
      CREATE INDEX idx_interactions_type ON interactions(interaction_type);
    END IF;
  END IF;
END $$;

-- Grant necessary permissions
DO $$ 
BEGIN
  -- Grant execute permissions on functions
  GRANT EXECUTE ON FUNCTION increment_thought_views(uuid) TO authenticated;
  GRANT EXECUTE ON FUNCTION toggle_thought_like(uuid, uuid) TO authenticated;
  GRANT EXECUTE ON FUNCTION increment_thought_shares(uuid) TO authenticated;
  
  -- Grant permissions on interactions table if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interactions') THEN
    GRANT ALL ON interactions TO authenticated;
  END IF;
END $$;

-- Update existing shower_thoughts to have proper default values
UPDATE shower_thoughts 
SET 
  views_count = COALESCE(views_count, 0),
  likes_count = COALESCE(likes_count, 0),
  shares_count = COALESCE(shares_count, 0),
  tags = COALESCE(tags, '{}')
WHERE views_count IS NULL 
   OR likes_count IS NULL 
   OR shares_count IS NULL 
   OR tags IS NULL;