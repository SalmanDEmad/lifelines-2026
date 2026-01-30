-- Lifelines Database Schema
-- Run this in Supabase SQL Editor

-- Create reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('rubble', 'hazard', 'blocked_road')),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  description TEXT,
  image_url TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_reports_zone ON reports(zone);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_timestamp ON reports(timestamp DESC);
CREATE INDEX idx_reports_category ON reports(category);

-- Enable Row Level Security (RLS)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read all reports (for NGO dashboard)
CREATE POLICY "Allow public read access" ON reports
  FOR SELECT
  USING (true);

-- Policy: Allow anyone to insert reports (for mobile app)
CREATE POLICY "Allow public insert access" ON reports
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow anyone to update report status (for NGO dashboard)
CREATE POLICY "Allow public update access" ON reports
  FOR UPDATE
  USING (true);

-- Consensus/Voting System Tables
-- Create votes table for tracking user votes on report accuracy
CREATE TABLE report_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('accurate', 'inaccurate', 'unclear')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate votes from same user on same report
  UNIQUE(report_id, user_id)
);

-- Create vote statistics view to aggregate votes per report
CREATE VIEW report_vote_stats AS
SELECT 
  report_id,
  COUNT(*) as total_votes,
  COUNT(CASE WHEN vote_type = 'accurate' THEN 1 END) as accurate_votes,
  COUNT(CASE WHEN vote_type = 'inaccurate' THEN 1 END) as inaccurate_votes,
  COUNT(CASE WHEN vote_type = 'unclear' THEN 1 END) as unclear_votes,
  ROUND(100.0 * COUNT(CASE WHEN vote_type = 'accurate' THEN 1 END) / COUNT(*), 2) as accuracy_percentage
FROM report_votes
GROUP BY report_id;

-- Create indexes for faster voting queries
CREATE INDEX idx_report_votes_report_id ON report_votes(report_id);
CREATE INDEX idx_report_votes_user_id ON report_votes(user_id);
CREATE INDEX idx_report_votes_created_at ON report_votes(created_at DESC);

-- Enable Row Level Security (RLS) on votes
ALTER TABLE report_votes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read votes
CREATE POLICY "Allow public read votes" ON report_votes
  FOR SELECT
  USING (true);

-- Policy: Allow anyone to insert votes
CREATE POLICY "Allow public insert votes" ON report_votes
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow users to update/delete their own votes
CREATE POLICY "Allow users to manage own votes" ON report_votes
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Allow users to delete own votes" ON report_votes
  FOR DELETE
  USING (user_id = auth.uid());

-- Success message
SELECT 'Database schema created successfully! Voting system added. Now create storage bucket for images.' as message;
