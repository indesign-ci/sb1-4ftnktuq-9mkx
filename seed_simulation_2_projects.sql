/*
  Simulation : 2 projets avec données fictives

  À exécuter dans l’éditeur SQL Supabase (Dashboard > SQL Editor).
  Prérequis : au moins une entreprise (company) et un profil (profile) existants
  (par ex. après inscription ou après avoir exécuté seed_demo_data.sql).

  Ce script ajoute :
  - 2 clients fictifs
  - 2 projets liés à ces clients
  - 2 documents "Relevé de mesures" (professional_documents) pour voir la liste
    et tester la page Relevé de mesures avec des projets dans le select.
*/

DO $$
DECLARE
  v_company_id UUID;
  v_created_by UUID;   -- user_id (auth.users) pour created_by du document ; peut être NULL
  v_client_1_id UUID;
  v_client_2_id UUID;
  v_project_1_id UUID;
  v_project_2_id UUID;
BEGIN
  -- Utiliser la première entreprise
  SELECT id INTO v_company_id FROM companies LIMIT 1;
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Aucune entreprise trouvée. Créez d''abord une entreprise (inscription ou seed).';
  END IF;

  -- Un utilisateur de l’entreprise (user_id) pour created_by ; NULL si aucun profil
  SELECT user_id INTO v_created_by FROM profiles WHERE company_id = v_company_id AND user_id IS NOT NULL LIMIT 1;

  -- ============================================================================
  -- 2 CLIENTS FICTIFS
  -- ============================================================================
  INSERT INTO clients (company_id, title, first_name, last_name, email, phone, address, city, postal_code,
                      client_type, property_type, surface_area, estimated_budget, style_preference,
                      source, status, notes, created_at)
  VALUES
    (v_company_id, 'M. et Mme', 'Koffi', 'Adjoumani', 'k.adjoumani@email.com', '+225 07 01 02 03 04',
     'Cocody Angré 7e tranche', 'Abidjan', '00225', 'individual', 'Appartement', 95, 8500000,
     'Contemporain', 'Bouche à oreille', 'active',
     'Simulation : projet appartement 3 pièces', NOW())
  RETURNING id INTO v_client_1_id;

  INSERT INTO clients (company_id, title, first_name, last_name, email, phone, address, city, postal_code,
                      client_type, property_type, surface_area, estimated_budget, style_preference,
                      source, status, notes, created_at)
  VALUES
    (v_company_id, 'Mme', 'Aminata', 'Diallo', 'a.diallo@email.com', '+225 05 98 76 54 32',
     'Plateau, Avenue Chardy', 'Abidjan', '00225', 'individual', 'Maison', 180, 15000000,
     'Luxe', 'Instagram', 'active',
     'Simulation : villa à rénover', NOW())
  RETURNING id INTO v_client_2_id;

  -- ============================================================================
  -- 2 PROJETS FICTIFS
  -- ============================================================================
  INSERT INTO projects (company_id, client_id, name, description, address, city, postal_code,
                        property_type, surface_area, style, status, current_phase, progress,
                        budget_estimated, budget_spent, start_date, deadline, created_at)
  VALUES
    (v_company_id, v_client_1_id, 'Appartement Cocody – Rénovation complète',
     'Rénovation complète d''un appartement 95 m² : salon, 2 chambres, cuisine, SDB. Décoration contemporaine.',
     'Cocody Angré 7e tranche', 'Abidjan', '00225', 'Appartement', 95, 'Contemporain', 'active',
     'technical_visit', 18, 8500000, 1530000, '2025-01-15', '2025-08-30', NOW())
  RETURNING id INTO v_project_1_id;

  INSERT INTO projects (company_id, client_id, name, description, address, city, postal_code,
                        property_type, surface_area, style, status, current_phase, progress,
                        budget_estimated, budget_spent, start_date, deadline, created_at)
  VALUES
    (v_company_id, v_client_2_id, 'Villa Plateau – Aménagement intérieur',
     'Aménagement intérieur villa 180 m² : entrée, salon, salle à manger, 3 chambres, bureaux, terrasses.',
     'Plateau, Avenue Chardy', 'Abidjan', '00225', 'Maison', 180, 'Luxe', 'active',
     'design', 12, 15000000, 1800000, '2025-02-01', '2025-12-15', NOW())
  RETURNING id INTO v_project_2_id;

  -- ============================================================================
  -- 2 DOCUMENTS "RELEVÉ DE MESURES"
  -- ============================================================================
  INSERT INTO professional_documents (company_id, created_by, document_type, document_phase, document_number, title, client_id, project_id, status, document_data, created_at, updated_at)
  VALUES
    (v_company_id, v_created_by, 'measurements', 'phase2', 'RM-2025-001',
     'Relevé de mesures – Appartement Cocody', v_client_1_id, v_project_1_id, 'draft',
     '{"dateReleve":"2025-02-10","personReleve":"Julie D.","outil":"Mètre laser","rooms":[{"roomName":"Salon","shape":"Rectangle","length":"520","width":"420","heightCeiling":"270"},{"roomName":"Cuisine","shape":"Rectangle","length":"320","width":"280","heightCeiling":"270"}]}'::jsonb,
     NOW(), NOW());

  INSERT INTO professional_documents (company_id, created_by, document_type, document_phase, document_number, title, client_id, project_id, status, document_data, created_at, updated_at)
  VALUES
    (v_company_id, v_created_by, 'measurements', 'phase2', 'RM-2025-002',
     'Relevé de mesures – Villa Plateau', v_client_2_id, v_project_2_id, 'draft',
     '{"dateReleve":"2025-02-12","personReleve":"Sophie M.","outil":"Laser + ruban","rooms":[{"roomName":"Salon","shape":"L","length":"680","width":"450","heightCeiling":"300"},{"roomName":"Chambre parentale","shape":"Rectangle","length":"480","width":"420","heightCeiling":"280"}]}'::jsonb,
     NOW(), NOW());

  RAISE NOTICE 'Simulation terminée : 2 clients, 2 projets et 2 relevés de mesures créés.';
  RAISE NOTICE 'Company: %', v_company_id;
  RAISE NOTICE 'Projet 1: % | Projet 2: %', v_project_1_id, v_project_2_id;
END $$;

-- Où voir le résultat dans l'app :
-- 1. Documents Pro : les 2 relevés apparaissent dans la liste (Relevé de mesures – Appartement Cocody / Villa Plateau).
-- 2. Relevé de mesures (Nouveau document > Phase 2 > Relevé de mesures) : le select "Projet" propose les 2 projets.
-- 3. Projets / Clients : les 2 projets et 2 clients fictifs apparaissent dans leurs listes respectives.
