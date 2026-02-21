/*
  # Documents étendus, Paramètres, Audit, RBAC

  Sections 9–12 du schéma cible (portail client déjà en place en 20260217100000).

  1. Section 9 – Documents & fichiers
    - Type document_category
    - Table documents (CREATE si absente, sinon colonnes manquantes ajoutées)

  2. Section 10 – Notifications
    - Colonnes optionnelles ajoutées si manquantes (resource_type, resource_id, action_url)

  3. Section 11 – Paramètres
    - company_settings (par entreprise)
    - email_templates (global)

  4. Section 12 – Audit
    - Type user_role
    - Table audit_log

  5. RBAC
    - role_permissions
    - numbering_counters

  6. Données par défaut
    - company_settings (1 ligne par company existante si vide)
    - numbering_counters
    - email_templates
*/

-- ============================================================================
-- ENUMS
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_category') THEN
    CREATE TYPE document_category AS ENUM (
      'devis', 'facture', 'contrat', 'plan', 'photo', 'cahier_charges', 'pv', 'doe', 'autre'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'architecte', 'assistant', 'comptable', 'client');
  END IF;
END $$;

-- ============================================================================
-- 9. DOCUMENTS & FICHIERS
-- ============================================================================
-- Créer la table documents uniquement si elle n'existe pas (éviter d'écraser l'existant)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'autre',
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  file_extension TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  parent_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  is_latest_version BOOLEAN DEFAULT true,
  requires_signature BOOLEAN DEFAULT false,
  is_signed BOOLEAN DEFAULT false,
  signed_at TIMESTAMPTZ,
  signed_by TEXT,
  signature_data JSONB,
  is_shared_with_client BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  share_expires_at TIMESTAMPTZ,
  tags TEXT[],
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'company_id') THEN
      ALTER TABLE documents ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'quote_id') THEN
      ALTER TABLE documents ADD COLUMN quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'invoice_id') THEN
      ALTER TABLE documents ADD COLUMN invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'description') THEN
      ALTER TABLE documents ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'file_name') THEN
      ALTER TABLE documents ADD COLUMN file_name TEXT;
      UPDATE documents SET file_name = name WHERE file_name IS NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'file_extension') THEN
      ALTER TABLE documents ADD COLUMN file_extension TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'version') THEN
      ALTER TABLE documents ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'parent_document_id') THEN
      ALTER TABLE documents ADD COLUMN parent_document_id UUID REFERENCES documents(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'is_latest_version') THEN
      ALTER TABLE documents ADD COLUMN is_latest_version BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'requires_signature') THEN
      ALTER TABLE documents ADD COLUMN requires_signature BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'is_signed') THEN
      ALTER TABLE documents ADD COLUMN is_signed BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'signed_at') THEN
      ALTER TABLE documents ADD COLUMN signed_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'signed_by') THEN
      ALTER TABLE documents ADD COLUMN signed_by TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'signature_data') THEN
      ALTER TABLE documents ADD COLUMN signature_data JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'is_shared_with_client') THEN
      ALTER TABLE documents ADD COLUMN is_shared_with_client BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'share_token') THEN
      ALTER TABLE documents ADD COLUMN share_token TEXT UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'share_expires_at') THEN
      ALTER TABLE documents ADD COLUMN share_expires_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'tags') THEN
      ALTER TABLE documents ADD COLUMN tags TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'deleted_at') THEN
      ALTER TABLE documents ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'uploaded_by') THEN
      ALTER TABLE documents ADD COLUMN uploaded_by UUID REFERENCES profiles(id);
    END IF;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_client ON documents(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_quote ON documents(quote_id) WHERE quote_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_invoice ON documents(invoice_id) WHERE invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_parent ON documents(parent_document_id) WHERE parent_document_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_latest ON documents(is_latest_version) WHERE is_latest_version = true;
CREATE INDEX IF NOT EXISTS idx_documents_shared ON documents(is_shared_with_client) WHERE is_shared_with_client = true;
CREATE INDEX IF NOT EXISTS idx_documents_share_token ON documents(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_deleted ON documents(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- 10. NOTIFICATIONS – colonnes optionnelles
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'resource_type') THEN
      ALTER TABLE notifications ADD COLUMN resource_type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'resource_id') THEN
      ALTER TABLE notifications ADD COLUMN resource_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'action_url') THEN
      ALTER TABLE notifications ADD COLUMN action_url TEXT;
    END IF;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- 11. PARAMÈTRES & CONFIGURATION
