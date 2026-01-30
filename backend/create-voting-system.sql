-- Create report_votes table and voting system
-- Run this in Supabase SQL Editor to enable the voting/consensus system

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
