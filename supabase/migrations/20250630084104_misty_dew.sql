/*
  # Add Comments Table

  1. New Tables
    - `comments`
      - `id` (uuid, primary key)
      - `thought_id` (bigint, references thoughts.id)
      - `user_id` (uuid, references users.id)
      - `content` (text)
      - `parent_id` (uuid, references comments.id)
      - `likes_count` (integer, default 0)
      - `created_at` (timestamp with time zone, default now())
      - `updated_at` (timestamp with time zone, default now())

  2. Security
    - Enable RLS on `comments` table
    - Add policies for public viewing of comments
    - Add policies for authenticated users to manage their own comments

  3. Triggers
    - Add trigger to update the updated_at column
*/

-- Create comments table
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

-- Add foreign key constraints
ALTER TABLE comments
  ADD CONSTRAINT comments_thought_id_fkey
  FOREIGN KEY (thought_id) REFERENCES thoughts(id) ON DELETE CASCADE;

ALTER TABLE comments
  ADD CONSTRAINT comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE comments
  ADD CONSTRAINT comments_parent_id_fkey
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comments_thought_id ON comments(thought_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

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
  WITH CHECK (uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments" 
  ON comments FOR UPDATE 
  TO public
  USING (uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" 
  ON comments FOR DELETE 
  TO public
  USING (uid() = user_id);

-- Create trigger for updating the updated_at column
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();