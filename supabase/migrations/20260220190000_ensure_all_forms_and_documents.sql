-- ============================================================
-- MIGRATION UNIQUE : Formulaires et documents fonctionnels
-- Exécuter ce fichier une seule fois dans Supabase → SQL Editor
-- ============================================================

-- ----- 1. Bucket photos (projets, logos, moodboards, matériaux, etc.) -----
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'photos');
CREATE POLICY "Users can update their photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'photos');
CREATE POLICY "Users can delete their photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'photos');
CREATE POLICY "Public can view photos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'photos');

-- ----- 2. Bucket documents (cahier des charges, PV, DOE, pièces jointes) -----
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  20971520,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Anon can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete documents" ON storage.objects;
CREATE POLICY "Public can view documents" ON storage.objects FOR SELECT TO public USING (bucket_id = 'documents');
CREATE POLICY "Authenticated can upload documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Anon can upload documents" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Authenticated can update documents" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'documents');
CREATE POLICY "Authenticated can delete documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents');

-- ----- 3. Bucket conception-assets (module Conception) -----
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'conception-assets',
  'conception-assets',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read conception assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload conception assets" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete conception assets" ON storage.objects;
CREATE POLICY "Public read conception assets" ON storage.objects FOR SELECT USING (bucket_id = 'conception-assets');
CREATE POLICY "Authenticated upload conception assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'conception-assets' AND auth.role() = 'authenticated');
CREATE POLICY "Owner delete conception assets" ON storage.objects FOR DELETE USING (bucket_id = 'conception-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ----- 4. Colonnes manquantes : companies -----
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies') THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'website') THEN ALTER TABLE companies ADD COLUMN website TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'siret') THEN ALTER TABLE companies ADD COLUMN siret TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'vat_number') THEN ALTER TABLE companies ADD COLUMN vat_number TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'rcs') THEN ALTER TABLE companies ADD COLUMN rcs TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'iban') THEN ALTER TABLE companies ADD COLUMN iban TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'quote_legal_mentions') THEN ALTER TABLE companies ADD COLUMN quote_legal_mentions TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'invoice_legal_mentions') THEN ALTER TABLE companies ADD COLUMN invoice_legal_mentions TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'terms_conditions') THEN ALTER TABLE companies ADD COLUMN terms_conditions TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'logo_url') THEN ALTER TABLE companies ADD COLUMN logo_url TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'updated_at') THEN ALTER TABLE companies ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now(); END IF;
END $$;

-- ----- 5. Colonnes manquantes : projects -----
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'address') THEN ALTER TABLE projects ADD COLUMN address TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'city') THEN ALTER TABLE projects ADD COLUMN city TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'postal_code') THEN ALTER TABLE projects ADD COLUMN postal_code TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'property_type') THEN ALTER TABLE projects ADD COLUMN property_type TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'surface_area') THEN ALTER TABLE projects ADD COLUMN surface_area NUMERIC(10,2); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'style') THEN ALTER TABLE projects ADD COLUMN style TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'budget_estimated') THEN ALTER TABLE projects ADD COLUMN budget_estimated NUMERIC(12,2); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'budget_spent') THEN ALTER TABLE projects ADD COLUMN budget_spent NUMERIC(12,2) DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'start_date') THEN ALTER TABLE projects ADD COLUMN start_date DATE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'deadline') THEN ALTER TABLE projects ADD COLUMN deadline DATE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'description') THEN ALTER TABLE projects ADD COLUMN description TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'cover_image_url') THEN ALTER TABLE projects ADD COLUMN cover_image_url TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'current_phase') THEN ALTER TABLE projects ADD COLUMN current_phase TEXT DEFAULT 'brief'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'progress') THEN ALTER TABLE projects ADD COLUMN progress NUMERIC(5,2) DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'architect_id') THEN ALTER TABLE projects ADD COLUMN architect_id UUID REFERENCES profiles(id) ON DELETE SET NULL; END IF;
END $$;

-- ----- 6. company_id sur quotes et invoices -----
DO $$
DECLARE
  first_company_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN RETURN; END IF;
  SELECT id INTO first_company_id FROM companies LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'company_id') THEN
    ALTER TABLE quotes ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
    IF first_company_id IS NOT NULL THEN UPDATE quotes SET company_id = first_company_id WHERE company_id IS NULL; END IF;
    IF first_company_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM quotes WHERE company_id IS NULL) THEN
      ALTER TABLE quotes ALTER COLUMN company_id SET NOT NULL;
    END IF;
    CREATE INDEX IF NOT EXISTS idx_quotes_company_id ON quotes(company_id);
  END IF;
END $$;

DO $$
DECLARE
  first_company_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN RETURN; END IF;
  SELECT id INTO first_company_id FROM companies LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'company_id') THEN
    ALTER TABLE invoices ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
    IF first_company_id IS NOT NULL THEN UPDATE invoices SET company_id = first_company_id WHERE company_id IS NULL; END IF;
    IF first_company_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM invoices WHERE company_id IS NULL) THEN
      ALTER TABLE invoices ALTER COLUMN company_id SET NOT NULL;
    END IF;
    CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);
  END IF;
END $$;

-- ----- 7. Supprimer la contrainte clients qui bloque la création (chk_client_identity) -----
ALTER TABLE clients DROP CONSTRAINT IF EXISTS chk_client_identity;
