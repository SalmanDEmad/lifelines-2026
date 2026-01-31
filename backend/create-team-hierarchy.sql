-- Create teams table if it doesn't exist
CREATE TABLE IF NOT EXISTS teams (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create team_members table
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

-- Enable RLS (Row Level Security) on team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for team_members (allow all authenticated users to read)
CREATE POLICY IF NOT EXISTS "Allow authenticated users to read team_members"
  ON team_members
  FOR SELECT
  USING (auth.role() = 'authenticated' OR true);

-- Create RLS policy for team_members (allow all to create)
CREATE POLICY IF NOT EXISTS "Allow all to create team_members"
  ON team_members
  FOR INSERT
  WITH CHECK (true);

-- Create RLS policy for team_members (allow all to update)
CREATE POLICY IF NOT EXISTS "Allow all to update team_members"
  ON team_members
  FOR UPDATE
  USING (true);

-- Create RLS policy for team_members (allow all to delete)
CREATE POLICY IF NOT EXISTS "Allow all to delete team_members"
  ON team_members
  FOR DELETE
  USING (true);

-- Enable RLS on teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for teams
CREATE POLICY IF NOT EXISTS "Allow authenticated users to read teams"
  ON teams
  FOR SELECT
  USING (auth.role() = 'authenticated' OR true);

CREATE POLICY IF NOT EXISTS "Allow all to create teams"
  ON teams
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all to update teams"
  ON teams
  FOR UPDATE
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow all to delete teams"
  ON teams
  FOR DELETE
  USING (true);
