/*
  # Create Professional Documents System

  1. New Tables
    - `professional_documents`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `created_by` (uuid, foreign key to auth.users)
      - `document_type` (text) - Type of document (visit_form, contract, etc.)
      - `document_phase` (text) - Phase 1-7
      - `document_number` (text) - Auto-generated number
      - `title` (text) - Document title
      - `client_id` (uuid, foreign key to clients)
      - `project_id` (uuid, foreign key to projects)
      - `status` (text) - draft, finalized, sent, signed, archived
      - `document_data` (jsonb) - All form fields stored as JSON
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `finalized_at` (timestamptz)
      - `sent_at` (timestamptz)
      - `signed_at` (timestamptz)
      - `notes` (text)

  2. Security
    - Enable RLS on `professional_documents` table
    - Add policies for authenticated users to manage documents in their company
*/

-- Create professional_documents table
CREATE TABLE IF NOT EXISTS professional_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  document_type text NOT NULL,
  document_phase text NOT NULL,
  document_number text NOT NULL,
  title text NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  status text DEFAULT 'draft' NOT NULL,
  document_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  finalized_at timestamptz,
  sent_at timestamptz,
  signed_at timestamptz,
  CONSTRAINT professional_documents_status_check CHECK (status IN ('draft', 'finalized', 'sent', 'signed', 'archived'))
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS professional_documents_company_id_idx ON professional_documents(company_id);
CREATE INDEX IF NOT EXISTS professional_documents_client_id_idx ON professional_documents(client_id);
CREATE INDEX IF NOT EXISTS professional_documents_project_id_idx ON professional_documents(project_id);
CREATE INDEX IF NOT EXISTS professional_documents_document_type_idx ON professional_documents(document_type);
CREATE INDEX IF NOT EXISTS professional_documents_status_idx ON professional_documents(status);
CREATE INDEX IF NOT EXISTS professional_documents_created_at_idx ON professional_documents(created_at DESC);

-- Enable RLS
ALTER TABLE professional_documents ENABLE ROW LEVEL SECURITY;

-- Policies for professional_documents
CREATE POLICY "Users can view documents in their company"
  ON professional_documents FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create documents in their company"
  ON professional_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update documents in their company"
  ON professional_documents FOR UPDATE
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

CREATE POLICY "Users can delete documents in their company"
  ON professional_documents FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_professional_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_professional_documents_updated_at
  BEFORE UPDATE ON professional_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_professional_documents_updated_at();