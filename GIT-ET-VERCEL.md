# Lier le projet à Git puis à Vercel

## Étape 1 : Installer Git (si besoin)

- Téléchargez Git pour Windows : https://git-scm.com/download/win  
- Installez-le, puis **redémarrez le terminal** (ou Cursor).

---

## Étape 2 : Créer un dépôt sur GitHub

1. Allez sur **https://github.com** et connectez-vous.
2. Cliquez sur **"New"** (nouveau dépôt).
3. **Repository name** : par ex. `indesign-plus-pro` ou `projet-interior-pro`.
4. Choisissez **Private** ou **Public**.
5. **Ne cochez pas** "Add a README" (le projet en a déjà ou on en ajoute un).
6. Cliquez sur **"Create repository"**.
7. **Copiez l’URL du dépôt** (ex. `https://github.com/VOTRE_USERNAME/indesign-plus-pro.git`).

---

## Étape 3 : Initialiser Git et pousser le code

Ouvrez un **terminal** (PowerShell ou CMD) à la racine du projet :

```bash
cd "c:\Users\PREDATOR\Downloads\Projet Interior Pro App\project"
```

Puis exécutez les commandes **une par une** :

```bash
git init
git add .
git commit -m "Initial commit - INDESIGN PLUS PRO"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/VOTRE_REPO.git
git push -u origin main
```

**Remplacez** `VOTRE_USERNAME` et `VOTRE_REPO` par votre nom d’utilisateur GitHub et le nom du dépôt.

- Si GitHub demande une **authentification** : utilisez un **Personal Access Token** (Settings → Developer settings → Personal access tokens) à la place du mot de passe.

---

## Étape 4 : Lier le dépôt à Vercel

1. Allez sur **https://vercel.com/dashboard**.
2. Cliquez sur **"Add New..."** → **"Project"**.
3. Choisissez **"Import Git Repository"**.
4. Si GitHub n’est pas connecté : **"Connect Git Account"** et autorisez Vercel.
5. Sélectionnez le dépôt **indesign-plus-pro** (ou le nom que vous avez choisi).
6. Cliquez sur **"Import"**.
7. **Framework Preset** : Next.js (normalement détecté).
8. **Root Directory** : laissez vide.
9. **Build Command** : `npm run build`
10. **Environment Variables** : ajoutez au minimum :
    - `NEXT_PUBLIC_SUPABASE_URL` = votre URL Supabase
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = votre clé anon Supabase
    - `NEXT_PUBLIC_APP_URL` = `https://votre-projet.vercel.app` (à ajuster après le 1er déploiement)
11. Cliquez sur **"Deploy"**.

À chaque **push** sur `main`, Vercel redéploiera automatiquement.

---

## Récap des commandes Git (après la première fois)

Pour envoyer des mises à jour vers GitHub (et déclencher un déploiement Vercel) :

```bash
cd "c:\Users\PREDATOR\Downloads\Projet Interior Pro App\project"
git add .
git commit -m "Description de vos modifications"
git push
```
