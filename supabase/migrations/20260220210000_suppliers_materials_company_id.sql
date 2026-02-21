-- ============================================================
-- S'assurer que suppliers et materials ont company_id et que les
-- données existantes sont rattachées à la première entreprise.
-- Corrige le chargement des fournisseurs et matériaux au démarrage.
-- ============================================================

DO $$
DECLARE
  first_company_id UUID;
BEGIN
  SELECT id INTO first_company_id FROM companies LIMIT 1;
  IF first_company_id IS NULL THEN RETURN; END IF;

  -- Table suppliers
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suppliers') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'suppliers' AND column_name = 'company_id') THEN
      ALTER TABLE suppliers ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
    UPDATE suppliers SET company_id = first_company_id WHERE company_id IS NULL;
    CREATE INDEX IF NOT EXISTS idx_suppliers_company_id ON suppliers(company_id);
  END IF;

  -- Table materials
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'materials') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'materials' AND column_name = 'company_id') THEN
      ALTER TABLE materials ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
    UPDATE materials SET company_id = first_company_id WHERE company_id IS NULL;
    CREATE INDEX IF NOT EXISTS idx_materials_company_id ON materials(company_id);
  END IF;
END $$;
