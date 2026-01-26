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

-- Success message
SELECT 'Database schema created successfully! Now create storage bucket for images.' as message;
