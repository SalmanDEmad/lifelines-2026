-- Migration: Add phone column to existing user_profiles table
-- Run this if you already created user_profiles table without phone column

-- Check if table exists and add phone column if missing
DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles'
    ) THEN
        -- Add phone column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'user_profiles' 
            AND column_name = 'phone'
        ) THEN
            ALTER TABLE user_profiles ADD COLUMN phone TEXT;
            RAISE NOTICE 'Phone column added successfully';
        ELSE
            RAISE NOTICE 'Phone column already exists';
        END IF;
    ELSE
        RAISE NOTICE 'user_profiles table does not exist - run auth-schema.sql first';
    END IF;
END $$;

-- Verify the table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;
