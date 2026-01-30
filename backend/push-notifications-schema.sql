-- Push Notifications Schema for Lifelines
-- Run this in Supabase SQL Editor

-- Create device_tokens table to store push notification tokens per device
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  push_token TEXT NOT NULL UNIQUE,
  device_id TEXT, -- Optional device identifier
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  region TEXT, -- User's selected region (palestine, sudan, etc.)
  latitude DECIMAL(10, 8), -- Last known location for proximity alerts
  longitude DECIMAL(11, 8),
  notification_radius_miles DECIMAL(5, 2) DEFAULT 2.0, -- Alert radius in miles
  hazard_alerts_enabled BOOLEAN DEFAULT true,
  sync_alerts_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_device_tokens_push_token ON device_tokens(push_token);
CREATE INDEX idx_device_tokens_region ON device_tokens(region);
CREATE INDEX idx_device_tokens_location ON device_tokens(latitude, longitude);

-- Enable Row Level Security
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert/update their device token
CREATE POLICY "Allow public insert device tokens" ON device_tokens
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update device tokens" ON device_tokens
  FOR UPDATE USING (true);

CREATE POLICY "Allow public select device tokens" ON device_tokens
  FOR SELECT USING (true);

-- Function to find devices within radius of a hazard
CREATE OR REPLACE FUNCTION find_devices_near_hazard(
  hazard_lat DECIMAL(10, 8),
  hazard_lng DECIMAL(11, 8),
  max_radius_miles DECIMAL(5, 2) DEFAULT 5.0
)
RETURNS TABLE (
  push_token TEXT,
  distance_miles DECIMAL(10, 4)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dt.push_token,
    (
      3959 * acos(
        cos(radians(hazard_lat)) * cos(radians(dt.latitude)) *
        cos(radians(dt.longitude) - radians(hazard_lng)) +
        sin(radians(hazard_lat)) * sin(radians(dt.latitude))
      )
    )::DECIMAL(10, 4) as distance_miles
  FROM device_tokens dt
  WHERE 
    dt.hazard_alerts_enabled = true
    AND dt.latitude IS NOT NULL 
    AND dt.longitude IS NOT NULL
    AND (
      3959 * acos(
        cos(radians(hazard_lat)) * cos(radians(dt.latitude)) *
        cos(radians(dt.longitude) - radians(hazard_lng)) +
        sin(radians(hazard_lat)) * sin(radians(dt.latitude))
      )
    ) <= LEAST(dt.notification_radius_miles, max_radius_miles);
END;
$$ LANGUAGE plpgsql;

-- Trigger to notify devices when a new hazard is reported
CREATE OR REPLACE FUNCTION notify_nearby_devices_on_hazard()
RETURNS TRIGGER AS $$
DECLARE
  device_record RECORD;
BEGIN
  -- Only notify for hazard category reports
  IF NEW.category = 'hazard' THEN
    -- Insert notification into a queue table for processing by Edge Function
    INSERT INTO hazard_notification_queue (
      report_id,
      latitude,
      longitude,
      description,
      created_at
    ) VALUES (
      NEW.id,
      NEW.latitude,
      NEW.longitude,
      NEW.description,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create notification queue table
CREATE TABLE IF NOT EXISTS hazard_notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  description TEXT,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hazard_queue_processed ON hazard_notification_queue(processed);

-- Create trigger on reports table
DROP TRIGGER IF EXISTS on_new_hazard_trigger ON reports;
CREATE TRIGGER on_new_hazard_trigger
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION notify_nearby_devices_on_hazard();

-- Success message
SELECT 'Push notification schema created successfully!' as message;
