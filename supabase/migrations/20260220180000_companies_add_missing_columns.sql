-- ============================================================
-- Ajouter les colonnes manquantes à la table companies
-- Corrige "Could not find the 'iban' column of 'companies' in the schema cache"
-- (Mentions légales, IBAN, SIRET, etc.)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies') THEN
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'website') THEN
    ALTER TABLE companies ADD COLUMN website TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'siret') THEN
    ALTER TABLE companies ADD COLUMN siret TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'vat_number') THEN
    ALTER TABLE companies ADD COLUMN vat_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'rcs') THEN
    ALTER TABLE companies ADD COLUMN rcs TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'iban') THEN
    ALTER TABLE companies ADD COLUMN iban TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'quote_legal_mentions') THEN
    ALTER TABLE companies ADD COLUMN quote_legal_mentions TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'invoice_legal_mentions') THEN
    ALTER TABLE companies ADD COLUMN invoice_legal_mentions TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'terms_conditions') THEN
    ALTER TABLE companies ADD COLUMN terms_conditions TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'logo_url') THEN
    ALTER TABLE companies ADD COLUMN logo_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'updated_at') THEN
    ALTER TABLE companies ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;
