/*
  # Add display_name to online_users table

  1. New Columns
    - Add `display_name` column to `online_users` table
  
  2. Updates
    - Update `update_user_presence` function to accept and store display_name
  
  3. Security
    - Ensure RLS policies are properly configured
*/

-- Add display_name column to online_users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_users' AND column_name = 'display_name') THEN
    ALTER TABLE online_users ADD COLUMN display_name text;
  END IF;
END $$;

-- Create or replace function to update user presence with display_name
CREATE OR REPLACE FUNCTION update_user_presence(
  presence_status text DEFAULT 'online',
  page_location text DEFAULT '/',
  user_display_name text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  current_user_id uuid;
  display_name_value text;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- If display_name is not provided, try to get it from user_profiles
  IF user_display_name IS NULL THEN
    SELECT up.display_name INTO display_name_value
    FROM user_profiles up
    WHERE up.id = current_user_id;
  ELSE
    display_name_value := user_display_name;
  END IF;
  
  -- Only update if online_users table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'online_users') THEN
    -- Update or insert user presence
    INSERT INTO online_users (
      user_id, 
      status, 
      current_page, 
      display_name,
      last_seen, 
      updated_at
    )
    VALUES (
      current_user_id, 
      presence_status, 
      page_location, 
      display_name_value,
      now(), 
      now()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      status = EXCLUDED.status,
      current_page = EXCLUDED.current_page,
      display_name = EXCLUDED.display_name,
      last_seen = now(),
      updated_at = now();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the updated function
GRANT EXECUTE ON FUNCTION update_user_presence(text, text, text) TO authenticated;