-- RLS correct pour la table companies
-- À exécuter dans le SQL Editor Supabase (Authentication > Policies ou SQL Editor).
-- Supprime la politique "Allow all for now" et impose des règles cohérentes avec le reste de l'app.

-- 1. Supprimer la politique trop permissive (si elle existe)
DROP POLICY IF EXISTS "Allow all for now" ON companies;

-- 2. S'assurer que RLS est activé
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- 3. Politique SELECT : les utilisateurs authentifiés voient uniquement leur entreprise
DROP POLICY IF EXISTS "Users can view their company" ON companies;
CREATE POLICY "Users can view their company"
  ON companies
  FOR SELECT
  TO authenticated
  USING (id = public.get_user_company_id());

-- 4. Politique UPDATE : seuls les admins peuvent modifier leur entreprise
DROP POLICY IF EXISTS "Admins can update their company" ON companies;
CREATE POLICY "Admins can update their company"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
    id = public.get_user_company_id()
    AND public.is_current_user_admin()
  )
  WITH CHECK (
    id = public.get_user_company_id()
    AND public.is_current_user_admin()
  );

-- Note : pas de politique INSERT/DELETE pour companies depuis l'app (création via setup-first-admin ou manuellement).
