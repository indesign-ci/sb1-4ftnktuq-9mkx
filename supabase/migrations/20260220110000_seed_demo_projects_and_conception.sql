-- Seed : 3 projets (fiches clients) + phases/tâches + 1 projet Conception avec dossier de présentation (images fictives)
-- Dépend de : companies, clients (seed_demo_clients), profiles. À exécuter après création du premier utilisateur.

-- S'assurer que la table projects a toutes les colonnes utilisées par le seed et l'app
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'cover_image_url') THEN
      ALTER TABLE projects ADD COLUMN cover_image_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'current_phase') THEN
      ALTER TABLE projects ADD COLUMN current_phase TEXT DEFAULT 'brief';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'progress') THEN
      ALTER TABLE projects ADD COLUMN progress NUMERIC(5,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'address') THEN
      ALTER TABLE projects ADD COLUMN address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'city') THEN
      ALTER TABLE projects ADD COLUMN city TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'postal_code') THEN
      ALTER TABLE projects ADD COLUMN postal_code TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'property_type') THEN
      ALTER TABLE projects ADD COLUMN property_type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'surface_area') THEN
      ALTER TABLE projects ADD COLUMN surface_area NUMERIC(10,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'style') THEN
      ALTER TABLE projects ADD COLUMN style TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'budget_estimated') THEN
      ALTER TABLE projects ADD COLUMN budget_estimated NUMERIC(12,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'start_date') THEN
      ALTER TABLE projects ADD COLUMN start_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'deadline') THEN
      ALTER TABLE projects ADD COLUMN deadline DATE;
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  cid uuid;
  pid1 uuid := 'a2000001-0000-4000-8000-000000000001'::uuid;
  pid2 uuid := 'a2000002-0000-4000-8000-000000000002'::uuid;
  pid3 uuid := 'a2000003-0000-4000-8000-000000000003'::uuid;
  uid uuid;
  cproj_id uuid;
  croom_id uuid;
  cmood_id uuid;
  task_titles text[];
  i int;
  phase_keys text[] := ARRAY['brief','technical_visit','design','presentation','execution_plans','contractor_consultation','construction_monitoring','reception','photoshoot'];
  phase_names text[] := ARRAY[
    'Brief / Prise de contact',
    'Visite technique & Relevé de mesures',
    'Étude de conception (moodboard, plans)',
    'Présentation client & Validation',
    'Dossier technique / Plans d''exécution',
    'Consultation entreprises & Devis artisans',
    'Suivi de chantier',
    'Réception des travaux',
    'Shooting photo & Publication'
  ];
