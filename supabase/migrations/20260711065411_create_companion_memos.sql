/*
# Create companion_memos table

1. New Tables
  - `companion_memos`
    - `id` (uuid, primary key)
    - `user_id` (uuid, FK → profiles.id, cascade delete, defaults to auth.uid())
    - `memo_type` (text, not null) — one of 'medication', 'bedtime', 'blood_pressure'
    - `title` (text, not null) — display label, e.g. "降压药"
    - `scheduled_time` (time, not null) — time-of-day the reminder fires
    - `note` (text, default '') — optional free-form note
    - `done` (boolean, default false) — whether today's instance is checked off
    - `created_at` (timestamptz, default now())

2. Security
  - Enable RLS on `companion_memos`.
  - Owner-scoped CRUD: each authenticated user can only access rows they own.
  - user_id defaults to auth.uid() so client inserts omitting user_id still pass WITH CHECK.

3. Notes
  - No UPDATE restriction beyond ownership — users toggle `done` and edit notes.
*/

CREATE TABLE IF NOT EXISTS companion_memos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  memo_type      text NOT NULL CHECK (memo_type IN ('medication', 'bedtime', 'blood_pressure')),
  title          text NOT NULL,
  scheduled_time time NOT NULL,
  note           text DEFAULT '',
  done           boolean DEFAULT false,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS companion_memos_user_id_idx ON companion_memos(user_id);

ALTER TABLE companion_memos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_memos" ON companion_memos;
CREATE POLICY "select_own_memos" ON companion_memos
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_memos" ON companion_memos;
CREATE POLICY "insert_own_memos" ON companion_memos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_memos" ON companion_memos;
CREATE POLICY "update_own_memos" ON companion_memos
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_memos" ON companion_memos;
CREATE POLICY "delete_own_memos" ON companion_memos
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
