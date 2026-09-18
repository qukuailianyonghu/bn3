/*
# Create old-photos storage bucket

1. Storage
- Create a public bucket `old-photos` for storing user-uploaded old photos and their restored versions
- Enable public read access (photos are viewable in the album)
- Allow authenticated users to upload/delete only their own files (scoped by user_id folder)

2. Security
- Storage policies:
  - SELECT (public read): anyone can view photos
  - INSERT: authenticated users can upload to their own folder (user_id/)
  - DELETE: authenticated users can delete from their own folder
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('old-photos', 'old-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
DROP POLICY IF EXISTS "public_read_old_photos" ON storage.objects;
CREATE POLICY "public_read_old_photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'old-photos');

-- Authenticated users can upload to their own folder
DROP POLICY IF EXISTS "insert_own_old_photos_storage" ON storage.objects;
CREATE POLICY "insert_own_old_photos_storage"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'old-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can delete their own files
DROP POLICY IF EXISTS "delete_own_old_photos_storage" ON storage.objects;
CREATE POLICY "delete_own_old_photos_storage"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'old-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
