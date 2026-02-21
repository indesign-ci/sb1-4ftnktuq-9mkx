/*
  # Moodboards étendus, Portfolio, Portail client

  1. Moodboards
    - Colonnes ajoutées: theme, is_shared_with_client, share_token, share_expires_at,
      status, approved_at, approved_by, cover_image_url, created_by
    - color_palette en JSONB si besoin (existant peut être text[])
    - Table moodboard_items (éléments visuels avec positionnement)
    - Table moodboard_comments (commentaires client/équipe)

  2. Portfolio
    - Type property_type (enum)
    - Tables portfolio_entries, portfolio_images

  3. Portail client
    - Tables portal_messages, message_attachments, portal_activity_log

  4. Sécurité
    - RLS sur toutes les nouvelles tables
*/

-- ============================================================================
-- 1. EXTENSION UUID si nécessaire
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1b. Colonne company_id si manquante (requise pour RLS)
-- ============================================================================
-- clients
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'company_id') THEN
      ALTER TABLE clients ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
      UPDATE clients SET company_id = (SELECT id FROM companies LIMIT 1) WHERE company_id IS NULL;
    END IF;
  END IF;
END $$;

-- profiles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'company_id') THEN
      ALTER TABLE profiles ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
      UPDATE profiles SET company_id = (SELECT id FROM companies LIMIT 1) WHERE company_id IS NULL;
    END IF;
  END IF;
END $$;

-- projects
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'company_id') THEN
      ALTER TABLE projects ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
      UPDATE projects SET company_id = (SELECT id FROM companies LIMIT 1) WHERE company_id IS NULL;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 2. MOODBOARDS – colonnes manquantes
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'moodboards' AND column_name = 'theme') THEN
    ALTER TABLE moodboards ADD COLUMN theme TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'moodboards' AND column_name = 'is_shared_with_client') THEN
    ALTER TABLE moodboards ADD COLUMN is_shared_with_client BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'moodboards' AND column_name = 'share_token') THEN
    ALTER TABLE moodboards ADD COLUMN share_token TEXT UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'moodboards' AND column_name = 'share_expires_at') THEN
    ALTER TABLE moodboards ADD COLUMN share_expires_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'moodboards' AND column_name = 'status') THEN
    ALTER TABLE moodboards ADD COLUMN status TEXT DEFAULT 'brouillon';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'moodboards' AND column_name = 'approved_at') THEN
    ALTER TABLE moodboards ADD COLUMN approved_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'moodboards' AND column_name = 'approved_by') THEN
    ALTER TABLE moodboards ADD COLUMN approved_by TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'moodboards' AND column_name = 'cover_image_url') THEN
    ALTER TABLE moodboards ADD COLUMN cover_image_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'moodboards' AND column_name = 'created_by') THEN
    ALTER TABLE moodboards ADD COLUMN created_by UUID REFERENCES profiles(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'moodboards' AND column_name = 'deleted_at') THEN
    ALTER TABLE moodboards ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END $$;

