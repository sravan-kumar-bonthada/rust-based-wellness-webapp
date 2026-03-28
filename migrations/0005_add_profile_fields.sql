-- 0005_add_profile_fields.sql
-- Add missing fields for a complete Profile Module

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS mental_profile_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add a trigger to update updated_at if not already present for user_profiles
-- (Assuming standard trigger setup if exists, otherwise manual updates are fine in Rust)
