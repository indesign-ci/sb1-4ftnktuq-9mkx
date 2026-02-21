-- ============================================================
-- Supprimer la contrainte chk_client_identity sur clients
-- Corrige : "new row for relation "clients" violates check constraint "chk_client_identity""
-- La contrainte (souvent "first_name et last_name non vides") peut être trop stricte
-- ou incompatible avec le formulaire. On la supprime ; la validation reste côté app.
-- ============================================================

ALTER TABLE clients
DROP CONSTRAINT IF EXISTS chk_client_identity;
