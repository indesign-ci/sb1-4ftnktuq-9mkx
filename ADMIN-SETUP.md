# Prendre la main en tant qu'administrateur

Sophie Martin est un compte fictif de démonstration. Pour utiliser l'application avec **votre propre compte admin** :

---

## Étape 1 : Créer votre compte utilisateur

1. Allez sur **Supabase Dashboard** : https://supabase.com/dashboard  
2. Sélectionnez votre projet  
3. **Authentication** → **Users** → **Add user**  
4. Entrez votre **email** et **mot de passe**  
5. Cliquez sur **Create user**

---

## Étape 2 : Configurer votre profil administrateur

1. Dans Supabase : **SQL Editor** → **New query**  
2. Ouvrez le fichier `supabase/CONFIGURER_ADMIN.sql`  
3. **Remplacez** les 4 valeurs :
   - `votre@email.com` → l'email que vous avez utilisé à l'étape 1
   - `Votre Prénom` → votre prénom
   - `Votre Nom` → votre nom
4. Copiez le script modifié et exécutez-le dans le SQL Editor

---

## Étape 3 : Vous connecter

1. Allez sur votre application (ex. https://votre-site.vercel.app)  
2. Connectez-vous avec l'email et le mot de passe créés à l'étape 1  
3. Votre nom et le rôle « Admin » s'afficheront dans la barre latérale

---

**Note :** Le script associe votre compte à l'entreprise « INDESIGN PLUS PRO ». Vous pouvez modifier les informations de l'entreprise dans **Paramètres** après connexion.
