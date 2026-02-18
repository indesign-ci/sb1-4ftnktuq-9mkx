/*
  # Ajouter la TVA 18% et mettre à jour les devises
  
  1. Modifications des tables
    - Ajouter la colonne `vat_18` à la table `quotes`
    - Ajouter la colonne `vat_18` à la table `invoices`
    - Ajouter la colonne `currency` aux tables pour supporter FCFA, EUR, USD
  
  2. Notes importantes
    - La TVA 18% est ajoutée en plus des TVA 10% et 20% existantes
    - La devise par défaut est maintenant le Franc CFA (FCFA/XAF)
    - Les valeurs existantes ne sont pas modifiées
*/

-- Ajouter vat_18 à la table quotes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'vat_18'
  ) THEN
    ALTER TABLE quotes ADD COLUMN vat_18 NUMERIC DEFAULT 0;
  END IF;
END $$;

-- Ajouter vat_18 à la table invoices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'vat_18'
  ) THEN
    ALTER TABLE invoices ADD COLUMN vat_18 NUMERIC DEFAULT 0;
  END IF;
END $$;

-- Ajouter currency aux tables quotes et invoices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'currency'
  ) THEN
    ALTER TABLE quotes ADD COLUMN currency TEXT DEFAULT 'XAF' CHECK (currency IN ('XAF', 'EUR', 'USD'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'currency'
  ) THEN
    ALTER TABLE invoices ADD COLUMN currency TEXT DEFAULT 'XAF' CHECK (currency IN ('XAF', 'EUR', 'USD'));
  END IF;
END $$;
