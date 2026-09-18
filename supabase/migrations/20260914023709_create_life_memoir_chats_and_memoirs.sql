/*
# Create life memoir chats and memoirs tables

1. New Tables
- `life_memoir_chats`: Stores individual chat messages between the user and the "伴伴" chatbot during life-memory conversations.
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users)
  - `role` (text: 'user' or 'assistant')
  - `content` (text, the message body)
  - `created_at` (timestamptz, defaults to now())
- `life_memoirs`: Stores generated life memoirs compiled from chat conversations.
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users)
  - `title` (text, memoir title)
  - `summary` (text, brief summary of the memoir)
  - `events` (jsonb, array of {year, title, description} life events extracted from conversation)
  - `chat_messages` (jsonb, the full conversation that generated this memoir, for reference)
  - `created_at` (timestamptz, defaults to now())

2. Security
- Enable RLS on both tables.
- Owner-scoped CRUD: each authenticated user can only access their own rows.
- user_id defaults to auth.uid() so inserts that omit user_id still satisfy the WITH CHECK.
*/

CREATE TABLE IF NOT EXISTS life_memoir_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE life_memoir_chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_chats" ON life_memoir_chats;
CREATE POLICY "select_own_chats" ON life_memoir_chats FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_chats" ON life_memoir_chats;
CREATE POLICY "insert_own_chats" ON life_memoir_chats FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_chats" ON life_memoir_chats;
CREATE POLICY "delete_own_chats" ON life_memoir_chats FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS life_memoirs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text NOT NULL,
  events jsonb NOT NULL DEFAULT '[]'::jsonb,
  chat_messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE life_memoirs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_memoirs" ON life_memoirs;
CREATE POLICY "select_own_memoirs" ON life_memoirs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_memoirs" ON life_memoirs;
CREATE POLICY "insert_own_memoirs" ON life_memoirs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_memoirs" ON life_memoirs;
CREATE POLICY "delete_own_memoirs" ON life_memoirs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_life_memoir_chats_user_id ON life_memoir_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_life_memoirs_user_id ON life_memoirs(user_id);
