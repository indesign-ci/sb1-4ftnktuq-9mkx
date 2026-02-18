# Déployer avec Vercel CLI (sans Git)

## 1. Installer Vercel CLI

Dans un terminal (PowerShell ou CMD) :

```bash
npm install -g vercel
```

## 2. Se placer dans le projet

```bash
cd "c:\Users\PREDATOR\Downloads\Projet Interior Pro App\project"
```

## 3. Premier déploiement (lier au compte Vercel)

**Déploiement de préview (test) :**
```bash
vercel
```

**Déploiement en production :**
```bash
vercel --prod
```

La première fois, le CLI vous demandera :

- **Log in** : ouvrez le lien dans le navigateur, connectez-vous à Vercel, puis collez le code affiché.
- **Set up and deploy?** → **Y** (Yes).
- **Which scope?** → choisissez votre compte (ex. contactindesignci-8115).
- **Link to existing project?** → **Y** si vous avez déjà le projet *indesignpluspro* sur Vercel, sinon **N** pour en créer un nouveau.
- Si vous liez à un projet existant : choisissez **indesignpluspro** dans la liste.
- **Override settings?** → **N** en général (Next.js est détecté automatiquement).

À la fin, vous obtenez une URL (ex. `https://indesignpluspro.vercel.app`).

## 4. Variables d’environnement

Les variables (Supabase, etc.) doivent être définies **dans le dashboard Vercel** :

1. Allez sur https://vercel.com/dashboard
2. Ouvrez le projet **indesignpluspro**
3. **Settings** → **Environment Variables**
4. Ajoutez au minimum :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (ex. `https://indesignpluspro.vercel.app`)

Puis **redéployez** une fois (voir ci-dessous) pour que les variables soient prises en compte.

## 5. Déploiements suivants

À chaque fois que vous voulez mettre à jour le site :

```bash
cd "c:\Users\PREDATOR\Downloads\Projet Interior Pro App\project"
vercel --prod
```

Le projet est déjà lié, le CLI envoie le code actuel et lance un nouveau déploiement.

## Option : déploiement automatique avec Git

Si plus tard vous connectez un dépôt Git (GitHub, etc.) à ce projet Vercel, chaque `git push` déclenchera un déploiement automatique. En attendant, la CLI suffit.
