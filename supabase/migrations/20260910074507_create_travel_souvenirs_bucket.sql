/*
# Create travel-souvenirs storage bucket

1. Storage
- Create a public bucket `travel-souvenirs` for storing user-uploaded travel photos
- Enable public read access (photos are shared in the album)
- Allow authenticated users to upload/delete only their own files (scoped by user_id folder)

2. Security
- Storage policies:
  - SELECT (public read): anyone can view photos
  - INSERT: authenticated users can upload to their own folder (user_id/)
  - DELETE: authenticated users can delete from their own folder
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('travel-souvenirs', 'travel-souvenirs', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
DROP POLICY IF EXISTS "public_read_travel_souvenirs" ON storage.objects;
CREATE POLICY "public_read_travel_souvenirs"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'travel-souvenirs');

-- Authenticated users can upload to their own folder
DROP POLICY IF EXISTS "insert_own_travel_souvenirs" ON storage.objects;
CREATE POLICY "insert_own_travel_souvenirs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'travel-souvenirs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can delete their own files
DROP POLICY IF EXISTS "delete_own_travel_souvenirs" ON storage.objects;
CREATE POLICY "delete_own_travel_souvenirs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'travel-souvenirs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
