-- Lifelines Team Members Table Migration
-- Run this AFTER teams table has been created
-- This creates the team_members table with proper structure and RLS policies

-- Check if team_members table exists
-- If it exists, this will do nothing (IF NOT EXISTS clause)
CREATE TABLE IF NOT EXISTS team_members (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  team_id BIGINT REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indices for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_created_at ON team_members(created_at);

-- Enable Row Level Security (RLS) on team_members table
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policy 1: Allow anyone to read all team members
CREATE POLICY IF NOT EXISTS "Allow all to read team_members"
  ON team_members
  FOR SELECT
  USING (true);

-- RLS Policy 2: Allow anyone to create team members
CREATE POLICY IF NOT EXISTS "Allow all to create team_members"
  ON team_members
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy 3: Allow anyone to update team members
CREATE POLICY IF NOT EXISTS "Allow all to update team_members"
  ON team_members
  FOR UPDATE
  USING (true);

-- RLS Policy 4: Allow anyone to delete team members
CREATE POLICY IF NOT EXISTS "Allow all to delete team_members"
  ON team_members
  FOR DELETE
  USING (true);

-- Verify the table structure
SELECT 
  'team_members' as table_name,
  COUNT(*) as row_count
FROM team_members;
