-- Step 1: Verify teams table exists and has required columns
-- Run this query first to check the current state

SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('teams', 'team_members')
ORDER BY table_name, ordinal_position;

-- You should see:
-- teams table with columns: id, name, phone, description, created_at
-- team_members table with columns: id, name, phone, team_id, created_at
-- 
-- If you only see 'teams' or if team_members doesn't exist, that's expected.
-- Continue to the next steps below.
