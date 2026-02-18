@echo off
cd /d "%~dp0"
echo Suppression du cache Next.js (.next)...
if exist .next (
  rmdir /s /q .next
  echo Cache supprime.
) else (
  echo Pas de dossier .next, rien a supprimer.
)
echo.
echo Demarrage du serveur sur http://localhost:3000
echo Fermez cette fenetre pour arreter le serveur.
echo.
npm run dev
pause
