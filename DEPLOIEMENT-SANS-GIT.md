# Déployer SANS Git (recommandé si Git bloque)

Si Git / GitHub ne fonctionnent pas, vous pouvez **déployer directement avec Vercel CLI** : le code de votre dossier est envoyé à Vercel sans passer par GitHub.

---

## Étapes

### 1. Ouvrir PowerShell en tant qu’administrateur (ou un terminal)

- Clic droit sur le menu Démarrer → **Windows PowerShell (Admin)**  
  ou ouvrez un terminal dans Cursor.

### 2. Installer Vercel CLI

Collez et exécutez :

```powershell
npm install -g vercel
```

### 3. Aller dans le dossier du projet

```powershell
cd "C:\Users\PREDATOR\Downloads\Projet Interior Pro App\project"
```

### 4. Lancer le déploiement

```powershell
vercel --prod
```

- La première fois : un lien s’ouvre dans le navigateur pour vous connecter à Vercel. Validez, puis revenez au terminal.
- **Set up and deploy?** → tapez **Y** puis Entrée.
- **Link to existing project?** → **Y** si vous avez déjà le projet *indesignpluspro* sur Vercel, sinon **N**.
- Si on vous demande le nom du projet : indiquez **indesignpluspro** (ou le nom de votre projet Vercel).

À la fin, une URL s’affiche (ex. `https://indesignpluspro.vercel.app`) : c’est votre site en ligne.

### 5. Variables d’environnement

Dans **https://vercel.com/dashboard** → votre projet → **Settings** → **Environment Variables**, ajoutez :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` (ex. `https://indesignpluspro.vercel.app`)

Puis refaites **une fois** :

```powershell
vercel --prod
```

---

## Résumé

| Avec Git (si ça marche) | Sans Git (Vercel CLI) |
|-------------------------|------------------------|
| Push sur GitHub → Vercel déploie automatiquement | Vous lancez `vercel --prod` à chaque mise à jour |
| Nécessite Git + compte GitHub + config | Nécessite seulement Node.js + compte Vercel |

Pour l’instant, en cas de blocage avec Git, utilisez **Vercel CLI** comme ci-dessus.
