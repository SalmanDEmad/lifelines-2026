-- Complete auth setup for Lifelines app
-- Run this entire file in Supabase SQL Editor

-- Step 1: Drop existing table if it exists (clean slate)
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Step 2: Create user_profiles table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('citizen', 'ngo')),
  zone TEXT,
  push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop old policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Anyone can create profile" ON public.user_profiles;

-- Step 5: Create RLS policies
CREATE POLICY "Users can read own profile" 
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Anyone can create profile" 
ON public.user_profiles
FOR INSERT
WITH CHECK (true);

-- Step 6: Check if reports table exists and add user_id if missing
DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'reports'
    ) THEN
        -- Add user_id column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'reports' 
            AND column_name = 'user_id'
        ) THEN
            ALTER TABLE public.reports ADD COLUMN user_id UUID REFERENCES auth.users(id);
            CREATE INDEX idx_reports_user_id ON public.reports(user_id);
            RAISE NOTICE 'user_id column added to reports table';
        ELSE
            RAISE NOTICE 'user_id column already exists in reports';
        END IF;

        -- Update RLS policies for reports
        DROP POLICY IF EXISTS "Allow public read access" ON public.reports;
        DROP POLICY IF EXISTS "Allow public insert access" ON public.reports;
        DROP POLICY IF EXISTS "Allow public update access" ON public.reports;
        DROP POLICY IF EXISTS "Authenticated users can read reports" ON public.reports;
        DROP POLICY IF EXISTS "Users can insert own reports" ON public.reports;
        DROP POLICY IF EXISTS "NGO can update reports" ON public.reports;

        -- Enable RLS on reports
        ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

        -- New policies for reports
        CREATE POLICY "Authenticated users can read reports" 
        ON public.reports
        FOR SELECT
        USING (auth.role() = 'authenticated');

        CREATE POLICY "Users can insert own reports" 
        ON public.reports
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "NGO can update reports" 
        ON public.reports
        FOR UPDATE
        USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'ngo'
          )
        );

        RAISE NOTICE 'Reports table RLS policies updated';
    ELSE
        RAISE NOTICE 'Reports table does not exist - skipping';
    END IF;
END $$;

-- Step 7: Verify setup
SELECT 'Setup complete! user_profiles table created with RLS enabled.' as status;

-- Step 8: Refresh schema cache (important!)
NOTIFY pgrst, 'reload schema';

-- Step 9: Show table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;
