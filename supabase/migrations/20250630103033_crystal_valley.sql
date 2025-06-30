/*
  # Fix function overloading for increment_thought_views

  1. Database Functions
    - Drop ambiguous overloaded `increment_thought_views` functions
    - Create specific functions for each table type:
      - `increment_shower_thought_views` for shower_thoughts table (uuid)
      - `increment_thought_views_bigint` for thoughts table (bigint)
    - Create similar functions for likes and shares

  2. Changes
    - Resolves PGRST203 error caused by function overloading
    - Ensures each function has a unique signature
    - Maintains backward compatibility where possible
*/

-- Drop existing overloaded functions to resolve ambiguity
DROP FUNCTION IF EXISTS public.increment_thought_views(thought_id bigint);
DROP FUNCTION IF EXISTS public.increment_thought_views(thought_id uuid);
DROP FUNCTION IF EXISTS public.toggle_thought_like(thought_id bigint, user_id uuid);
DROP FUNCTION IF EXISTS public.toggle_thought_like(thought_id uuid, user_id uuid);
DROP FUNCTION IF EXISTS public.increment_thought_shares(thought_id bigint);
DROP FUNCTION IF EXISTS public.increment_thought_shares(thought_id uuid);

-- Create specific function for shower_thoughts table (uuid)
CREATE OR REPLACE FUNCTION public.increment_shower_thought_views(thought_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count integer;
BEGIN
  -- Update views count and return new value
  UPDATE shower_thoughts 
  SET views_count = views_count + 1 
  WHERE id = thought_id;
  
  -- Get the updated count
  SELECT views_count INTO new_count 
  FROM shower_thoughts 
  WHERE id = thought_id;
  
  -- Return the new count (or 1 if record not found)
  RETURN COALESCE(new_count, 1);
END;
$$;

-- Create specific function for thoughts table (bigint)
CREATE OR REPLACE FUNCTION public.increment_thought_views_bigint(thought_id bigint)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count integer;
BEGIN
  -- Update views count and return new value
  UPDATE thoughts 
  SET views_count = views_count + 1 
  WHERE id = thought_id;
  
  -- Get the updated count
  SELECT views_count INTO new_count 
  FROM thoughts 
  WHERE id = thought_id;
  
  -- Return the new count (or 1 if record not found)
  RETURN COALESCE(new_count, 1);
END;
$$;

-- Create specific function for shower_thoughts likes (uuid)
CREATE OR REPLACE FUNCTION public.toggle_shower_thought_like(thought_id uuid, user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count integer;
  interaction_exists boolean;
BEGIN
  -- Check if interaction already exists
  SELECT EXISTS(
    SELECT 1 FROM interactions 
    WHERE interactions.thought_id::uuid = toggle_shower_thought_like.thought_id 
    AND interactions.user_id = toggle_shower_thought_like.user_id 
    AND interaction_type = 'like'
  ) INTO interaction_exists;
  
  IF interaction_exists THEN
    -- Remove like
    DELETE FROM interactions 
    WHERE interactions.thought_id::uuid = toggle_shower_thought_like.thought_id 
    AND interactions.user_id = toggle_shower_thought_like.user_id 
    AND interaction_type = 'like';
    
    -- Decrement count
    UPDATE shower_thoughts 
    SET likes_count = GREATEST(likes_count - 1, 0) 
    WHERE id = thought_id;
  ELSE
    -- Add like
    INSERT INTO interactions (user_id, thought_id, interaction_type) 
    VALUES (toggle_shower_thought_like.user_id, toggle_shower_thought_like.thought_id::bigint, 'like');
    
    -- Increment count
    UPDATE shower_thoughts 
    SET likes_count = likes_count + 1 
    WHERE id = thought_id;
  END IF;
  
  -- Get the updated count
  SELECT likes_count INTO new_count 
  FROM shower_thoughts 
  WHERE id = thought_id;
  
  -- Return the new count (or 0 if record not found)
  RETURN COALESCE(new_count, 0);
END;
$$;

-- Create specific function for thoughts likes (bigint)
CREATE OR REPLACE FUNCTION public.toggle_thought_like_bigint(thought_id bigint, user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count integer;
  interaction_exists boolean;
BEGIN
  -- Check if interaction already exists
  SELECT EXISTS(
    SELECT 1 FROM interactions 
    WHERE interactions.thought_id = toggle_thought_like_bigint.thought_id 
    AND interactions.user_id = toggle_thought_like_bigint.user_id 
    AND interaction_type = 'like'
  ) INTO interaction_exists;
  
  IF interaction_exists THEN
    -- Remove like
    DELETE FROM interactions 
    WHERE interactions.thought_id = toggle_thought_like_bigint.thought_id 
    AND interactions.user_id = toggle_thought_like_bigint.user_id 
    AND interaction_type = 'like';
    
    -- Decrement count
    UPDATE thoughts 
    SET likes_count = GREATEST(likes_count - 1, 0) 
    WHERE id = thought_id;
  ELSE
    -- Add like
    INSERT INTO interactions (user_id, thought_id, interaction_type) 
    VALUES (toggle_thought_like_bigint.user_id, toggle_thought_like_bigint.thought_id, 'like');
    
    -- Increment count
    UPDATE thoughts 
    SET likes_count = likes_count + 1 
    WHERE id = thought_id;
  END IF;
  
  -- Get the updated count
  SELECT likes_count INTO new_count 
  FROM thoughts 
  WHERE id = thought_id;
  
  -- Return the new count (or 0 if record not found)
  RETURN COALESCE(new_count, 0);
END;
$$;

-- Create specific function for shower_thoughts shares (uuid)
CREATE OR REPLACE FUNCTION public.increment_shower_thought_shares(thought_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count integer;
BEGIN
  -- Update shares count and return new value
  UPDATE shower_thoughts 
  SET shares_count = shares_count + 1 
  WHERE id = thought_id;
  
  -- Get the updated count
  SELECT shares_count INTO new_count 
  FROM shower_thoughts 
  WHERE id = thought_id;
  
  -- Return the new count (or 1 if record not found)
  RETURN COALESCE(new_count, 1);
END;
$$;

-- Create specific function for thoughts shares (bigint)
CREATE OR REPLACE FUNCTION public.increment_thought_shares_bigint(thought_id bigint)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count integer;
BEGIN
  -- Update shares count and return new value
  UPDATE thoughts 
  SET shares_count = shares_count + 1 
  WHERE id = thought_id;
  
  -- Get the updated count
  SELECT shares_count INTO new_count 
  FROM thoughts 
  WHERE id = thought_id;
  
  -- Return the new count (or 1 if record not found)
  RETURN COALESCE(new_count, 1);
END;
$$;