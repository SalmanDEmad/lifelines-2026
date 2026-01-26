-- User Profiles Table
-- Run this in Supabase SQL Editor

-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('citizen', 'ngo')),
  zone TEXT, -- For NGO users, which zone they manage
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Anyone can insert (for signup)
CREATE POLICY "Anyone can create profile" ON user_profiles
  FOR INSERT
  WITH CHECK (true);

-- Update reports table to add user_id
ALTER TABLE reports ADD COLUMN user_id UUID REFERENCES auth.users(id);
CREATE INDEX idx_reports_user_id ON reports(user_id);

-- Update RLS policies for reports
DROP POLICY IF EXISTS "Allow public read access" ON reports;
DROP POLICY IF EXISTS "Allow public insert access" ON reports;
DROP POLICY IF EXISTS "Allow public update access" ON reports;

-- New policy: Anyone can read all reports (for NGO dashboard)
CREATE POLICY "Authenticated users can read reports" ON reports
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- New policy: Authenticated users can insert their own reports
CREATE POLICY "Users can insert own reports" ON reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- New policy: NGO users can update any report, citizens can't update
CREATE POLICY "NGO can update reports" ON reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'ngo'
    )
  );

-- Success message
SELECT 'Auth schema created successfully!' as message;
