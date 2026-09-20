@echo off
setlocal
title PoyeriaOpti - Publicar release en GitHub
cd /d "%~dp0"

echo ============================================
echo   PoyeriaOpti - Publicar nueva version
echo ============================================
echo.

REM --- Comprobar Node.js ---
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] No se ha encontrado Node.js en este equipo.
    echo Descargalo desde https://nodejs.org e instalalo primero.
    echo.
    pause
    exit /b 1
)

REM --- Comprobar que las dependencias estan instaladas ---
if not exist "node_modules" (
    echo No se han encontrado las dependencias instaladas.
    echo Ejecuta primero setup.bat ^(opcion 1 - instalar^) antes de publicar.
    echo.
    pause
    exit /b 1
)

REM --- Leer la version desde package.json ---
for /f "delims=" %%v in ('node -p "require('./package.json').version"') do set VERSION=%%v

echo Version actual en package.json: %VERSION%
echo.
echo Esto va a:
echo   1. Subir el codigo del proyecto a GitHub ^(hace falta al menos un
echo      commit para que GitHub pueda crear la etiqueta de la release^)
echo   2. Compilar la app ^(instalador .exe, .blockmap y latest.yml^)
echo   3. Crear/actualizar la release "v%VERSION%" en GitHub, publicada
echo      ^(no como borrador^), y subir esos 3 archivos
echo.
echo Repositorio: oiergonzalezth-png/PoyeriaOpti
echo.
echo IMPORTANTE: si la version "v%VERSION%" ya existe como release PUBLICADA
echo en GitHub, sube el numero de version en package.json antes de
echo continuar ^(por ejemplo de 1.0.2 a 1.0.3^).
echo.

REM --- Token de GitHub para poder publicar ---
if "%GH_TOKEN%"=="" (
    if "%GITHUB_TOKEN%"=="" (
        echo Hace falta un GitHub Personal Access Token con permiso "repo"
        echo para poder subir el codigo y publicar la release.
        echo No se guarda en ningun archivo, solo se usa en esta ventana.
        echo.
        set /p GH_TOKEN="Pega aqui tu GitHub token: "
        echo.
    ) else (
        set GH_TOKEN=%GITHUB_TOKEN%
    )
)

set /p CONFIRMA="Todo listo. Publicar ahora? (S/N): "
if /i not "%CONFIRMA%"=="S" (
    echo.
    echo Cancelado.
    pause
    exit /b 0
)

REM --- Comprobar Git ---
where git >nul 2>nul
if errorlevel 1 (
    echo.
    echo [ERROR] No se ha encontrado Git en este equipo.
    echo Hace falta para poder subir el codigo a GitHub ^(condicion necesaria
    echo para que la release publicada pueda tener una etiqueta valida^).
    echo Instalalo desde https://git-scm.com/download/win y vuelve a intentarlo.
    echo.
    pause
    exit /b 1
)

echo.
echo Sincronizando el codigo del proyecto con GitHub...

if not exist ".git" (
    git init -q
    git branch -M main
)

git remote get-url origin >nul 2>nul
if errorlevel 1 (
    git remote add origin https://github.com/oiergonzalezth-png/PoyeriaOpti.git
)

git config user.email >nul 2>nul
if errorlevel 1 git config user.email "poyeriaopti@local"
git config user.name >nul 2>nul
if errorlevel 1 git config user.name "PoyeriaOpti Publish"

git add -A
git commit -q --allow-empty -m "Release v%VERSION%"

git remote set-url origin https://%GH_TOKEN%@github.com/oiergonzalezth-png/PoyeriaOpti.git
git push -u origin HEAD:main
set PUSH_RESULT=%errorlevel%

if not "%PUSH_RESULT%"=="0" (
    echo El repositorio remoto ya tenia contenido ^(por ejemplo un README
    echo creado al crear el repo^). Fusionando ese historial con el tuyo...
    git fetch origin main
    git merge --allow-unrelated-histories -X ours origin/main -m "Merge remote GitHub history"
    git push -u origin HEAD:main
    set PUSH_RESULT=%errorlevel%
)

git remote set-url origin https://github.com/oiergonzalezth-png/PoyeriaOpti.git

if not "%PUSH_RESULT%"=="0" (
    echo.
    echo [ERROR] No se ha podido subir el codigo a GitHub. Revisa que el
    echo token tenga permiso "repo" y que tengas conexion.
    pause
    exit /b 1
)

echo.
echo Comprobando y limpiando borradores duplicados de v%VERSION% en GitHub...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\cleanup-draft-releases.ps1" -Owner "oiergonzalezth-png" -Repo "PoyeriaOpti" -Tag "v%VERSION%" -Token "%GH_TOKEN%"
if errorlevel 1 (
    echo.
    echo No se ha podido continuar con la publicacion. Revisa el mensaje de arriba.
    pause
    exit /b 1
)

echo.
echo Compilando y publicando...
echo.
call npm run release
if errorlevel 1 (
    echo.
    echo [ERROR] La publicacion ha fallado. Revisa el mensaje de arriba.
    echo Causas tipicas: token sin permisos, version ya publicada, o sin conexion.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Release v%VERSION% publicada correctamente.
echo   PoyeriaOpti.exe, PoyeriaOpti.exe.blockmap y latest.yml
echo   ya estan subidos a GitHub Releases.
echo ============================================
echo.
pause
endlocal
