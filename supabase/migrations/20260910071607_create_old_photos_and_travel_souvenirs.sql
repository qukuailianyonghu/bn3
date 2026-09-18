/*
# Create old_photos and travel_souvenirs tables

1. New Tables
- `old_photos`: stores user-uploaded old photographs for AI restoration
  - id (uuid, PK)
  - user_id (uuid, FK to auth.users, defaults to auth.uid())
  - title (text)
  - original_url (text, not null) — link to the original photo
  - restored_url (text, nullable) — link to the restored version
  - note (text) — optional user note
  - status (text: 'pending' | 'processing' | 'completed', default 'pending')
  - created_at (timestamptz)
- `travel_souvenirs`: stores user travel souvenir photos with descriptions
  - id (uuid, PK)
  - user_id (uuid, FK to auth.users, defaults to auth.uid())
  - title (text, not null)
  - destination (text)
  - image_url (text, not null)
  - description (text)
  - created_at (timestamptz)

2. Security
- Enable RLS on both tables.
- Owner-scoped CRUD: each authenticated user can only access their own rows.
- user_id defaults to auth.uid() so inserts that omit user_id still succeed.
*/

CREATE TABLE IF NOT EXISTS old_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  original_url text NOT NULL,
  restored_url text,
  note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE old_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_old_photos" ON old_photos;
CREATE POLICY "select_own_old_photos" ON old_photos FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_old_photos" ON old_photos;
CREATE POLICY "insert_own_old_photos" ON old_photos FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_old_photos" ON old_photos;
CREATE POLICY "update_own_old_photos" ON old_photos FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_old_photos" ON old_photos;
CREATE POLICY "delete_own_old_photos" ON old_photos FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS travel_souvenirs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  destination text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE travel_souvenirs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_travel_souvenirs" ON travel_souvenirs;
CREATE POLICY "select_own_travel_souvenirs" ON travel_souvenirs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_travel_souvenirs" ON travel_souvenirs;
CREATE POLICY "insert_own_travel_souvenirs" ON travel_souvenirs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_travel_souvenirs" ON travel_souvenirs;
CREATE POLICY "update_own_travel_souvenirs" ON travel_souvenirs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_travel_souvenirs" ON travel_souvenirs;
CREATE POLICY "delete_own_travel_souvenirs" ON travel_souvenirs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
