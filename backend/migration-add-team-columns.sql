-- Lifelines Database Migration
-- Add missing columns to teams table
-- Run this in Supabase SQL Editor to fix team creation

-- ============================================================================
-- STEP 1: Check current teams table structure (informational)
-- ============================================================================
-- This query shows the current columns in the teams table
-- You can view the results to confirm what exists
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'teams'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 2: Add missing columns to teams table
-- ============================================================================
-- Add phone column (REQUIRED for team contact)
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '+1 (000) 000-0000';

-- Add description column (OPTIONAL for team details)
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- ============================================================================
-- STEP 3: Verify teams table structure after migration
-- ============================================================================
-- This shows the teams table should now have:
-- id (BIGSERIAL PRIMARY KEY)
-- name (TEXT NOT NULL)
-- phone (TEXT NOT NULL) ← NEW
-- description (TEXT) ← NEW
-- created_at (TIMESTAMP DEFAULT NOW())
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'teams'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 4: Verify team_members table structure (should already exist)
-- ============================================================================
-- team_members should have:
-- id (BIGSERIAL PRIMARY KEY)
-- name (TEXT NOT NULL)
-- phone (TEXT NOT NULL)
-- team_id (BIGINT REFERENCES teams(id) ON DELETE SET NULL)
-- created_at (TIMESTAMP DEFAULT NOW())
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'team_members'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 5: Verify reports table structure (should already exist)
-- ============================================================================
-- reports should have:
-- id (UUID PRIMARY KEY)
-- zone, category, subcategory, latitude, longitude
-- description, image_url, timestamp, status, created_at
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'reports'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 6: Display summary of tables
-- ============================================================================
-- This shows all three main tables and their record counts
SELECT 'teams' as table_name, COUNT(*) as record_count FROM teams
UNION ALL
SELECT 'team_members', COUNT(*) FROM team_members
UNION ALL
SELECT 'reports', COUNT(*) FROM reports;

-- ============================================================================
-- Success message
-- ============================================================================
SELECT 'Migration completed! Teams table is now ready for use.' as status;
