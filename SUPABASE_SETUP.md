# Supabase Setup Guide

Your NGO dashboard is trying to fetch from Supabase tables that don't exist yet. Follow these steps to create them:

## Step 1: Go to Supabase Console
Visit: https://supabase.com/dashboard

## Step 2: Select Your Project
- Project: `niwiwfngnejwqlulcuin`
- URL: https://niwiwfngnejwqlulcuin.supabase.co

## Step 3: Open SQL Editor
Click on "SQL Editor" in the left sidebar

## Step 4: Create New Query
Paste the following SQL and execute it:

```sql
-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone TEXT,
  category TEXT CHECK (category IN ('rubble', 'hazard', 'blocked_road')),
  rubble_subcategory TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  description TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY,
  phone TEXT,
  role TEXT DEFAULT 'civilian' CHECK (role IN ('civilian', 'ngo')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reports_zone ON reports(zone);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);

-- Enable Row Level Security (RLS)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow all for demo/hackathon)
-- Reports policies
DROP POLICY IF EXISTS "reports_select" ON reports;
DROP POLICY IF EXISTS "reports_insert" ON reports;
DROP POLICY IF EXISTS "reports_update" ON reports;
DROP POLICY IF EXISTS "reports_delete" ON reports;

CREATE POLICY "reports_select" ON reports FOR SELECT USING (true);
CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (true);
CREATE POLICY "reports_update" ON reports FOR UPDATE USING (true);
CREATE POLICY "reports_delete" ON reports FOR DELETE USING (true);

-- User profiles policies
DROP POLICY IF EXISTS "user_profiles_select" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update" ON user_profiles;

CREATE POLICY "user_profiles_select" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "user_profiles_insert" ON user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "user_profiles_update" ON user_profiles FOR UPDATE USING (true);

-- Teams policies
DROP POLICY IF EXISTS "teams_select" ON teams;
DROP POLICY IF EXISTS "teams_insert" ON teams;
DROP POLICY IF EXISTS "teams_update" ON teams;
DROP POLICY IF EXISTS "teams_delete" ON teams;

CREATE POLICY "teams_select" ON teams FOR SELECT USING (true);
CREATE POLICY "teams_insert" ON teams FOR INSERT WITH CHECK (true);
CREATE POLICY "teams_update" ON teams FOR UPDATE USING (true);
CREATE POLICY "teams_delete" ON teams FOR DELETE USING (true);
```

## Step 5: Execute the SQL
Click the "RUN" button to execute all the SQL commands.

## Step 6: Verify Tables
- Look in the "Schema Visualizer" on the left
- You should see: `reports`, `user_profiles`, `teams`

## Step 7: Test the Dashboard
- Refresh your browser at http://localhost:3002
- You should now see the Dashboard with 0 reports
- The loading screen should be gone

## Step 8: Create Demo Account (Optional)
Visit http://localhost:3002 and sign up with:
- Email: ngo@amal.app
- Password: demo1234
- Account Type: NGO Worker

## Troubleshooting

If you still see errors:
1. Open browser DevTools (F12)
2. Check Console tab for error messages
3. Common issues:
   - Table already exists: That's fine, the `IF NOT EXISTS` handles it
   - Permission denied: Check RLS policies are created correctly
   - Timeout: Try refreshing the page

## Notes
- These are demo/hackathon policies (allow all)
- For production, implement proper RLS policies with auth checks
- Adjust column types as needed for your data
