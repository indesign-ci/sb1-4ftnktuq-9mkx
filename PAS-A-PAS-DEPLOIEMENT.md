# Pas à pas : déployer la correction (APP_VERSION) sur Vercel

Suivez les étapes **dans l’ordre**. Vous pouvez exécuter les commandes dans **PowerShell** ou **CMD**, en ouvrant le terminal dans le dossier du projet.

---

## Étape 1 : Ouvrir le terminal dans le bon dossier

1. Ouvrez **PowerShell** ou **Invite de commandes**.
2. Allez dans le dossier du projet :
   ```powershell
   cd "c:\Users\PREDATOR\Downloads\Projet Interior Pro App\project"
   ```

---

## Étape 2 : Vérifier Git

Vérifiez que Git est installé :
```powershell
git --version
```
- Si vous voyez un numéro de version (ex. `git version 2.43...`) → passez à l’étape 3.
- Si vous avez une erreur « reconnu comme nom d’applet... » → installez Git : https://git-scm.com/download/win puis **fermez et rouvrez** le terminal.

---

## Étape 3 : Voir l’état du dépôt

```powershell
git status
```

- **Si vous voyez « not a git repository »** → le projet n’est pas encore un dépôt Git. Passez à l’**Étape 4A**.
- **Si vous voyez une liste de fichiers modifiés** (dont `components/layout/header.tsx`, `sidebar.tsx`) → passez à l’**Étape 4B**.
- **Si vous voyez « nothing to commit, working tree clean »** → tout est déjà commité ; vous pouvez aller à l’**Étape 5** (push) ou **Étape 6** (Vercel).

---

## Étape 4A : Première fois – initialiser Git

À faire **uniquement** si à l’étape 3 vous aviez « not a git repository » :

```powershell
git init
git add .
git commit -m "Initial commit - INDESIGN PLUS PRO (correctif APP_VERSION)"
git branch -M main
```

Ensuite, **liez** le dépôt à GitHub (remplacez par votre URL de dépôt) :
```powershell
git remote add origin https://github.com/VOTRE_USERNAME/VOTRE_REPO.git
```
Puis passez à l’**Étape 5**.

---

## Étape 4B : Enregistrer les corrections (APP_VERSION)

À faire si `git status` montrait des fichiers modifiés :

```powershell
git add .
git commit -m "fix: import APP_VERSION dans header et sidebar (correction erreur client)"
```

---

## Étape 5 : Envoyer sur GitHub

```powershell
git push -u origin main
```
*(La première fois avec `-u origin main` ; les fois suivantes : `git push`.)*

- Si GitHub demande un **mot de passe** : utilisez un **Personal Access Token** (GitHub → Settings → Developer settings → Personal access tokens), pas votre mot de passe compte.

---

## Étape 6 : Déploiement sur Vercel

Deux possibilités :

### Option A : Déploiement automatique (si le projet est déjà lié à GitHub)

Dès que vous avez fait `git push`, Vercel redéploie tout seul. Allez sur **https://vercel.com/dashboard** → votre projet → onglet **Deployments** et attendez que le dernier déploiement soit **Ready**.

### Option B : Déploiement manuel avec la CLI

Dans le **même** dossier du projet :

```powershell
vercel --prod
```

- Si `vercel` n’est pas reconnu : installez la CLI avec `npm install -g vercel`, puis réessayez.
- Vous pouvez aussi double-cliquer sur **deploy-vercel.bat** à la racine du projet.

---

## Étape 7 : Vérifier les variables d’environnement (Vercel)

Pour éviter l’erreur Supabase en production :

1. Allez sur **https://vercel.com** → votre projet **indesignpluspro** (ou le nom du projet).
2. **Settings** → **Environment Variables**.
3. Vérifiez que sont bien définies pour **Production** :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - (optionnel) `NEXT_PUBLIC_APP_URL` = l’URL de votre site Vercel.
4. Si vous venez de les ajouter ou de les modifier : **Deployments** → ⋮ sur le dernier déploiement → **Redeploy**.

---

## Récap rapide (déjà un dépôt Git + lié à GitHub)

```powershell
cd "c:\Users\PREDATOR\Downloads\Projet Interior Pro App\project"
git add .
git commit -m "fix: import APP_VERSION dans header et sidebar"
git push
```

Puis attendre le déploiement automatique sur Vercel, ou lancer `vercel --prod` si vous préférez déployer à la main.
