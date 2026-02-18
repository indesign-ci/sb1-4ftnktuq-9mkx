# Rapport d'anomalies – Application INDESIGN PLUS PRO

Revue du code (fichiers principaux). Classement : **Critique** | **Important** | **Mineur** | **Recommandation**.

---

## 1. Configuration & environnement

### 1.1 **Supabase : URL et clé en dur** — Important ✅ Corrigé
- **Fichier :** `lib/supabase/client.ts`
- **Action :** Utilise désormais `process.env.NEXT_PUBLIC_SUPABASE_URL` et `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### 1.2 **TypeScript et ESLint désactivés en build** — Important
- **Fichier :** `next.config.js` (lignes 165–170)
- **Problème :** `typescript: { ignoreBuildErrors: true }` et `eslint: { ignoreDuringBuilds: true }`.
- **Risque :** Les erreurs de type et de lint ne bloquent plus le build ; des bugs peuvent passer en production.
- **Action :** Réactiver les deux progressivement après correction des erreurs existantes.

### 1.3 **metadataBase manquant** — Mineur ✅ Corrigé
- **Fichier :** `app/layout.tsx`
- **Action :** `metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://indesign-plus-pro.vercel.app')` ajouté.

### 1.4 **Images Next.js** — Mineur ✅ Corrigé
- **Fichier :** `next.config.js`
- **Action :** `images.domains` supprimé ; seul `remotePatterns` est conservé.

---

## 2. Typage et qualité du code

### 2.1 **@ts-nocheck sur de nombreux fichiers** — Important ✅ Partiel
- **Corrigé :** `clients/page.tsx`, `quotes/page.tsx`, `invoices/page.tsx`, `projects/page.tsx` (retrait de `@ts-nocheck` + typage des erreurs / états). Page `notifications/page.tsx` : type `Notification` utilisé à la place de `any`.
- **Restant (à traiter progressivement) :**  
  `clients/page.tsx`, `quotes/page.tsx`, `invoices/page.tsx`, `documents/page.tsx`, `moodboards/page.tsx`, `projects/page.tsx`, `planning/page.tsx`,  
  `client-detail.tsx`, `quote-detail.tsx`, `invoice-detail.tsx`, `projects-table.tsx`, `moodboard-detail.tsx`, `moodboard-form.tsx`,  
  `client-form.tsx`, `quote-form.tsx`, `invoice-form.tsx`, `project-form.tsx`, `material-form.tsx`, `supplier-form.tsx`,  
  `first-contact/page.tsx`, `mission-proposal/page.tsx`, `measurements/page.tsx`,  
  `gantt-view.tsx`, `planning-list.tsx`, `task-detail-sheet.tsx`, `planning-workload.tsx`.
- **Problème :** Désactivation globale du typage TypeScript sur ces fichiers.
- **Risque :** Erreurs de type non détectées, refactors plus risqués.
- **Action :** Retirer `@ts-nocheck` fichier par fichier et corriger les types (interfaces, `unknown` à la place de `any` où c’est possible).

### 2.2 **Usage intensif de `any`** — Important ✅ Partiel
- **Corrigé :** Dans `clients/page.tsx`, `quotes/page.tsx`, `invoices/page.tsx` : `catch (error: any)` remplacé par `catch` ; dans `invoices/page.tsx` : `invoice as any` remplacé par un type explicite. Dans `projects/page.tsx` : types `ProjectRow` et `ArchitectProfile`, `editingProject` et handlers typés. Hook `use-notifications` : `metadata` typé en `Record<string, unknown>` ; page notifications : paramètre typé `Notification`.
- **Restant :** `any` dans les autres composants (forms, detail, planning, etc.) à l’exécution.
- **Action :** Introduire des interfaces (ex. `Company`, `InvoiceLine`, `QuoteSection`) et remplacer `any` fichier par fichier.

