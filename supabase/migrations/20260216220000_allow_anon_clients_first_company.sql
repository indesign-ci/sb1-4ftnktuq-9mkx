/*
  # RLS: Allow anon to manage clients for the first company (dev / admin sans Supabase Auth)

  Contexte: l'app utilise un utilisateur "admin" fictif (AuthContext) sans connexion Supabase.
  Les requêtes partent en anon, donc la policy "TO authenticated" sur clients bloque tout.

  Cette migration permet au rôle anon d'effectuer SELECT, INSERT, UPDATE, DELETE sur la table
  clients uniquement pour les lignes dont company_id = première entreprise en base.
  En production, privilégier la connexion Supabase Auth (authenticated) pour les vrais admins.
*/

-- Fonction qui retourne l'id de la première entreprise (pour anon / mode démo)
CREATE OR REPLACE FUNCTION public.get_first_company_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM companies LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_first_company_id() TO anon;
GRANT EXECUTE ON FUNCTION public.get_first_company_id() TO authenticated;

-- Policy anon: lecture des clients de la première entreprise
CREATE POLICY "Anon can view clients of first company"
  ON clients
  FOR SELECT
  TO anon
  USING (company_id = public.get_first_company_id());

-- Policy anon: création de clients pour la première entreprise
CREATE POLICY "Anon can insert clients for first company"
  ON clients
  FOR INSERT
  TO anon
  WITH CHECK (company_id = public.get_first_company_id());

-- Policy anon: mise à jour des clients de la première entreprise
CREATE POLICY "Anon can update clients of first company"
  ON clients
  FOR UPDATE
  TO anon
  USING (company_id = public.get_first_company_id())
  WITH CHECK (company_id = public.get_first_company_id());

-- Policy anon: suppression des clients de la première entreprise
CREATE POLICY "Anon can delete clients of first company"
  ON clients
  FOR DELETE
  TO anon
  USING (company_id = public.get_first_company_id());
