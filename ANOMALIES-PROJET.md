# Rapport d’anomalies — Scan du projet

*Généré le 20/02/2025*

---

## 1. Backend Supabase — Tables Conception manquantes (critique)

**Fichier concerné :** `lib/conceptionService.ts`

Le service utilise les tables/vues suivantes, **aucune migration dans `supabase/migrations/` ne les crée** :

- `conception_projects`
- `conception_rooms`
- `conception_phases`
- `conception_moodboards`
- `conception_moodboard_images`
- `conception_materials`
- `conception_furniture`
- `conception_budget_summary` (vue)

**Conséquence :** Sur `/conception` et `/conception/[id]`, les appels Supabase échouent (relation ou vue inexistante).

**Action :** Créer une migration Supabase qui définit ces tables (et la vue budget) avec les colonnes alignées sur `types/conception.ts`, puis appliquer les politiques RLS. Le script `supabase/storage_bucket_conception_assets.sql` existe pour le bucket ; les tables du module Conception restent à créer.

---

## 2. Route Documents Pro manquante — design-dossier

**Fichiers :** `lib/documents-pro-config.ts`, `app/(dashboard)/documents-pro/page.tsx`

La route **`/documents-pro/create/design-dossier`** (type `design_dossier`, « Dossier de Conception ») est référencée dans la config et dans la page, mais **il n’existe pas de** `app/(dashboard)/documents-pro/create/design-dossier/page.tsx`.

**Conséquence :** Clic sur « Dossier de Conception » → 404.

**Action :** Créer la page `app/(dashboard)/documents-pro/create/design-dossier/page.tsx` ou retirer / modifier la référence à `design_dossier` dans la config.

---

## 3. Build — Erreurs TypeScript et ESLint ignorées

**Fichier :** `next.config.js`

```js
typescript: { ignoreBuildErrors: true },
eslint: { ignoreDuringBuilds: true },
```

**Conséquence :** Le build peut réussir alors qu’il existe des erreurs TypeScript ou ESLint. Risque de régressions et de bugs en production.

**Action :** À terme, corriger les erreurs puis mettre `ignoreBuildErrors: false` et `ignoreDuringBuilds: false`.

---

## 4. Supabase server client — Pas de garde-fou sur les variables d’env

**Fichier :** `lib/supabase/server.ts`

Les variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont utilisées avec l’assertion non-null (`!`) sans test. Si elles sont vides, `createClient` recevra `undefined` et plantera à l’exécution.

**Comparaison :** `lib/supabase/client.ts` vérifie ces variables et lance une erreur explicite.

**Action :** Ajouter la même vérification (ou un early return / throw) dans `server.ts` pour éviter des erreurs obscures.

---

## 5. Documentation — ETAT-CONCEPTION.md obsolète

**Fichier :** `ETAT-CONCEPTION.md`

Le document indique que **ProjectDetailView** et **ProjectsListView** « n’existent pas ». Ils existent désormais, de même que **CreateProjectModal**.

**Action :** Mettre à jour la section « Problèmes actuels » et « Fichiers clés » pour refléter l’état actuel (composants créés ; problème restant = tables Supabase + bucket).

---

## 6. Points déjà corrects (vérifiés)

- **Imports `@/`** : Aucun import cassé détecté ; `CreateProjectModal`, `ProjectDetailView`, `ProjectsListView`, hooks et types Conception sont présents.
- **Module CSS Conception** : Plus de référence à `ConceptionPresentation.module.css` dans les composants Conception (Tailwind utilisé).
- **Fichier MoodBoard.tsx** : Aucun composant nommé `MoodBoard.tsx` dans le projet ; les moodboards utilisent `moodboard-form`, `moodboard-detail`, etc. La mention dans ETAT-CONCEPTION concerne un ancien composant.
- **Linter** : Aucune erreur sur les dossiers `components/conception`, `app/api/setup-first-admin`, `lib/supabase`.
- **Env** : `NEXT_PUBLIC_SUPABASE_*` et `SUPABASE_SERVICE_ROLE_KEY` documentés dans `.env.example` et utilisés de façon cohérente (avec vérification côté client).

---

## Résumé des actions prioritaires

| Priorité | Anomalie | Action |
|----------|----------|--------|
| 1 | Tables Conception absentes | Créer migration Supabase (tables + vue budget + RLS) |
| 2 | Route design-dossier 404 | Créer la page ou retirer la référence |
| 3 | ignoreBuildErrors / ESLint | Réactiver les vérifications après correction des erreurs |
| 4 | server.ts env | Ajouter vérification des variables Supabase |
| 5 | ETAT-CONCEPTION.md | Mettre à jour la doc d’état |
