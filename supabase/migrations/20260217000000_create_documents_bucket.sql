/*
  # Bucket "documents" pour cahiers des charges et pièces jointes

  - PDF et images pour plans, détails techniques, photos de référence
  - Lecture publique, écriture authentified + anon (pour app sans auth)
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  20971520,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Lecture publique
CREATE POLICY "Public can view documents"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'documents');

-- Upload : authenticated
CREATE POLICY "Authenticated can upload documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

-- Upload : anon (pour app en mode démo/admin sans Supabase Auth)
CREATE POLICY "Anon can upload documents"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'documents');

-- Update / Delete : authenticated
CREATE POLICY "Authenticated can update documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated can delete documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents');
