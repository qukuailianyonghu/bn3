/*
# Add category column to wishes table

1. Modified Tables
- `wishes`
  - Add `category` (text, not null, default 'old_age') — categorizes wishes into life stages: 'childhood', 'middle_age', 'old_age'

2. Security
- No new security changes; existing RLS policies already cover the new column since it's user-editable content.
*/

ALTER TABLE wishes ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'old_age';

-- Backfill existing rows so they appear in the "old_age" category
UPDATE wishes SET category = 'old_age' WHERE category IS NULL;

CREATE INDEX IF NOT EXISTS idx_wishes_user_category ON wishes(user_id, category);