### 2.3 **tsconfig et `.next/types`** — Mineur ✅ Corrigé
- **Fichier :** `tsconfig.json` (include)
- **Action :** `.next/types/**/*.ts` retiré de l’include pour éviter les erreurs quand `.next` est supprimé.

---

## 3. Cohérence de la marque

### 3.1 **Double marque : DecoProManager vs INDESIGN PLUS PRO** — Mineur ✅ Corrigé
- **Fichier :** `app/layout.tsx`
- **Action :** Metadata et balises meta utilisent désormais `APP_NAME` depuis `lib/app-config.ts` (INDESIGN PLUS PRO).

---

## 4. Sécurité et bonnes pratiques

### 4.1 **Clé API Anthropic** — À vérifier ✅ Documenté
- **Fichier :** `app/api/moodboard/route.ts`
- **Action :** `.env.example` créé avec `ANTHROPIC_API_KEY` et `ANTHROPIC_MOODBOARD_MODEL` documentés (sans valeur).

### 4.2 **.env et .gitignore** — OK
- `.env` et `.env*.local` sont bien dans `.gitignore`. Pas d’anomalie sur ce point.

---

## 5. Logs et débogage

### 5.1 **console.error dans les catch** — Recommandation
- **Fichiers :** Nombreuses pages et composants (dashboard, documents-pro, documents, planning, forms, etc.).
- **Problème :** Beaucoup de `console.error` en cas d’erreur. En production, selon la config, ces logs peuvent finir dans les logs serveur ou le navigateur.
- **Action :** Conserver pour le diagnostic ; éventuellement centraliser dans un petit logger qui en dev affiche en console et en prod envoie à un service (Sentry, etc.) ou supprime les détails sensibles.

### 5.2 **console.log dans install-pwa** — Mineur ✅ Corrigé
- **Fichier :** `components/layout/install-pwa.tsx`
- **Action :** Les `console.log` sont exécutés uniquement en développement (`process.env.NODE_ENV === 'development'`).

---

## 6. Erreurs et robustesse

### 6.1 **Gestion d’erreurs silencieuse** — Important ✅ Corrigé
- **Action :** Toast d’erreur ajouté sur échec de chargement du tableau de bord (`dashboard/page.tsx`) et des données documents-pro (`documents-pro/page.tsx`). À étendre sur les autres pages critiques si besoin.

### 6.2 **Placeholders « XXX » dans documents** — Mineur ✅ Corrigé
- **Fichiers :** `documents/new/suivi-financier/page.tsx`, `compte-rendu-chantier/page.tsx`
- **Action :** Suivi financier : numéro PDF généré avec suffixe aléatoire (ex. SF-2025-042) ; aperçu en SF-2025-001. Compte-rendu : labels « Numéro (ex. CR-2025-001-01) » et « Numéro projet ».

---

## 7. Résumé des actions prioritaires

| Priorité | Anomalie | Statut |
|----------|----------|--------|
| 1 | Supabase en dur | ✅ Corrigé |
| 2 | ignoreBuildErrors / ignoreDuringBuilds | ⏸️ Conservé (éviter des échecs de build) ; à réactiver après correction des erreurs TS/ESLint |
| 3 | @ts-nocheck et `any` | ✅ Partiel (clients, quotes, invoices, projects, notifications corrigés ; reste à étendre) |
| 4 | Marque layout | ✅ Corrigé |
| 5 | console.log PWA | ✅ Corrigé |
| 6 | metadataBase | ✅ Corrigé |
| 7 | Feedback utilisateur sur erreurs | ✅ Corrigé (étendu à toutes les pages critiques + notifications) |

---

*Dernière mise à jour : 6.1 corrigé (toasts étendus à toutes les pages critiques + notifications). 2.1 et 2.2 partiellement traités (clients, quotes, invoices, projects, notifications ; @ts-nocheck retiré et `any` réduit sur ces fichiers). Reste à étendre le typage aux autres composants.*
