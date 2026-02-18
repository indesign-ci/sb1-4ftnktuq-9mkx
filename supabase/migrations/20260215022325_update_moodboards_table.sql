/*
  # Update Moodboards Table

  1. Changes
    - Add company_id column to moodboards table
    - Add name column (keeping title for backwards compatibility)
    - Add images array column for storing image URLs
    - Add color_palette array column
    - Make project_id nullable
    - Add description column if not exists
    
  2. Security
    - Update RLS policies for company-based access
*/

-- Add company_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'moodboards' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE moodboards ADD COLUMN company_id uuid REFERENCES companies(id);
  END IF;
END $$;

-- Add name column (same as title for now)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'moodboards' AND column_name = 'name'
  ) THEN
    ALTER TABLE moodboards ADD COLUMN name text;
    -- Copy title to name for existing records
    UPDATE moodboards SET name = title WHERE name IS NULL;
  END IF;
END $$;

-- Add images array
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'moodboards' AND column_name = 'images'
  ) THEN
    ALTER TABLE moodboards ADD COLUMN images text[] DEFAULT '{}';
  END IF;
END $$;

-- Add color_palette array
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'moodboards' AND column_name = 'color_palette'
  ) THEN
    ALTER TABLE moodboards ADD COLUMN color_palette text[] DEFAULT '{}';
  END IF;
END $$;

-- Make project_id nullable
ALTER TABLE moodboards ALTER COLUMN project_id DROP NOT NULL;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view moodboards" ON moodboards;
DROP POLICY IF EXISTS "Users can create moodboards" ON moodboards;
DROP POLICY IF EXISTS "Users can update moodboards" ON moodboards;
DROP POLICY IF EXISTS "Users can delete moodboards" ON moodboards;

-- Create new RLS policies based on company_id
CREATE POLICY "Users can view company moodboards"
  ON moodboards
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create moodboards"
  ON moodboards
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update company moodboards"
  ON moodboards
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

CREATE POLICY "Users can delete company moodboards"
  ON moodboards
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