-- ============================================================================
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT NOT NULL,
  legal_form TEXT,
  siret TEXT,
  vat_number TEXT,
  rcs TEXT,
  ape_code TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'France',
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#1F2937',
  secondary_color TEXT DEFAULT '#3B82F6',
  bank_name TEXT,
  iban TEXT,
  bic TEXT,
  quote_terms TEXT,
  invoice_terms TEXT,
  late_penalty_text TEXT,
  quote_prefix TEXT DEFAULT 'DEV',
  invoice_prefix TEXT DEFAULT 'FACT',
  project_prefix TEXT DEFAULT 'PROJ',
  default_tva_rate NUMERIC(5,2) DEFAULT 20.00,
  email_signature TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE company_settings IS 'Paramètres globaux par entreprise (identité, branding, mentions légales)';

CREATE INDEX IF NOT EXISTS idx_company_settings_company ON company_settings(company_id);

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables TEXT[],
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE email_templates IS 'Modèles d''emails personnalisables (globaux)';

CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active) WHERE is_active = true;

-- ============================================================================
-- 12. AUDIT LOG
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role user_role,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_log IS 'Journal d''audit pour traçabilité des modifications';

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_date ON audit_log(created_at DESC);

-- ============================================================================
-- RBAC – role_permissions & numbering_counters
-- ============================================================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  is_allowed BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(role, resource, action)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_resource ON role_permissions(resource);

CREATE TABLE IF NOT EXISTS numbering_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  counter_type TEXT NOT NULL,
  year INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  prefix TEXT,
  UNIQUE(company_id, counter_type, year)
);

CREATE INDEX IF NOT EXISTS idx_numbering_counters_company ON numbering_counters(company_id);
CREATE INDEX IF NOT EXISTS idx_numbering_counters_type_year ON numbering_counters(counter_type, year);

-- ============================================================================
-- DONNÉES PAR DÉFAUT
-- ============================================================================
-- Un enregistrement company_settings par entreprise (depuis companies)
INSERT INTO company_settings (company_id, company_name, quote_prefix, invoice_prefix, project_prefix, default_tva_rate)
SELECT c.id, c.name, 'DEV', 'FACT', 'PROJ', 20.00
FROM companies c
WHERE NOT EXISTS (SELECT 1 FROM company_settings cs WHERE cs.company_id = c.id)
ON CONFLICT DO NOTHING;

-- Compteurs de numérotation (par entreprise et année en cours)
INSERT INTO numbering_counters (company_id, counter_type, year, last_number, prefix)
SELECT c.id, ct.counter_type, EXTRACT(YEAR FROM NOW())::INTEGER, 0, ct.prefix
FROM companies c
CROSS JOIN (VALUES ('quote', 'DEV'), ('invoice', 'FACT'), ('project', 'PROJ')) AS ct(counter_type, prefix)
WHERE NOT EXISTS (
  SELECT 1 FROM numbering_counters nc
  WHERE nc.company_id = c.id AND nc.counter_type = ct.counter_type AND nc.year = EXTRACT(YEAR FROM NOW())::INTEGER
);

-- Modèles d'emails par défaut (ignorer si déjà présents)
INSERT INTO email_templates (name, subject, body_html, variables, category) VALUES
(
  'devis_envoi',
  'Votre devis {{quote_number}} - {{company_name}}',
  '<p>Bonjour {{client_name}},</p><p>Veuillez trouver ci-joint votre devis n°{{quote_number}} d''un montant de {{total_ttc}} € TTC.</p><p>Ce devis est valable jusqu''au {{validity_date}}.</p><p>Cordialement,<br/>{{sender_name}}</p>',
  ARRAY['quote_number', 'client_name', 'total_ttc', 'validity_date', 'sender_name', 'company_name'],
  'devis'
),
(
  'facture_envoi',
  'Votre facture {{invoice_number}} - {{company_name}}',
  '<p>Bonjour {{client_name}},</p><p>Veuillez trouver ci-joint votre facture n°{{invoice_number}} d''un montant de {{total_ttc}} € TTC.</p><p>Date d''échéance : {{due_date}}</p><p>Cordialement,<br/>{{sender_name}}</p>',
  ARRAY['invoice_number', 'client_name', 'total_ttc', 'due_date', 'sender_name', 'company_name'],
  'facture'
),
(
  'relance_facture',
  'Relance - Facture {{invoice_number}} échue - {{company_name}}',
  '<p>Bonjour {{client_name}},</p><p>Sauf erreur de notre part, la facture n°{{invoice_number}} d''un montant de {{amount_due}} € reste impayée à ce jour.</p><p>Nous vous remercions de bien vouloir procéder au règlement dans les meilleurs délais.</p><p>Cordialement,<br/>{{sender_name}}</p>',
  ARRAY['invoice_number', 'client_name', 'amount_due', 'due_date', 'sender_name', 'company_name'],
  'relance'
),
(
  'portail_bienvenue',
  'Bienvenue sur votre espace client - {{company_name}}',
  '<p>Bonjour {{client_name}},</p><p>Votre espace client est désormais accessible. Vous pouvez suivre l''avancement de votre projet, consulter vos devis et factures, et échanger avec votre architecte.</p><p>Connectez-vous ici : {{portal_url}}</p><p>Cordialement,<br/>{{sender_name}}</p>',
  ARRAY['client_name', 'portal_url', 'sender_name', 'company_name'],
  'portail'
),
(
  'rdv_confirmation',
  'Confirmation de rendez-vous - {{company_name}}',
  '<p>Bonjour {{client_name}},</p><p>Nous vous confirmons votre rendez-vous le {{event_date}} à {{event_time}}.</p><p>Lieu : {{event_location}}</p><p>Cordialement,<br/>{{sender_name}}</p>',
  ARRAY['client_name', 'event_date', 'event_time', 'event_location', 'sender_name', 'company_name'],
  'rdv'
)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- INSERTION PERMISSIONS RBAC PAR DÉFAUT
-- ============================================================================
INSERT INTO role_permissions (role, resource, action, is_allowed)
SELECT 'admin', r.resource, a.action, true
FROM
  (VALUES ('clients'), ('projects'), ('quotes'), ('invoices'), ('payments'),
          ('materials'), ('suppliers'), ('documents'), ('calendar_events'),
          ('moodboards'), ('portal_messages'), ('notifications'), ('settings'),
          ('profiles'), ('tags'), ('portfolio'), ('tasks'), ('budget')) AS r(resource),
  (VALUES ('create'), ('read'), ('update'), ('delete')) AS a(action)
