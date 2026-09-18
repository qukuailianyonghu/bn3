/*
# Create post_comments table

1. New Tables
  - `post_comments`
    - `id` (uuid, primary key)
    - `post_id` (uuid, FK → posts.id, cascade delete)
    - `user_id` (uuid, FK → profiles.id, cascade delete, defaults to auth.uid())
    - `body` (text, not null)
    - `created_at` (timestamptz, defaults to now())

2. Security
  - Enable RLS on `post_comments`.
  - Authenticated users can read ALL comments (comments are public within the app).
  - Authenticated users can insert their own comments.
  - Authenticated users can delete their own comments only.

3. Notes
  - No UPDATE policy — comments are immutable once posted.
  - `DEFAULT auth.uid()` on `user_id` means the client insert only needs `{ post_id, body }`.
*/

CREATE TABLE IF NOT EXISTS post_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  body       text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS post_comments_post_id_idx ON post_comments(post_id);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_post_comments" ON post_comments;
CREATE POLICY "select_post_comments" ON post_comments
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "insert_post_comments" ON post_comments;
CREATE POLICY "insert_post_comments" ON post_comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_post_comments" ON post_comments;
CREATE POLICY "delete_own_post_comments" ON post_comments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
