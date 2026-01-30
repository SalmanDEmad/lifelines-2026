-- Add subcategory column to reports table
-- Run this in Supabase SQL Editor to add support for report subcategories

ALTER TABLE reports 
ADD COLUMN subcategory TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN reports.subcategory IS 'Subcategory of the report (e.g., for rubble: uxos, chemicals, human_remains, recyclable_concrete; for hazard: uxo, structural, electrical, chemical, water, medical; for blocked_road: debris, crater, vehicle, structure)';
