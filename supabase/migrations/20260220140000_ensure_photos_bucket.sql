-- ============================================================
-- S'assurer que le bucket "photos" existe (projets, logos, moodboards, etc.)
-- Évite l'erreur "Bucket not found" à l'enregistrement d'un nouveau projet.
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Politiques RLS pour le bucket photos (éviter doublons si déjà créées par une autre migration)
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view photos" ON storage.objects;

CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Users can update their photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'photos');

CREATE POLICY "Users can delete their photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'photos');

CREATE POLICY "Public can view photos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'photos');
