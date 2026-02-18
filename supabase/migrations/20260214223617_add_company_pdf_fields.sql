/*
  # Add PDF Generation Fields to Companies Table

  1. Changes
    - Add `postal_code` field to companies table
    - Add `city` field to companies table
    - Add `payment_terms` field to companies table (for default quote/invoice payment terms)
    - Add `deposit_percent` field to companies table (for default deposit percentage on quotes)

  2. Purpose
    - These fields are needed for professional PDF generation of quotes and invoices
    - They allow the company information to be properly displayed on PDF documents
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE companies ADD COLUMN postal_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'city'
  ) THEN
    ALTER TABLE companies ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'payment_terms'
  ) THEN
    ALTER TABLE companies ADD COLUMN payment_terms text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'deposit_percent'
  ) THEN
    ALTER TABLE companies ADD COLUMN deposit_percent numeric DEFAULT 30;
  END IF;
END $$;
