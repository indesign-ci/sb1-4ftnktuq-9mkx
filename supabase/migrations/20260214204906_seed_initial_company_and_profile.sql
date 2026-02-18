/*
  # Seed Initial Company and Profile
  
  Creates an initial company and profile for the existing user.
  
  1. Company
    - Creates a demo interior design company
  
  2. Profile
    - Links the existing auth user to the company
    - Sets role as admin
*/

-- Insert demo company
INSERT INTO companies (id, name, address, phone, email, primary_color)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'Interior Design Pro',
  '123 Avenue des Champs-Élysées, 75008 Paris',
  '+33 1 23 45 67 89',
  'contact@interiordesignpro.fr',
  '#C5A572'
)
ON CONFLICT (id) DO NOTHING;

-- Insert profile for existing user (profiles.id = auth.users.id)
INSERT INTO profiles (id, company_id, first_name, last_name, email, role)
SELECT u.id, 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Admin', 'User', 'contactindesignci@gmail.com', 'admin'
FROM auth.users u
WHERE u.email = 'contactindesignci@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;
