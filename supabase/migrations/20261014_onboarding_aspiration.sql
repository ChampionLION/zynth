-- Existing live databases need this nullable column before saving schema-v2 profiles.
-- Existing profiles do not need to repeat onboarding.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS aspiration TEXT;
