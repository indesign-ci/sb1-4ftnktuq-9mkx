@echo off
chcp 65001 >nul
echo ============================================
echo   INDESIGN PLUS PRO - Initialisation Git
echo ============================================
echo.

cd /d "%~dp0"

where git >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Git n'est pas installe ou pas dans le PATH.
    echo Installez Git : https://git-scm.com/download/win
    pause
    exit /b 1
)

if exist .git (
    echo Le depot Git existe deja.
    git status
    echo.
    echo Pour pousser vers GitHub, utilisez :
    echo   git remote add origin https://github.com/VOTRE_USER/VOTRE_REPO.git
    echo   git push -u origin main
    echo.
    pause
    exit /b 0
)

echo Initialisation du depot...
git init
git add .
git commit -m "Initial commit - INDESIGN PLUS PRO"
git branch -M main

echo.
echo Depot initialise. Prochaine etape :
echo 1. Creez un depot sur GitHub (New repository).
echo 2. Puis executez dans ce dossier :
echo    git remote add origin https://github.com/VOTRE_USER/VOTRE_REPO.git
echo    git push -u origin main
echo.
echo Remplacez VOTRE_USER et VOTRE_REPO par votre compte et le nom du repo.
echo.
pause
