/*
# Create wishes table (user-scoped wish list)

1. New Tables
- `wishes`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to authenticated user, references auth.users)
  - `title` (text, not null) — the wish text
  - `completed` (boolean, default false) — whether the wish is fulfilled
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security
- Enable RLS on `wishes`.
- Owner-scoped CRUD: each authenticated user can only access their own wishes.
- user_id defaults to auth.uid() so inserts without explicit user_id succeed.
*/

CREATE TABLE IF NOT EXISTS wishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_wishes" ON wishes;
CREATE POLICY "select_own_wishes" ON wishes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_wishes" ON wishes;
CREATE POLICY "insert_own_wishes" ON wishes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_wishes" ON wishes;
CREATE POLICY "update_own_wishes" ON wishes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_wishes" ON wishes;
CREATE POLICY "delete_own_wishes" ON wishes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
