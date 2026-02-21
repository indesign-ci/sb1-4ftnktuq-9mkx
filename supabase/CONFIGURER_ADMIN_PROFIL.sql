-- Associer / créer le profil Admin pour l'utilisateur avec cet email.
-- La table profiles utilise "id" (PK = auth.users.id), pas "user_id".

INSERT INTO profiles (id, company_id, first_name, last_name, email, role)
SELECT
  u.id,
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',   -- ID de l'entreprise (à adapter si besoin)
  'Admin',                                      -- Prénom
  'INDESIGN',                                   -- Nom de famille
  'contactindesignci@gmail.com',                -- Email
  'admin'
FROM auth.users u
WHERE u.email = 'contactindesignci@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  role = 'admin';
