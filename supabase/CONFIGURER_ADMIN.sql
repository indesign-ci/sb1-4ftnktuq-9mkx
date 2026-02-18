-- ============================================================
-- Bootstrap + Configurer Admin (contactindesignci@gmail.com)
-- ============================================================
-- Crée les tables manquantes puis configure votre compte admin.
-- Exécutez dans : Supabase > SQL Editor > New query
-- ============================================================

-- 1. Créer la table companies si elle n'existe pas
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone text,
  email text,
  primary_color text DEFAULT '#C5A572',
  postal_code text,
  city text,
  payment_terms text,
  deposit_percent numeric DEFAULT 30,
  quote_legal_mentions text,
  invoice_legal_mentions text,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Créer la table profiles si elle n'existe pas (ou ajouter colonnes manquantes)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  first_name text,
  last_name text,
  email text,
  role text,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ajouter company_id, role si la table existait déjà (structure minimal Supabase)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'company_id') THEN
    ALTER TABLE profiles ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE profiles ADD COLUMN role text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_active') THEN
    ALTER TABLE profiles ADD COLUMN is_active boolean DEFAULT true;
  END IF;
EXCEPTION
  WHEN duplicate_column THEN NULL;
  WHEN undefined_table THEN NULL;
END $$;

-- 3. Activer RLS sur companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for now" ON companies;
CREATE POLICY "Allow all for now" ON companies FOR ALL USING (true) WITH CHECK (true);

-- 4. Activer RLS sur profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 5. Insérer l'entreprise
INSERT INTO companies (id, name, address, phone, email, primary_color)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'INDESIGN PLUS PRO',
  'Adresse de votre entreprise',
  '+33 1 00 00 00 00',
  'contactindesignci@gmail.com',
  '#C5A572'
)
ON CONFLICT (id) DO NOTHING;

-- 6. Insérer ou mettre à jour le profil Admin
INSERT INTO profiles (id, company_id, first_name, last_name, email, role)
SELECT
  u.id,
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'Admin',
  '',
  'contactindesignci@gmail.com',
  'admin'
FROM auth.users u
WHERE u.email = 'contactindesignci@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  role = 'admin';
