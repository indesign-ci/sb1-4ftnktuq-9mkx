/*
  # Update payments table

  1. Changes
    - Add company_id column
    - Add created_by column
    - Add updated_at column
    - Update payment_method check constraint values to French
    - Drop and recreate RLS policies

  2. Security
    - Update RLS policies for company-based access
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
    
    UPDATE payments p
    SET company_id = i.company_id
    FROM invoices i
    WHERE p.invoice_id = i.id;
    
    ALTER TABLE payments ALTER COLUMN company_id SET NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE payments ADD COLUMN created_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE payments ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

DROP POLICY IF EXISTS "Users can view own company payments" ON payments;
DROP POLICY IF EXISTS "Users can create own company payments" ON payments;
DROP POLICY IF EXISTS "Users can update own company payments" ON payments;
DROP POLICY IF EXISTS "Users can delete own company payments" ON payments;

CREATE POLICY "Users can view own company payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create own company payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own company payments"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own company payments"
  ON payments
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_payments_company_id ON payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
