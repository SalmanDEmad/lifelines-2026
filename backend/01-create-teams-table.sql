-- Step 2: Ensure teams table exists with all required columns
-- Run this after verification step

-- Create teams table if it doesn't exist
CREATE TABLE IF NOT EXISTS teams (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns if they don't exist
ALTER TABLE teams ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '+1 (000) 000-0000';
ALTER TABLE teams ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Enable RLS on teams table
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams table
DROP POLICY IF EXISTS "Allow all to read teams" ON teams;
CREATE POLICY "Allow all to read teams"
  ON teams
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow all to create teams" ON teams;
CREATE POLICY "Allow all to create teams"
  ON teams
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all to update teams" ON teams;
CREATE POLICY "Allow all to update teams"
  ON teams
  FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow all to delete teams" ON teams;
CREATE POLICY "Allow all to delete teams"
  ON teams
  FOR DELETE
  USING (true);

-- Verify teams table structure
SELECT 
  'teams' as table_name,
  COUNT(*) as row_count
FROM teams;

-- Expected output: teams table should exist with row_count >= 0
