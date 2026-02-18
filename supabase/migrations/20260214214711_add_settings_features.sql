/*
  # Add Settings Features

  1. Companies Table Updates
    - Add quote_legal_mentions column for quotes legal text
    - Add invoice_legal_mentions column for invoices legal text
    
  2. Suppliers Table Updates
    - Rename contact_name to contact_person for consistency
    - Rename discount_rate to discount_percentage for consistency
    
  3. New Tables
    - `categories` table for managing application categories
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key)
      - `type` (text) - 'material', 'budget_post', or 'acquisition_source'
      - `name` (text)
      - `position` (integer)
      - `created_at` (timestamp)
      
  4. Security
    - Enable RLS on categories table
    - Add policies for company access
*/

-- Add new columns to companies table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'quote_legal_mentions'
  ) THEN
    ALTER TABLE companies ADD COLUMN quote_legal_mentions TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'invoice_legal_mentions'
  ) THEN
    ALTER TABLE companies ADD COLUMN invoice_legal_mentions TEXT;
  END IF;
END $$;

-- Update suppliers table column names if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'contact_name'
  ) THEN
    ALTER TABLE suppliers RENAME COLUMN contact_name TO contact_person;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'discount_rate'
  ) THEN
    ALTER TABLE suppliers RENAME COLUMN discount_rate TO discount_percentage;
  END IF;
END $$;

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('material', 'budget_post', 'acquisition_source')),
  name TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Users can view categories from their company"
  ON categories FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert default material categories
INSERT INTO categories (company_id, type, name, position)
SELECT 
  id,
  'material',
  unnest(ARRAY['Sol', 'Mur', 'Tissu', 'Luminaire', 'Mobilier', 'Quincaillerie', 'Peinture', 'Papier peint', 'Pierre', 'Bois', 'Métal']),
  generate_series(1, 11)
FROM companies
ON CONFLICT DO NOTHING;

-- Insert default budget post categories
INSERT INTO categories (company_id, type, name, position)
SELECT 
  id,
  'budget_post',
  unnest(ARRAY['Travaux de gros œuvre', 'Électricité', 'Plomberie', 'Menuiserie', 'Peinture', 'Revêtements sols', 'Revêtements muraux', 'Mobilier', 'Luminaires', 'Décoration', 'Honoraires', 'Divers']),
  generate_series(1, 12)
FROM companies
ON CONFLICT DO NOTHING;

-- Insert default acquisition source categories
INSERT INTO categories (company_id, type, name, position)
SELECT 
  id,
  'acquisition_source',
  unnest(ARRAY['Bouche à oreille', 'Site web', 'Réseaux sociaux', 'Partenaire', 'Salon professionnel', 'Ancien client', 'Google', 'Magazine', 'Autre']),
  generate_series(1, 9)
FROM companies
ON CONFLICT DO NOTHING;
