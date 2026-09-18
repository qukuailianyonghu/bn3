/*
# Create messages table for companion messaging

1. New Tables
  - `messages`
    - `id` (uuid, primary key)
    - `sender_id` (uuid, FK → profiles.id, cascade delete, defaults to auth.uid())
    - `recipient_id` (uuid, FK → profiles.id, cascade delete, not null)
    - `body` (text, not null) — message content
    - `read` (boolean, default false) — whether the recipient has read it
    - `created_at` (timestamptz, default now())

2. Security
  - Enable RLS on `messages`.
  - Both sender and recipient can read messages they are party to.
  - Only the sender can insert (sender_id defaults to auth.uid()).
  - Only the recipient can mark a message as read (update).
  - Only the sender can delete their own sent messages.

3. Notes
  - Indexes on sender_id, recipient_id, and created_at for conversation queries.
  - sender_id defaults to auth.uid() so client inserts omitting it still pass WITH CHECK.
*/

CREATE TABLE IF NOT EXISTS messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body         text NOT NULL,
  read         boolean NOT NULL DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_recipient_id_idx ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_messages" ON messages;
CREATE POLICY "select_own_messages" ON messages
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "insert_own_messages" ON messages;
CREATE POLICY "insert_own_messages" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "update_own_messages" ON messages;
CREATE POLICY "update_own_messages" ON messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "delete_own_messages" ON messages;
CREATE POLICY "delete_own_messages" ON messages
  FOR DELETE TO authenticated
  USING (auth.uid() = sender_id);
