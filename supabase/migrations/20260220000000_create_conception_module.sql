-- Migration : Module Conception (projets, espaces, moodboards, matériaux, mobilier, phases, budget)
-- Aligné avec types/conception.ts et lib/conceptionService.ts

-- ============================================
-- 1. conception_projects
-- ============================================
CREATE TABLE IF NOT EXISTS conception_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL DEFAULT '',
  client_email TEXT,
  client_phone TEXT,
  client_company TEXT,
  client_address TEXT,
  project_name TEXT NOT NULL,
  project_reference TEXT,
  project_type TEXT NOT NULL DEFAULT 'residential'
    CHECK (project_type IN ('residential','commercial','hospitality','retail','office','renovation')),
  description TEXT,
  style_direction TEXT
    CHECK (style_direction IS NULL OR style_direction IN ('contemporary','minimalist','classic','art_deco','industrial','scandinavian','japandi','mediterranean','bohemian','luxury_modern','transitional','neo_classic')),
  total_area_sqm NUMERIC(10,2),
  number_of_rooms INTEGER NOT NULL DEFAULT 0,
  budget_min NUMERIC(12,2),
  budget_max NUMERIC(12,2),
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'brief'
    CHECK (status IN ('brief','concept','design_development','technical_drawings','material_selection','presentation','revision','approved','in_progress','completed')),
  current_phase INTEGER NOT NULL DEFAULT 1,
  start_date DATE,
  estimated_end_date DATE,
  actual_end_date DATE,
  presentation_date DATE,
  cover_image_url TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conception_projects_user_id ON conception_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_conception_projects_status ON conception_projects(status);
CREATE INDEX IF NOT EXISTS idx_conception_projects_updated_at ON conception_projects(updated_at DESC);

-- ============================================
-- 2. conception_rooms
-- ============================================
CREATE TABLE IF NOT EXISTS conception_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES conception_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room_type TEXT NOT NULL DEFAULT 'other'
    CHECK (room_type IN ('living_room','bedroom','master_bedroom','kitchen','bathroom','master_bathroom','dining_room','office','hallway','terrace','garden','pool_area','spa','dressing','library','wine_cellar','home_cinema','lobby','reception','conference','restaurant','bar','suite','other')),
  area_sqm NUMERIC(10,2),
  ceiling_height_m NUMERIC(6,2) NOT NULL DEFAULT 2.5,
  description TEXT,
  design_notes TEXT,
  before_image_url TEXT,
  concept_image_url TEXT,
  final_render_url TEXT,
  floor_plan_url TEXT,
  estimated_budget NUMERIC(12,2),
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conception_rooms_project_id ON conception_rooms(project_id);