-- color_palette en JSONB si actuellement en text[] (optionnel: on ne casse pas l'existant, on ajoute un commentaire)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'moodboards' AND column_name = 'color_palette') THEN
    IF (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'moodboards' AND column_name = 'color_palette') = 'ARRAY' THEN
      -- Garder text[] ou migrer: on ne change pas le type ici pour éviter erreurs; l'app peut accepter les deux
      NULL;
    END IF;
  ELSE
    ALTER TABLE moodboards ADD COLUMN color_palette JSONB;
  END IF;
END $$;

-- Index moodboards
CREATE INDEX IF NOT EXISTS idx_moodboards_project ON moodboards(project_id);
CREATE INDEX IF NOT EXISTS idx_moodboards_created_by ON moodboards(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_moodboards_share_token ON moodboards(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_moodboards_shared ON moodboards(is_shared_with_client) WHERE is_shared_with_client = true;
CREATE INDEX IF NOT EXISTS idx_moodboards_deleted ON moodboards(deleted_at) WHERE deleted_at IS NULL;

COMMENT ON TABLE moodboards IS 'Planches d''inspiration (moodboards) par projet avec partage client sécurisé';

-- ============================================================================
-- 3. MOODBOARD_ITEMS (référence materials si la table existe)
-- ============================================================================
CREATE TABLE IF NOT EXISTS moodboard_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moodboard_id UUID NOT NULL REFERENCES moodboards(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  position_x NUMERIC(8,2) DEFAULT 0,
  position_y NUMERIC(8,2) DEFAULT 0,
  width NUMERIC(8,2),
  height NUMERIC(8,2),
  rotation NUMERIC(5,2) DEFAULT 0,
  z_index INTEGER DEFAULT 0,
  title TEXT,
  annotation TEXT,
  material_id UUID,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE moodboard_items IS 'Éléments visuels composant chaque moodboard avec positionnement et annotations';

-- FK material_id si la table materials existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'materials') THEN
    ALTER TABLE moodboard_items
      ADD CONSTRAINT moodboard_items_material_id_fkey
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_moodboard_items_moodboard ON moodboard_items(moodboard_id);
CREATE INDEX IF NOT EXISTS idx_moodboard_items_material ON moodboard_items(material_id) WHERE material_id IS NOT NULL;

-- ============================================================================
-- 4. MOODBOARD_COMMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS moodboard_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moodboard_id UUID NOT NULL REFERENCES moodboards(id) ON DELETE CASCADE,
  moodboard_item_id UUID REFERENCES moodboard_items(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_user_id UUID REFERENCES profiles(id),
  author_client_id UUID REFERENCES clients(id),
  author_name TEXT,
  pin_x NUMERIC(8,2),
  pin_y NUMERIC(8,2),
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE moodboard_comments IS 'Commentaires et annotations sur les moodboards (échange client/architecte)';

CREATE INDEX IF NOT EXISTS idx_moodboard_comments_moodboard ON moodboard_comments(moodboard_id);
CREATE INDEX IF NOT EXISTS idx_moodboard_comments_item ON moodboard_comments(moodboard_item_id) WHERE moodboard_item_id IS NOT NULL;

-- ============================================================================
-- 5. PORTFOLIO – type et tables
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_type') THEN
    CREATE TYPE property_type AS ENUM (
      'appartement', 'maison', 'bureau', 'commercial', 'autre'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS portfolio_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  style TEXT,
  property_type property_type,
  surface_m2 NUMERIC(10,2),
  location_city TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  cover_image_url TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE portfolio_entries IS 'Portfolio interne des projets réalisés pour référence et inspiration';

CREATE INDEX IF NOT EXISTS idx_portfolio_project ON portfolio_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_published ON portfolio_entries(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_portfolio_created_by ON portfolio_entries(created_by);

CREATE TABLE IF NOT EXISTS portfolio_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_entry_id UUID NOT NULL REFERENCES portfolio_entries(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  category TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE portfolio_images IS 'Images des entrées du portfolio';

CREATE INDEX IF NOT EXISTS idx_portfolio_images_entry ON portfolio_images(portfolio_entry_id);

-- ============================================================================
-- 6. PORTAIL CLIENT
-- ============================================================================
CREATE TABLE IF NOT EXISTS portal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender_user_id UUID REFERENCES profiles(id),
  sender_client_id UUID REFERENCES clients(id),
  sender_name TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  has_attachments BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE portal_messages IS 'Messagerie intégrée entre l''architecte et le client via le portail';

CREATE INDEX IF NOT EXISTS idx_portal_messages_project ON portal_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_portal_messages_client ON portal_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_portal_messages_sender_user ON portal_messages(sender_user_id) WHERE sender_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_portal_messages_sender_client ON portal_messages(sender_client_id) WHERE sender_client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_portal_messages_read ON portal_messages(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_portal_messages_created ON portal_messages(created_at DESC);

CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES portal_messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE message_attachments IS 'Pièces jointes aux messages du portail client';

CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON message_attachments(message_id);

CREATE TABLE IF NOT EXISTS portal_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  portal_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE portal_activity_log IS 'Journal d''activité des clients sur le portail';

CREATE INDEX IF NOT EXISTS idx_portal_activity_client ON portal_activity_log(client_id);
CREATE INDEX IF NOT EXISTS idx_portal_activity_date ON portal_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portal_activity_action ON portal_activity_log(action);

-- ============================================================================
-- 7. RLS – Nouvelles tables
-- ============================================================================
ALTER TABLE moodboard_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE moodboard_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_activity_log ENABLE ROW LEVEL SECURITY;

-- moodboard_items: accès via moodboard -> project -> company
DROP POLICY IF EXISTS "Users can view moodboard_items of company" ON moodboard_items;
CREATE POLICY "Users can view moodboard_items of company"
  ON moodboard_items FOR SELECT TO authenticated
  USING (
    moodboard_id IN (
      SELECT m.id FROM moodboards m
      JOIN projects p ON p.id = m.project_id
      WHERE p.company_id = get_user_company_id()
    )
  );
DROP POLICY IF EXISTS "Users can insert moodboard_items" ON moodboard_items;
CREATE POLICY "Users can insert moodboard_items"
  ON moodboard_items FOR INSERT TO authenticated
  WITH CHECK (
    moodboard_id IN (
      SELECT m.id FROM moodboards m
      JOIN projects p ON p.id = m.project_id
      WHERE p.company_id = get_user_company_id()
    )
  );
DROP POLICY IF EXISTS "Users can update moodboard_items" ON moodboard_items;
CREATE POLICY "Users can update moodboard_items"
  ON moodboard_items FOR UPDATE TO authenticated
  USING (
    moodboard_id IN (
      SELECT m.id FROM moodboards m
      JOIN projects p ON p.id = m.project_id
      WHERE p.company_id = get_user_company_id()
    )
  )
  WITH CHECK (
    moodboard_id IN (
      SELECT m.id FROM moodboards m
      JOIN projects p ON p.id = m.project_id
      WHERE p.company_id = get_user_company_id()
    )
  );
DROP POLICY IF EXISTS "Users can delete moodboard_items" ON moodboard_items;
CREATE POLICY "Users can delete moodboard_items"
  ON moodboard_items FOR DELETE TO authenticated
  USING (
    moodboard_id IN (
      SELECT m.id FROM moodboards m
      JOIN projects p ON p.id = m.project_id
      WHERE p.company_id = get_user_company_id()
    )
  );

-- moodboard_comments
DROP POLICY IF EXISTS "Users can view moodboard_comments of company" ON moodboard_comments;
CREATE POLICY "Users can view moodboard_comments of company"
  ON moodboard_comments FOR SELECT TO authenticated
  USING (
    moodboard_id IN (
      SELECT m.id FROM moodboards m
      JOIN projects p ON p.id = m.project_id
      WHERE p.company_id = get_user_company_id()
    )
  );
DROP POLICY IF EXISTS "Users can manage moodboard_comments" ON moodboard_comments;
CREATE POLICY "Users can manage moodboard_comments"
  ON moodboard_comments FOR ALL TO authenticated
  USING (
    moodboard_id IN (
      SELECT m.id FROM moodboards m
      JOIN projects p ON p.id = m.project_id
      WHERE p.company_id = get_user_company_id()
    )
  )
  WITH CHECK (
    moodboard_id IN (
      SELECT m.id FROM moodboards m
      JOIN projects p ON p.id = m.project_id
      WHERE p.company_id = get_user_company_id()
    )
  );

-- portfolio_entries: par company via created_by -> profiles
DROP POLICY IF EXISTS "Users can view portfolio of company" ON portfolio_entries;
CREATE POLICY "Users can view portfolio of company"
  ON portfolio_entries FOR SELECT TO authenticated
  USING (get_user_company_id() IN (SELECT company_id FROM profiles WHERE id = created_by));
DROP POLICY IF EXISTS "Users can insert portfolio" ON portfolio_entries;
CREATE POLICY "Users can insert portfolio"
  ON portfolio_entries FOR INSERT TO authenticated
  WITH CHECK (get_user_company_id() IN (SELECT company_id FROM profiles WHERE id = created_by));
DROP POLICY IF EXISTS "Users can update portfolio" ON portfolio_entries;
CREATE POLICY "Users can update portfolio"
  ON portfolio_entries FOR UPDATE TO authenticated
  USING (get_user_company_id() IN (SELECT company_id FROM profiles WHERE id = created_by))
  WITH CHECK (get_user_company_id() IN (SELECT company_id FROM profiles WHERE id = created_by));
DROP POLICY IF EXISTS "Users can delete portfolio" ON portfolio_entries;
CREATE POLICY "Users can delete portfolio"
  ON portfolio_entries FOR DELETE TO authenticated
  USING (get_user_company_id() IN (SELECT company_id FROM profiles WHERE id = created_by));

-- portfolio_images: via portfolio_entry
DROP POLICY IF EXISTS "Users can view portfolio_images" ON portfolio_images;
CREATE POLICY "Users can view portfolio_images"
  ON portfolio_images FOR SELECT TO authenticated
  USING (
    portfolio_entry_id IN (
      SELECT id FROM portfolio_entries
      WHERE get_user_company_id() IN (SELECT company_id FROM profiles WHERE id = created_by)
    )
  );
DROP POLICY IF EXISTS "Users can manage portfolio_images" ON portfolio_images;
CREATE POLICY "Users can manage portfolio_images"
  ON portfolio_images FOR ALL TO authenticated
  USING (
    portfolio_entry_id IN (
      SELECT id FROM portfolio_entries
      WHERE get_user_company_id() IN (SELECT company_id FROM profiles WHERE id = created_by)
    )
  )
  WITH CHECK (
    portfolio_entry_id IN (
      SELECT id FROM portfolio_entries
      WHERE get_user_company_id() IN (SELECT company_id FROM profiles WHERE id = created_by)
    )
  );

-- portal_messages: par project -> company
DROP POLICY IF EXISTS "Users can view portal_messages" ON portal_messages;
CREATE POLICY "Users can view portal_messages"
  ON portal_messages FOR SELECT TO authenticated
  USING (
    project_id IN (SELECT id FROM projects WHERE company_id = get_user_company_id())
  );
DROP POLICY IF EXISTS "Users can manage portal_messages" ON portal_messages;
CREATE POLICY "Users can manage portal_messages"
  ON portal_messages FOR ALL TO authenticated
  USING (
    project_id IN (SELECT id FROM projects WHERE company_id = get_user_company_id())
  )
  WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE company_id = get_user_company_id())
  );

-- message_attachments: via message -> project
DROP POLICY IF EXISTS "Users can view message_attachments" ON message_attachments;
CREATE POLICY "Users can view message_attachments"
  ON message_attachments FOR SELECT TO authenticated
  USING (
    message_id IN (
      SELECT id FROM portal_messages
      WHERE project_id IN (SELECT id FROM projects WHERE company_id = get_user_company_id())
    )
  );
DROP POLICY IF EXISTS "Users can manage message_attachments" ON message_attachments;
CREATE POLICY "Users can manage message_attachments"
  ON message_attachments FOR ALL TO authenticated
  USING (
    message_id IN (
      SELECT id FROM portal_messages
      WHERE project_id IN (SELECT id FROM projects WHERE company_id = get_user_company_id())
    )
  )
  WITH CHECK (
    message_id IN (
      SELECT id FROM portal_messages
      WHERE project_id IN (SELECT id FROM projects WHERE company_id = get_user_company_id())
    )
  );

-- portal_activity_log: par client -> company
DROP POLICY IF EXISTS "Users can view portal_activity_log" ON portal_activity_log;
CREATE POLICY "Users can view portal_activity_log"
  ON portal_activity_log FOR SELECT TO authenticated
  USING (
    client_id IN (SELECT id FROM clients WHERE company_id = get_user_company_id())
  );
DROP POLICY IF EXISTS "Users can insert portal_activity_log" ON portal_activity_log;
CREATE POLICY "Users can insert portal_activity_log"
  ON portal_activity_log FOR INSERT TO authenticated
  WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE company_id = get_user_company_id())
  );
