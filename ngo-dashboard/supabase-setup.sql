-- Teams table for NGO dashboard
-- Run this in Supabase SQL Editor

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add status column to reports if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reports' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.reports ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- Add updated_at column to reports if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reports' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.reports ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Enable RLS on teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Teams policies (only NGO users can manage teams)
CREATE POLICY "NGO users can view teams" ON public.teams
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'ngo'
    )
  );

CREATE POLICY "NGO users can insert teams" ON public.teams
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'ngo'
    )
  );

CREATE POLICY "NGO users can delete teams" ON public.teams
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'ngo'
    )
  );

-- Update reports policies to allow NGO users to update status
CREATE POLICY "NGO users can update reports" ON public.reports
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'ngo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'ngo'
    )
  );

-- NGO users can delete reports
CREATE POLICY "NGO users can delete reports" ON public.reports
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'ngo'
    )
  );

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================
-- DEMO ACCOUNTS
-- ============================================
-- Note: You need to create these users in Supabase Auth first
-- Go to Authentication > Users > Add User
-- Then run the INSERT statements below to set up their profiles

-- Demo NGO Account:
-- Email: ngo@demo.com
-- Password: demo1234

-- Demo Citizen Account:
-- Email: citizen@demo.com  
-- Password: demo1234

-- After creating users in Supabase Auth, get their UUIDs and run:
-- (Replace the UUIDs below with the actual ones from Auth)

-- INSERT INTO public.user_profiles (id, email, name, phone, role, zone)
-- VALUES 
--   ('UUID-FROM-AUTH-NGO', 'ngo@demo.com', 'NGO Demo User', '+970591234567', 'ngo', 'Gaza City'),
--   ('UUID-FROM-AUTH-CITIZEN', 'citizen@demo.com', 'Demo Citizen', '+970597654321', 'citizen', 'Gaza City');

