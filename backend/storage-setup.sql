-- Supabase Storage Setup for Report Photos
-- Run this in Supabase SQL Editor

-- Create storage bucket for report photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-photos',
  'report-photos',
  true,  -- Public bucket so photos can be viewed
  5242880,  -- 5MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Policy: Allow anyone to upload photos (for anonymous report submissions)
CREATE POLICY "Allow public uploads to report-photos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'report-photos');

-- Policy: Allow anyone to view photos
CREATE POLICY "Allow public read access to report-photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'report-photos');

-- Policy: Allow authenticated users to delete their photos
CREATE POLICY "Allow authenticated users to delete photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'report-photos');

-- Update reports table to include subcategory column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reports' AND column_name = 'subcategory'
  ) THEN
    ALTER TABLE reports ADD COLUMN subcategory TEXT;
  END IF;
END $$;

-- Success message
SELECT 'Storage bucket "report-photos" created successfully!' as message;
