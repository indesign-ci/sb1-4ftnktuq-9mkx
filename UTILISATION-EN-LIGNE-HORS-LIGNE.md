# Utilisation en ligne et hors ligne – INDESIGN PLUS PRO

## PWA (Progressive Web App)

L’application est une **PWA** : elle peut être **installée** sur ordinateur, portable et tablette, et utilisée **en ligne** et **hors ligne** (avec limites).

### Installation

- **Chrome / Edge (Windows, Mac, Linux)** : Ouvrez l’app en ligne → icône “Installer” dans la barre d’adresse (ou Menu → “Installer INDESIGN PLUS PRO”).
- **Safari (iPhone / iPad)** : Partager → “Sur l’écran d’accueil”.
- **Android** : Menu du navigateur → “Ajouter à l’écran d’accueil” ou proposition d’installation.

### En ligne

- Toutes les fonctionnalités sont disponibles (Supabase, API, synchronisation).
- Utilisable sur **ordinateur**, **portable** et **tablette** (responsive).

### Hors ligne

- **Pages déjà visitées** : accessibles tant qu’elles sont en cache (JS, CSS, données mises en cache).
- **Nouvelles pages / données** : nécessitent une connexion.
- **Page dédiée** : en cas de navigation sans réseau, vous pouvez être redirigé vers `/offline` (message “Vous êtes hors ligne” et bouton Réessayer).

### Responsive

- **Viewport** : adapté mobile, tablette et desktop (`width=device-width`, `viewport-fit=cover`).
- **Manifest** : `orientation: any` pour autoriser portrait et paysage sur tablette.
- **Mise en page** : grilles et breakpoints Tailwind pour une bonne lecture sur tous les écrans.

### Déploiement (en ligne)

- **Vercel** : déploiement automatique depuis GitHub (`main`).
- **Variables d’environnement** : à configurer sur Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, etc.).
- **HTTPS** : requis pour la PWA et le service worker.

### Résumé

| Contexte        | En ligne | Hors ligne (cache) |
|-----------------|----------|---------------------|
| Navigation      | Oui      | Pages déjà visitées |
| Données Supabase| Oui      | Non                 |
| Création / édition | Oui   | Non (sauvegarde à la reconnexion selon l’app) |
| Export / PDF    | Oui      | Limité si non en cache |

Pour une expérience optimale, utilisez l’app **installée** (PWA) avec une connexion quand vous créez ou modifiez des données.
