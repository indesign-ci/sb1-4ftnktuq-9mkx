#!/bin/bash
# Script à lancer dans Git Bash (clic droit → Git Bash Here dans le dossier du projet)
# Ou depuis Git Bash : cd "/c/Users/PREDATOR/Downloads/Projet Interior Pro App/project" puis ./push-github.sh

set -e
cd "$(dirname "$0")"

echo "============================================"
echo "  Projet : INDESIGN PLUS PRO"
echo "  Dossier : $(pwd)"
echo "============================================"
echo ""

# Vérifier Git
if ! command -v git &> /dev/null; then
    echo "ERREUR : Git n'est pas installe ou pas dans le PATH."
    echo "Installez Git : https://git-scm.com/download/win"
    exit 1
fi
echo "Git : $(git --version)"
echo ""

# Remote GitHub (à modifier si besoin)
GITHUB_URL="https://github.com/indesign-ci/sb1-4ftnktuq-9mkx.git"

if [ ! -d .git ]; then
    echo "Initialisation du depot Git..."
    git init
    git add .
    git commit -m "Initial commit - INDESIGN PLUS PRO"
    git branch -M main
    echo ""
    echo "Depot cree. Ajout de la remote origin..."
    git remote add origin "$GITHUB_URL"
    echo ""
    echo "Envoi vers GitHub (main)..."
    echo "Si on vous demande un mot de passe, utilisez un Personal Access Token :"
    echo "  https://github.com/settings/tokens"
    git push -u origin main
else
    echo "Le depot Git existe deja."
    if ! git remote get-url origin &> /dev/null; then
        git remote add origin "$GITHUB_URL"
    fi
    git add .
    git status
    if [ -n "$(git status --porcelain)" ]; then
        git commit -m "Mise a jour projet" || true
    fi
    echo ""
    echo "Envoi vers GitHub..."
    git push -u origin main
fi

echo ""
echo "Termine."
read -p "Appuyez sur Entree pour fermer."
