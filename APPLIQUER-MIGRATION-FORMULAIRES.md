# Rendre tous les formulaires et documents fonctionnels

## Erreur « chk_client_identity » à la création d’un client

Si vous voyez **« new row for relation "clients" violates check constraint "chk_client_identity" »** en créant un nouveau client :

1. Ouvrez **Supabase** → **SQL Editor** → **New query**.
2. Collez et exécutez ce SQL (une seule fois) :
   ```sql
   ALTER TABLE clients DROP CONSTRAINT IF EXISTS chk_client_identity;
   ```
3. Réessayez de créer le client dans l’application.

---

## Une seule migration à exécuter

Pour que **tous les formulaires et documents** de l’application fonctionnent (création de devis, factures, projets, clients, paramètres entreprise, documents pro, pièces jointes, etc.), exécutez **une seule fois** le fichier SQL suivant dans Supabase.

### Étapes

1. Ouvrez votre **projet Supabase** sur [supabase.com](https://supabase.com).
2. Allez dans **SQL Editor** → **New query**.
3. Ouvrez dans votre projet le fichier :
   ```
   supabase/migrations/20260220190000_ensure_all_forms_and_documents.sql
   ```
4. **Copiez tout son contenu** et collez-le dans l’éditeur SQL.
5. Cliquez sur **Run** (ou Ctrl+Entrée).
6. Vérifiez qu’il n’y a pas d’erreur en rouge (les éventuels avertissements « already exists » sont normaux).

### Ce que fait cette migration

- **Stockage (buckets)**  
  Crée ou met à jour les buckets :
  - `photos` : images de couverture projets, logos, moodboards, matériaux, etc.
  - `documents` : pièces jointes des documents (cahier des charges, PV, DOE, etc.).
  - `conception-assets` : images/PDF du module Conception.

- **Table `companies`**  
  Ajoute les colonnes manquantes : `website`, `siret`, `vat_number`, `rcs`, `iban`, `quote_legal_mentions`, `invoice_legal_mentions`, `terms_conditions`, `logo_url`, `updated_at`.

- **Table `projects`**  
  Ajoute les colonnes manquantes : `address`, `city`, `postal_code`, `property_type`, `surface_area`, `style`, `budget_estimated`, `budget_spent`, `start_date`, `deadline`, `description`, `cover_image_url`, `current_phase`, `progress`, `architect_id`.

- **Tables `quotes` et `invoices`**  
  Ajoute la colonne `company_id` si elle n’existe pas (nécessaire pour la création de devis et factures).

Après exécution, **rechargez l’application** et testez les écrans qui posaient problème (nouveau devis, nouveau projet, paramètres entreprise / mentions légales, documents avec pièces jointes, etc.).

## En cas d’erreur à l’exécution

- **« relation "companies" does not exist »**  
  La base n’a pas encore les tables de base. Exécutez d’abord les migrations existantes du dossier `supabase/migrations/` dans l’ordre des dates (ou utilisez `npx supabase db push` si vous utilisez la CLI).

- **« relation "quotes" does not exist »**  
  Idem : les tables métier (quotes, invoices, etc.) doivent être créées par les migrations initiales du projet avant d’exécuter ce fichier.

- **Erreur sur « SET NOT NULL » pour `company_id`**  
  Il n’y a aucune entreprise en base. Créez d’abord une company (ou exécutez le seed qui crée une company), puis réexécutez la migration si besoin.

## Fournisseurs et matériaux qui ne s'affichent plus

Si vous aviez déjà des **fournisseurs** et **matériaux** en base et qu'ils ne se chargent plus au démarrage :

1. Exécutez en plus la migration :
   ```
   supabase/migrations/20260220210000_suppliers_materials_company_id.sql
   ```
   Elle ajoute `company_id` aux tables `suppliers` et `materials` si besoin, et rattache les lignes existantes à votre première entreprise.

2. L'application a été corrigée pour attendre le chargement du profil (et donc du `company_id`) avant de charger le dashboard, les fournisseurs et la bibliothèque matériaux. Après la migration, rechargez l'app : les données devraient réapparaître.
