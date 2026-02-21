-- Seed : clients fictifs (démo) pour la première entreprise
-- Ces clients apparaîtront sur la page /clients et dans les sélecteurs (projets, devis, etc.)
-- Exécuter une seule fois. Si la table n'a pas toutes les colonnes, les INSERT échouent :
-- dans ce cas, exécutez uniquement les colonnes que votre table clients possède.

DO $$
DECLARE
  cid uuid;
BEGIN
  SELECT id INTO cid FROM companies ORDER BY created_at LIMIT 1;
  IF cid IS NULL THEN
    RETURN;
  END IF;

  -- status : utiliser une valeur valide de l'enum client_status (ex. 'prospect')
  INSERT INTO clients (id, company_id, first_name, last_name, email, phone, status)
  VALUES (
    'b1000001-0000-4000-8000-000000000001'::uuid,
    cid,
    'Marie',
    'Dupont',
    'marie.dupont@exemple.fr',
    '+33 6 12 34 56 78',
    'prospect'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO clients (id, company_id, first_name, last_name, email, phone, status)
  VALUES (
    'b1000002-0000-4000-8000-000000000002'::uuid,
    cid,
    'Jean',
    'Martin',
    'jean.martin@exemple.fr',
    '+33 6 98 76 54 32',
    'prospect'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO clients (id, company_id, first_name, last_name, email, phone, status)
  VALUES (
    'b1000003-0000-4000-8000-000000000003'::uuid,
    cid,
    'Sophie',
    'Bernard',
    'sophie.bernard@exemple.fr',
    '+33 6 11 22 33 44',
    'prospect'
  )
  ON CONFLICT (id) DO NOTHING;
END $$;
