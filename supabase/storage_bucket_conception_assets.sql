-- ============================================================
-- Bucket storage "conception-assets" + politiques RLS
-- Exécutez dans Supabase → SQL Editor
-- ============================================================

-- Bucket pour assets de conception (images, PDF)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'conception-assets',
  'conception-assets',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Suppression des politiques existantes (pour réexécution sans erreur)
DROP POLICY IF EXISTS "Public read conception assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload conception assets" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete conception assets" ON storage.objects;

-- Lecture publique du bucket
CREATE POLICY "Public read conception assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'conception-assets');

-- Upload réservé aux utilisateurs authentifiés
CREATE POLICY "Authenticated upload conception assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'conception-assets' AND auth.role() = 'authenticated');

-- Suppression par le propriétaire (premier segment du path = auth.uid())
CREATE POLICY "Owner delete conception assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'conception-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
