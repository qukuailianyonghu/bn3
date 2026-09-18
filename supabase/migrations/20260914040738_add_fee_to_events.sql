/*
# Add fee column to events table

1. Modified Tables
- `events`: Add `fee` numeric column (nullable) for per-person participation cost.
  Default is NULL (free event). Stored in CNY (yuan).

2. Important Notes
- Non-destructive: existing events get NULL fee (treated as free).
- No data is lost.
*/

ALTER TABLE events ADD COLUMN IF NOT EXISTS fee numeric(10,2) DEFAULT NULL;