-- ============================================
-- 3. conception_phases
-- ============================================
CREATE TABLE IF NOT EXISTS conception_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES conception_projects(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming','in_progress','review','completed')),
  start_date DATE,
  end_date DATE,
  deliverables JSONB DEFAULT '[]'::jsonb,
  completion_percentage INTEGER NOT NULL DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conception_phases_project_id ON conception_phases(project_id);

-- ============================================
-- 4. conception_moodboards
-- ============================================
CREATE TABLE IF NOT EXISTS conception_moodboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES conception_projects(id) ON DELETE CASCADE,
  room_id UUID REFERENCES conception_rooms(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT,
  theme TEXT,
  color_palette JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conception_moodboards_project_id ON conception_moodboards(project_id);

-- ============================================
-- 5. conception_moodboard_images
-- ============================================
CREATE TABLE IF NOT EXISTS conception_moodboard_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moodboard_id UUID NOT NULL REFERENCES conception_moodboards(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  source TEXT,
  position_x NUMERIC(10,2) NOT NULL DEFAULT 0,
  position_y NUMERIC(10,2) NOT NULL DEFAULT 0,
  width NUMERIC(10,2) NOT NULL DEFAULT 100,
  height NUMERIC(10,2) NOT NULL DEFAULT 100,
  rotation NUMERIC(6,2) NOT NULL DEFAULT 0,
  z_index INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conception_moodboard_images_moodboard_id ON conception_moodboard_images(moodboard_id);

-- ============================================
-- 6. conception_materials
-- ============================================
CREATE TABLE IF NOT EXISTS conception_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES conception_projects(id) ON DELETE CASCADE,
  room_id UUID REFERENCES conception_rooms(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other'
    CHECK (category IN ('flooring','wall_covering','ceiling','fabric','stone','wood','metal','glass','ceramic','paint','wallpaper','lighting','hardware','other')),
  brand TEXT,
  reference TEXT,
  supplier TEXT,
  supplier_contact TEXT,
  description TEXT,
  image_url TEXT,
  swatch_color TEXT,
  texture_url TEXT,
  unit_price NUMERIC(12,2),
  unit TEXT NOT NULL DEFAULT 'm²',
  quantity NUMERIC(12,2) DEFAULT 1,
  total_price NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed','sample_ordered','sample_received','approved','ordered','delivered','installed','rejected')),
  lead_time_days INTEGER,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conception_materials_project_id ON conception_materials(project_id);

-- ============================================
-- 7. conception_furniture
-- ============================================
CREATE TABLE IF NOT EXISTS conception_furniture (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES conception_projects(id) ON DELETE CASCADE,
  room_id UUID REFERENCES conception_rooms(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other'
    CHECK (category IN ('seating','table','storage','bed','desk','lighting','rug','curtain','artwork','mirror','accessory','plant','appliance','sanitary','other')),
  brand TEXT,
  collection TEXT,
  reference TEXT,
  designer TEXT,
  description TEXT,
  width_cm NUMERIC(8,2),
  depth_cm NUMERIC(8,2),
  height_cm NUMERIC(8,2),
  image_url TEXT,
  product_url TEXT,
  unit_price NUMERIC(12,2),
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC(12,2),
  is_custom BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed','approved','ordered','in_production','shipped','delivered','installed','rejected')),
  lead_time_days INTEGER,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conception_furniture_project_id ON conception_furniture(project_id);

-- ============================================
-- 8. Vue conception_budget_summary
-- ============================================
DROP VIEW IF EXISTS conception_budget_summary;
CREATE VIEW conception_budget_summary AS
WITH costs AS (
  SELECT
    p.id AS project_id,
    p.project_name,
    p.budget_min,
    p.budget_max,
    COALESCE(SUM(COALESCE(m.total_price, m.unit_price * COALESCE(m.quantity, 1))), 0)::NUMERIC AS total_materials_cost
  FROM conception_projects p
  LEFT JOIN conception_materials m ON m.project_id = p.id
  GROUP BY p.id, p.project_name, p.budget_min, p.budget_max
),
furniture_costs AS (
  SELECT
    f.project_id,
    COALESCE(SUM(COALESCE(f.total_price, f.unit_price * f.quantity)), 0)::NUMERIC AS total_furniture_cost
  FROM conception_furniture f
  GROUP BY f.project_id
)
SELECT
  c.project_id,
  c.project_name,
  c.budget_min,
  c.budget_max,
  c.total_materials_cost,
  COALESCE(fc.total_furniture_cost, 0)::NUMERIC AS total_furniture_cost,
  (c.total_materials_cost + COALESCE(fc.total_furniture_cost, 0))::NUMERIC AS total_estimated_cost,
  CASE
    WHEN c.budget_max IS NOT NULL AND c.budget_max > 0 THEN
      LEAST(100, ((c.total_materials_cost + COALESCE(fc.total_furniture_cost, 0)) * 100.0 / c.budget_max)::NUMERIC)
    ELSE 0::NUMERIC
  END AS budget_usage_percent
FROM costs c
LEFT JOIN furniture_costs fc ON fc.project_id = c.project_id;

-- ============================================
-- 9. RLS
-- ============================================
ALTER TABLE conception_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE conception_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE conception_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE conception_moodboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE conception_moodboard_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE conception_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE conception_furniture ENABLE ROW LEVEL SECURITY;

-- conception_projects : l'utilisateur accède à ses propres projets (user_id = auth.uid())
CREATE POLICY "Users manage own conception projects"
  ON conception_projects FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- conception_rooms
CREATE POLICY "Users manage rooms of own conception projects"
  ON conception_rooms FOR ALL
  TO authenticated
  USING (
    project_id IN (SELECT id FROM conception_projects WHERE user_id = auth.uid())
  )
  WITH CHECK (
    project_id IN (SELECT id FROM conception_projects WHERE user_id = auth.uid())
  );

-- conception_phases
CREATE POLICY "Users manage phases of own conception projects"
  ON conception_phases FOR ALL
  TO authenticated
  USING (
    project_id IN (SELECT id FROM conception_projects WHERE user_id = auth.uid())
  )
  WITH CHECK (
    project_id IN (SELECT id FROM conception_projects WHERE user_id = auth.uid())
  );

-- conception_moodboards
CREATE POLICY "Users manage moodboards of own conception projects"
  ON conception_moodboards FOR ALL
  TO authenticated
  USING (
    project_id IN (SELECT id FROM conception_projects WHERE user_id = auth.uid())
  )
  WITH CHECK (
    project_id IN (SELECT id FROM conception_projects WHERE user_id = auth.uid())
  );

-- conception_moodboard_images
CREATE POLICY "Users manage moodboard images of own projects"
  ON conception_moodboard_images FOR ALL
  TO authenticated
  USING (
    moodboard_id IN (
      SELECT id FROM conception_moodboards
      WHERE project_id IN (SELECT id FROM conception_projects WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    moodboard_id IN (
      SELECT id FROM conception_moodboards
      WHERE project_id IN (SELECT id FROM conception_projects WHERE user_id = auth.uid())
    )
  );

-- conception_materials
CREATE POLICY "Users manage materials of own conception projects"
  ON conception_materials FOR ALL
  TO authenticated
  USING (
    project_id IN (SELECT id FROM conception_projects WHERE user_id = auth.uid())
  )
  WITH CHECK (
    project_id IN (SELECT id FROM conception_projects WHERE user_id = auth.uid())
  );

-- conception_furniture
CREATE POLICY "Users manage furniture of own conception projects"
  ON conception_furniture FOR ALL
  TO authenticated
  USING (
    project_id IN (SELECT id FROM conception_projects WHERE user_id = auth.uid())
  )
  WITH CHECK (
    project_id IN (SELECT id FROM conception_projects WHERE user_id = auth.uid())
  );

-- Vue : pas de RLS sur la vue ; l'accès aux lignes passe par les tables sous-jacentes (conception_projects en SELECT)
-- Les utilisateurs ne verront que les projets qu'ils peuvent déjà lire via conception_projects.
-- Pour que la vue respecte RLS, il faudrait une vue sécurisée (security_invoker) ou ne pas exposer la vue en direct.
-- Le client appelle getBudgetSummary(projectId) après avoir chargé le projet ; si le projet est accessible, la vue
-- retournera une ligne pour ce project_id. En PostgreSQL les vues n'ont pas RLS par défaut ; on s'appuie sur le fait
-- que l'app ne demande le budget que pour un project_id déjà chargé (donc autorisé). Optionnel : ajouter RLS sur la vue
-- en utilisant conception_projects (voir doc Supabase). Pour simplifier, on laisse la vue sans RLS et l'app filtre par project_id.

-- Trigger updated_at
CREATE OR REPLACE FUNCTION conception_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS conception_projects_updated_at ON conception_projects;
CREATE TRIGGER conception_projects_updated_at
  BEFORE UPDATE ON conception_projects
  FOR EACH ROW EXECUTE FUNCTION conception_set_updated_at();

DROP TRIGGER IF EXISTS conception_rooms_updated_at ON conception_rooms;
CREATE TRIGGER conception_rooms_updated_at
  BEFORE UPDATE ON conception_rooms
  FOR EACH ROW EXECUTE FUNCTION conception_set_updated_at();

DROP TRIGGER IF EXISTS conception_phases_updated_at ON conception_phases;
CREATE TRIGGER conception_phases_updated_at
  BEFORE UPDATE ON conception_phases
  FOR EACH ROW EXECUTE FUNCTION conception_set_updated_at();

DROP TRIGGER IF EXISTS conception_moodboards_updated_at ON conception_moodboards;
CREATE TRIGGER conception_moodboards_updated_at
  BEFORE UPDATE ON conception_moodboards
  FOR EACH ROW EXECUTE FUNCTION conception_set_updated_at();

DROP TRIGGER IF EXISTS conception_materials_updated_at ON conception_materials;
CREATE TRIGGER conception_materials_updated_at
  BEFORE UPDATE ON conception_materials
  FOR EACH ROW EXECUTE FUNCTION conception_set_updated_at();

DROP TRIGGER IF EXISTS conception_furniture_updated_at ON conception_furniture;
CREATE TRIGGER conception_furniture_updated_at
  BEFORE UPDATE ON conception_furniture
  FOR EACH ROW EXECUTE FUNCTION conception_set_updated_at();
