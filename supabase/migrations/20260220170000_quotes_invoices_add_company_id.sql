-- ============================================================
-- Ajouter company_id aux tables quotes et invoices si manquant
-- Corrige "Could not find the 'company_id' column of 'quotes' in the schema cache"
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'company_id') THEN
    ALTER TABLE quotes ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
    UPDATE quotes SET company_id = (SELECT id FROM companies LIMIT 1) WHERE company_id IS NULL;
    ALTER TABLE quotes ALTER COLUMN company_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_quotes_company_id ON quotes(company_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'company_id') THEN
    ALTER TABLE invoices ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
    UPDATE invoices SET company_id = (SELECT id FROM companies LIMIT 1) WHERE company_id IS NULL;
    ALTER TABLE invoices ALTER COLUMN company_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);
  END IF;
END $$;
