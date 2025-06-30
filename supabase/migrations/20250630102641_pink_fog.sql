/*
  # Fixed Comments Table Migration
  
  1. New Tables
    - Creates comments table if it doesn't exist
    - Adds foreign key constraints to thought_id, user_id, and parent_id
    - Creates indexes for better query performance
  
  2. Security
    - Enables RLS
    - Adds policies for viewing, inserting, updating, and deleting comments
    
  3. Triggers
    - Adds updated_at trigger
*/

-- First check if comments table exists, create it if it doesn't
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

-- Add foreign key constraints with proper error handling
DO $$ 
BEGIN
  -- Check if the foreign key constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'comments_thought_id_fkey'
  ) THEN
    ALTER TABLE comments
      ADD CONSTRAINT comments_thought_id_fkey
      FOREIGN KEY (thought_id) REFERENCES thoughts(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'comments_user_id_fkey'
  ) THEN
    ALTER TABLE comments
      ADD CONSTRAINT comments_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'comments_parent_id_fkey'
  ) THEN
    ALTER TABLE comments
      ADD CONSTRAINT comments_parent_id_fkey
      FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better performance if they don't already exist
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
  -- Use the correct way to query policies in PostgreSQL
  IF EXISTS (
    SELECT 1 FROM pg_policy p 
    JOIN pg_class c ON p.polrelid = c.oid 
    WHERE p.polname = 'Comments viewable by everyone' AND c.relname = 'comments'
  ) THEN
    DROP POLICY "Comments viewable by everyone" ON comments;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policy p 
    JOIN pg_class c ON p.polrelid = c.oid 
    WHERE p.polname = 'Users can insert own comments' AND c.relname = 'comments'
  ) THEN
    DROP POLICY "Users can insert own comments" ON comments;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policy p 
    JOIN pg_class c ON p.polrelid = c.oid 
    WHERE p.polname = 'Users can update own comments' AND c.relname = 'comments'
  ) THEN
    DROP POLICY "Users can update own comments" ON comments;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policy p 
    JOIN pg_class c ON p.polrelid = c.oid 
    WHERE p.polname = 'Users can delete own comments' AND c.relname = 'comments'
  ) THEN
    DROP POLICY "Users can delete own comments" ON comments;
  END IF;
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