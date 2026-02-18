@echo off
chcp 65001 >nul
echo ============================================
echo   INDESIGN PLUS PRO - Deploiement Vercel
echo ============================================
echo.

cd /d "%~dp0"

where vercel >nul 2>&1
if errorlevel 1 (
    echo Vercel CLI n'est pas installe. Installation...
    call npm install -g vercel
    if errorlevel 1 (
        echo [ERREUR] Echec de l'installation. Lancez : npm install -g vercel
        pause
        exit /b 1
    )
    echo.
)

echo Lancement du deploiement en PRODUCTION...
echo.
vercel --prod

echo.
pause