BEGIN
  SELECT id INTO cid FROM companies ORDER BY created_at LIMIT 1;
  IF cid IS NULL THEN
    RAISE NOTICE 'Aucune company trouvée. Skip seed projects.';
    RETURN;
  END IF;

  -- ========== 1. Projets principaux (1 par client démo) ==========
  INSERT INTO projects (
    id, company_id, client_id, name, status, cover_image_url,
    address, city, postal_code, property_type, surface_area, style,
    budget_estimated, start_date, deadline, current_phase, progress
  ) VALUES
    (pid1, cid, 'b1000001-0000-4000-8000-000000000001'::uuid,
     'Rénovation appartement Paris 11e', 'in_progress',
     'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
     '12 rue de la Roquette', 'Paris', '75011', 'Appartement', 65, 'Contemporain',
     85000, (current_date - 30), (current_date + 90), 'brief', 0),
    (pid2, cid, 'b1000002-0000-4000-8000-000000000002'::uuid,
     'Maison Lyon Confluence', 'in_progress',
     'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
     '12 quai Rambaud', 'Lyon', '69002', 'Maison', 120, 'Scandinave',
     180000, (current_date - 14), (current_date + 120), 'brief', 0),
    (pid3, cid, 'b1000003-0000-4000-8000-000000000003'::uuid,
     'Loft Bordeaux Chartrons', 'in_progress',
     'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800',
     '25 rue Notre-Dame', 'Bordeaux', '33000', 'Loft', 95, 'Industriel',
     120000, (current_date - 7), (current_date + 180), 'brief', 0)
  ON CONFLICT (id) DO NOTHING;

  -- ========== 2. Phases et tâches (uniquement si pas déjà créés) ==========
  FOR i IN 1..9 LOOP
    IF NOT EXISTS (SELECT 1 FROM project_phases WHERE project_id = pid1 AND order_number = i) THEN
      INSERT INTO project_phases (project_id, name, order_number, status)
      VALUES (pid1, phase_names[i], i, CASE WHEN i = 1 THEN 'in_progress' ELSE 'todo' END);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM project_phases WHERE project_id = pid2 AND order_number = i) THEN
      INSERT INTO project_phases (project_id, name, order_number, status)
      VALUES (pid2, phase_names[i], i, CASE WHEN i = 1 THEN 'in_progress' ELSE 'todo' END);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM project_phases WHERE project_id = pid3 AND order_number = i) THEN
      INSERT INTO project_phases (project_id, name, order_number, status)
      VALUES (pid3, phase_names[i], i, CASE WHEN i = 1 THEN 'in_progress' ELSE 'todo' END);
    END IF;
  END LOOP;

  -- Tâches par phase (DEFAULT_TASKS_BY_PHASE simplifié : 2 tâches par phase pour le seed)
  task_titles := ARRAY['Premier contact', 'Questionnaire client'];
  FOR i IN 1..9 LOOP
    IF i = 2 THEN task_titles := ARRAY['Relevé de mesures', 'Photos existant']; END IF;
    IF i = 3 THEN task_titles := ARRAY['Moodboards', 'Plans aménagement']; END IF;
    IF i = 4 THEN task_titles := ARRAY['Dossier présentation', 'RDV client']; END IF;
    IF i = 5 THEN task_titles := ARRAY['Plans techniques', 'Dossier technique']; END IF;
    IF i = 6 THEN task_titles := ARRAY['Appels d''offres', 'Devis artisans']; END IF;
    IF i = 7 THEN task_titles := ARRAY['Suivi chantier', 'Coordination']; END IF;
    IF i = 8 THEN task_titles := ARRAY['Réception', 'PV réception']; END IF;
    IF i = 9 THEN task_titles := ARRAY['Shooting photo', 'Publication']; END IF;
    INSERT INTO tasks (project_id, phase, title, status, priority, position)
    SELECT pid1, phase_keys[i], t.title, 'todo', 'medium', t.ord - 1
    FROM unnest(task_titles) WITH ORDINALITY AS t(title, ord)
    WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE project_id = pid1 AND phase = phase_keys[i]);
    INSERT INTO tasks (project_id, phase, title, status, priority, position)
    SELECT pid2, phase_keys[i], t.title, 'todo', 'medium', t.ord - 1
    FROM unnest(task_titles) WITH ORDINALITY AS t(title, ord)
    WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE project_id = pid2 AND phase = phase_keys[i]);
    INSERT INTO tasks (project_id, phase, title, status, priority, position)
    SELECT pid3, phase_keys[i], t.title, 'todo', 'medium', t.ord - 1
    FROM unnest(task_titles) WITH ORDINALITY AS t(title, ord)
    WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE project_id = pid3 AND phase = phase_keys[i]);
  END LOOP;

  -- Historique (optionnel, une seule fois)
  INSERT INTO project_history (project_id, user_id, action_type, description, metadata)
  SELECT p.id, (SELECT id FROM profiles WHERE company_id = cid LIMIT 1), 'project_created', 'Projet créé (seed démo)', jsonb_build_object('project_name', p.name)
  FROM projects p
  WHERE p.id IN (pid1, pid2, pid3)
  AND NOT EXISTS (SELECT 1 FROM project_history h WHERE h.project_id = p.id AND h.action_type = 'project_created' AND h.description LIKE '%seed%');

  -- ========== 3. Projet Conception (dossier de présentation) ==========
  SELECT id INTO uid FROM profiles WHERE company_id = cid ORDER BY created_at LIMIT 1;
  IF uid IS NULL THEN
    RAISE NOTICE 'Aucun profil trouvé. Skip seed conception.';
    RETURN;
  END IF;

  INSERT INTO conception_projects (
    id, user_id, client_name, client_email, project_name, project_type, status,
    current_phase, total_area_sqm, budget_min, budget_max, cover_image_url,
    style_direction, description
  ) VALUES (
    'c3000001-0000-4000-8000-000000000001'::uuid,
    uid,
    'Marie Dupont',
    'marie.dupont@exemple.fr',
    'Rénovation appartement Paris 11e',
    'residential',
    'design_development',
    3,
    65,
    70000,
    100000,
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
    'contemporary',
    'Appartement 3 pièces, rénovation complète avec cuisine ouverte et salle de bain.'
  ) ON CONFLICT (id) DO NOTHING
  RETURNING id INTO cproj_id;

  IF cproj_id IS NULL THEN
    SELECT id INTO cproj_id FROM conception_projects WHERE id = 'c3000001-0000-4000-8000-000000000001'::uuid;
  END IF;
  IF cproj_id IS NULL THEN
    RETURN;
  END IF;

  -- Phases Conception (6)
  INSERT INTO conception_phases (project_id, phase_number, name, description, status, completion_percentage, sort_order, deliverables)
  SELECT cproj_id, v.num, v.nam, v.descr, v.st, v.pct, v.num, v.deliv
  FROM (VALUES
    (1, 'Brief & Analyse', 'Recueil des besoins, analyse du site', 'completed', 100, '["Cahier des charges","Analyse du site"]'::jsonb),
    (2, 'Concept & Moodboard', 'Recherche créative, planches d''ambiance', 'completed', 100, '["Moodboards","Palette couleurs"]'::jsonb),
    (3, 'Développement Design', 'Plans détaillés, sélection matériaux', 'in_progress', 60, '["Plans d''aménagement","Sélection matériaux"]'::jsonb),
    (4, 'Plans Techniques', 'Plans d''exécution, détails techniques', 'upcoming', 0, '["Plans techniques","Cahier des charges"]'::jsonb),
    (5, 'Présentation Client', 'Dossier de présentation, rendus 3D', 'upcoming', 0, '["Rendus 3D","Dossier de présentation"]'::jsonb),
    (6, 'Suivi de Réalisation', 'Coordination des travaux, réception', 'upcoming', 0, '["Rapports chantier","PV réception"]'::jsonb)
  ) AS v(num, nam, descr, st, pct, deliv)
  WHERE NOT EXISTS (SELECT 1 FROM conception_phases cp WHERE cp.project_id = cproj_id AND cp.phase_number = v.num);

  -- Une pièce (salon) avec image concept
  IF NOT EXISTS (SELECT 1 FROM conception_rooms WHERE project_id = cproj_id AND name = 'Salon séjour') THEN
    INSERT INTO conception_rooms (project_id, name, room_type, area_sqm, description, concept_image_url, sort_order, status)
    VALUES (cproj_id, 'Salon séjour', 'living_room', 28, 'Espace de vie principal, cuisine ouverte', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', 0, 'design_development')
    RETURNING id INTO croom_id;
  END IF;
  IF croom_id IS NULL THEN
    SELECT id INTO croom_id FROM conception_rooms WHERE project_id = cproj_id LIMIT 1;
  END IF;

  -- Moodboard avec 2 images fictives
  IF NOT EXISTS (SELECT 1 FROM conception_moodboards WHERE project_id = cproj_id AND title = 'Ambiance contemporaine') THEN
    INSERT INTO conception_moodboards (project_id, room_id, title, description, theme, color_palette, sort_order, is_approved)
    VALUES (cproj_id, croom_id, 'Ambiance contemporaine', 'Teintes neutres, matériaux naturels', 'contemporary', '[{"hex":"#F5F5DC"},{"hex":"#8B7355"},{"hex":"#2F4F4F"}]'::jsonb, 0, true)
    RETURNING id INTO cmood_id;
  END IF;

  IF cmood_id IS NULL THEN
    SELECT id INTO cmood_id FROM conception_moodboards WHERE project_id = cproj_id LIMIT 1;
  END IF;
  IF cmood_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM conception_moodboard_images WHERE moodboard_id = cmood_id LIMIT 1) THEN
    INSERT INTO conception_moodboard_images (moodboard_id, image_url, title, sort_order)
    VALUES
      (cmood_id, 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800', 'Salon inspiration', 0),
      (cmood_id, 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800', 'Cuisine ouverte', 1);
  END IF;

  RAISE NOTICE 'Seed demo projects + conception OK.';
END $$;