ON CONFLICT (role, resource, action) DO NOTHING;

INSERT INTO role_permissions (role, resource, action, is_allowed)
SELECT 'architecte', r.resource, a.action, true
FROM
  (VALUES ('clients'), ('projects'), ('quotes'), ('invoices'), ('payments'),
          ('materials'), ('suppliers'), ('documents'), ('calendar_events'),
          ('moodboards'), ('portal_messages'), ('notifications'),
          ('tags'), ('portfolio'), ('tasks'), ('budget')) AS r(resource),
  (VALUES ('create'), ('read'), ('update'), ('delete')) AS a(action)
ON CONFLICT (role, resource, action) DO NOTHING;

INSERT INTO role_permissions (role, resource, action, is_allowed)
VALUES
  ('architecte', 'settings', 'read', true),
  ('architecte', 'profiles', 'read', true),
  ('architecte', 'profiles', 'update', true)
ON CONFLICT (role, resource, action) DO NOTHING;

INSERT INTO role_permissions (role, resource, action, is_allowed)
SELECT 'assistant', r.resource, 'read', true
FROM
  (VALUES ('clients'), ('projects'), ('quotes'), ('invoices'), ('payments'),
          ('materials'), ('suppliers'), ('documents'), ('calendar_events'),
          ('moodboards'), ('portal_messages'), ('notifications'),
          ('tags'), ('portfolio'), ('tasks'), ('budget'), ('settings'), ('profiles')) AS r(resource)
ON CONFLICT (role, resource, action) DO NOTHING;

INSERT INTO role_permissions (role, resource, action, is_allowed)
VALUES
  ('assistant', 'calendar_events', 'create', true),
  ('assistant', 'calendar_events', 'update', true),
  ('assistant', 'calendar_events', 'delete', true),
  ('assistant', 'documents', 'create', true),
  ('assistant', 'documents', 'update', true),
  ('assistant', 'documents', 'delete', true),
  ('assistant', 'portal_messages', 'create', true),
  ('assistant', 'portal_messages', 'update', true),
  ('assistant', 'tasks', 'update', true),
  ('assistant', 'clients', 'create', true),
  ('assistant', 'clients', 'update', true)
ON CONFLICT (role, resource, action) DO NOTHING;

INSERT INTO role_permissions (role, resource, action, is_allowed)
SELECT 'comptable', r.resource, a.action, true
FROM (VALUES ('quotes'), ('invoices'), ('payments')) AS r(resource),
     (VALUES ('create'), ('read'), ('update'), ('delete')) AS a(action)
ON CONFLICT (role, resource, action) DO NOTHING;

INSERT INTO role_permissions (role, resource, action, is_allowed)
SELECT 'comptable', r.resource, 'read', true
FROM (VALUES ('clients'), ('projects'), ('materials'), ('suppliers'),
             ('documents'), ('settings'), ('profiles')) AS r(resource)
ON CONFLICT (role, resource, action) DO NOTHING;
