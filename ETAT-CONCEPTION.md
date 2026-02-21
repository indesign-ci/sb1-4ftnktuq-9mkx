# État actuel de l'application — Module Conception

## Ce qui fonctionne

- **Routes Next.js**  
  - `/conception` → `app/(dashboard)/conception/page.tsx`  
  - `/conception/[id]` → `app/(dashboard)/conception/[id]/page.tsx`

- **Hooks**  
  - `hooks/useConception.ts` → réexporte `useConceptionProjects` et `useConceptionProject`  
  - `hooks/conception/useProjects.ts` → liste des projets (filtres, refetch)  
  - `hooks/conception/useProject.ts` → détail projet (project, rooms, moodboards, materials, furniture, phases, budget + actions)

- **Service**  
  - `lib/conceptionService.ts` → CRUD projets, rooms, moodboards, materials, furniture, phases, upload, budget summary

- **Types**  
  - `types/conception.ts` → types et labels FR

- **Composants existants (Tailwind)**  
  - `ClientPresentation`, `BudgetEstimation`, `RoomVisualizer`, `ProjectTimeline`, `MaterialsPalette`, `BeforeAfter`, `DesignPhases`

- **Pas de dépendance au CSS module**  
  - Références à `ConceptionPresentation.module.css` supprimées dans `ProjectsListView` et `CreateProjectModal` (remplacées par Tailwind).

---

## Problèmes actuels

1. **Composants**  
   - `ProjectDetailView` et `ProjectsListView` sont importés par `ConceptionPresentationPage` mais **n’existent pas** dans `components/conception/`.  
   - `ProjectDetailView`, `ProjectsListView` et `CreateProjectModal` existent désormais.

2. **MoodBoard / CreateProjectModal / ProjectHero**  
   - S’ils sont utilisés par la vue détail, ils doivent exister et ne plus référencer `ConceptionPresentation.module.css` (ou le fichier doit exister).  
   - Dans `MoodBoard.tsx`, il peut rester des `styles.xxx` si le module CSS a été supprimé → à remplacer par Tailwind ou à recréer le module.

3. **Backend Supabase**  
   - Les tables/vues Conception (`conception_projects`, `conception_rooms`, `conception_moodboards`, `conception_budget_summary`, etc.) doivent exister et être accessibles (RLS, policies).  
   - Sinon : erreurs au chargement des données.

4. **Stockage**  
   - Le bucket `conception-assets` doit exister (script `storage_bucket_conception_assets.sql`) pour les uploads d’images/couverture.

---

## Suggestions pour rendre l’application fonctionnelle

1. **Créer les vues manquantes**  
   - **ProjectsListView** : liste des projets (grille de cartes), recherche, bouton « Nouveau projet », utilisation de `useConceptionProjects`, liens vers `/conception/[id]`.  
   - **ProjectDetailView** : onglets (Vue d’ensemble, Moodboards, Espaces, Matériaux, Mobilier, Budget, Planning, Présentation), utilisation de `useConceptionProject(projectId)`, bouton retour vers `/conception`.

2. **Assurer la cohérence MoodBoard / modales**  
   - Soit recréer `ConceptionPresentation.module.css` avec les classes utilisées par `MoodBoard` (et éventuellement `CreateProjectModal`),  
   - Soit supprimer toute référence à `styles.xxx` dans `MoodBoard` (et modales) et tout styliser en Tailwind.

3. **Vérifier la base Supabase**  
   - Exécuter les migrations (ou scripts SQL) qui créent les tables et vues Conception + RLS.  
   - Vérifier que la vue `conception_budget_summary` existe si `getBudgetSummary` est utilisée.

4. **Créer un projet de test**  
   - Depuis la liste Conception, créer un projet (formulaire → `conceptionService.createProject`) et ouvrir sa fiche (`/conception/[id]`) pour valider le flux.

5. **Gestion d’erreurs et chargement**  
   - Afficher un message clair si les projets ne chargent pas (erreur réseau / Supabase).  
   - Afficher un skeleton ou spinner pendant le chargement.

6. **Optionnel**  
   - **ProjectHero** : bloc en-tête de la fiche projet (couverture, titre, client, indicateurs).  
   - **CreateProjectModal** : modal de création de projet (déjà prévu côté code, à brancher depuis la liste).

---

## Fichiers clés

| Rôle              | Fichier |
|-------------------|--------|
| Page liste        | `app/(dashboard)/conception/page.tsx` |
| Page détail       | `app/(dashboard)/conception/[id]/page.tsx` |
| Routeur Conception| `components/conception/ConceptionPresentationPage.tsx` |
| Liste projets     | `components/conception/ProjectsListView.tsx` (à créer) |
| Détail projet     | `components/conception/ProjectDetailView.tsx` (à créer) |
| Hooks             | `hooks/useConception.ts`, `hooks/conception/useProjects.ts`, `hooks/conception/useProject.ts` |
| Service           | `lib/conceptionService.ts` |
| Types             | `types/conception.ts` |
