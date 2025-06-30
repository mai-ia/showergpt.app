/*
  # Fix Comments Table Migration
  
  1. New Tables
    - Creates comments table if it doesn't exist
  
  2. Foreign Keys
    - Checks if constraints already exist before adding them
    - Uses IF NOT EXISTS checks for all operations
    
  3. Security
    - Enables RLS with proper checks
    - Creates policies with proper error handling
    
  4. Indexes & Triggers
    - Creates indexes with IF NOT EXISTS
    - Creates trigger with existence check
*/

-- Create comments table if it doesn't exist
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

-- Add foreign key constraints with existence checks
DO $$ 
BEGIN
  -- Add thought_id foreign key if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'comments_thought_id_fkey'
  ) THEN
    ALTER TABLE comments
      ADD CONSTRAINT comments_thought_id_fkey
      FOREIGN KEY (thought_id) REFERENCES thoughts(id) ON DELETE CASCADE;
  END IF;

  -- Add user_id foreign key if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'comments_user_id_fkey'
  ) THEN
    ALTER TABLE comments
      ADD CONSTRAINT comments_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add parent_id foreign key if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'comments_parent_id_fkey'
  ) THEN
    ALTER TABLE comments
      ADD CONSTRAINT comments_parent_id_fkey
      FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comments_thought_id ON comments(thought_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Drop policies if they already exist to avoid duplication errors
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Comments viewable by everyone" ON comments;
  DROP POLICY IF EXISTS "Users can insert own comments" ON comments;
  DROP POLICY IF EXISTS "Users can update own comments" ON comments;
  DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
END $$;

-- Create RLS policies
-- Everyone can view comments
CREATE POLICY "Comments viewable by everyone" 
  ON comments FOR SELECT 
  TO public
  USING (true);

-- Users can insert their own comments
CREATE POLICY "Users can insert own comments" 
  ON comments FOR INSERT 
  TO public
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments" 
  ON comments FOR UPDATE 
  TO public
  USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" 
  ON comments FOR DELETE 
  TO public
  USING (auth.uid() = user_id);

-- Create trigger for updating the updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_comments_updated_at'
  ) THEN
    CREATE TRIGGER update_comments_updated_at
      BEFORE UPDATE ON comments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;