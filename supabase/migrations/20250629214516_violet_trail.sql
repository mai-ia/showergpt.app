/*
  # Authentication and User Management Schema

  1. New Tables
    - `user_profiles`
      - `user_id` (uuid, references auth.users)
      - `display_name` (text)
      - `bio` (text)
      - `favorite_mood` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `shower_thoughts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `content` (text)
      - `topic` (text)
      - `mood` (text)
      - `source` (text)
      - `tokens_used` (integer)
      - `cost` (decimal)
      - `created_at` (timestamp)
    
    - `user_favorites`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `thought_id` (uuid, references shower_thoughts)
      - `content` (text)
      - `topic` (text)
      - `mood` (text)
      - `source` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Prevent unauthorized access to user data

  3. Indexes
    - Performance optimization for common queries
    - User-specific data access patterns
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  bio text,
  favorite_mood text DEFAULT 'philosophical' CHECK (favorite_mood IN ('philosophical', 'humorous', 'scientific')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create shower_thoughts table
CREATE TABLE IF NOT EXISTS shower_thoughts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  topic text,
  mood text NOT NULL CHECK (mood IN ('philosophical', 'humorous', 'scientific')),
  source text DEFAULT 'template' CHECK (source IN ('template', 'openai')),
  tokens_used integer DEFAULT 0,
  cost decimal(10,6) DEFAULT 0.0,
  created_at timestamptz DEFAULT now()
);

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  thought_id uuid,
  content text NOT NULL,
  topic text,
  mood text NOT NULL CHECK (mood IN ('philosophical', 'humorous', 'scientific')),
  source text DEFAULT 'template' CHECK (source IN ('template', 'openai')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, thought_id)
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shower_thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for shower_thoughts
CREATE POLICY "Users can read own thoughts"
  ON shower_thoughts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own thoughts"
  ON shower_thoughts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own thoughts"
  ON shower_thoughts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own thoughts"
  ON shower_thoughts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for user_favorites
CREATE POLICY "Users can read own favorites"
  ON user_favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON user_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON user_favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_shower_thoughts_user_id ON shower_thoughts(user_id);
CREATE INDEX IF NOT EXISTS idx_shower_thoughts_created_at ON shower_thoughts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_thought_id ON user_favorites(thought_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();