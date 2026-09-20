@echo off
setlocal enabledelayedexpansion
title PoyeriaOpti - Setup
cd /d "%~dp0"

echo ============================================
echo   PoyeriaOpti - Instalador / Setup
echo ============================================
echo.

REM --- Comprobar que Node.js esta instalado ---
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] No se ha encontrado Node.js en este equipo.
    echo Descargalo desde https://nodejs.org ^(version 22 o superior^) e instalalo,
    echo luego vuelve a ejecutar este setup.bat.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo Node.js detectado: %NODE_VERSION%
echo.

REM --- Instalar dependencias ---
echo Instalando dependencias del proyecto ^(npm install^)...
echo Esto puede tardar unos minutos la primera vez.
echo.
call npm install
if errorlevel 1 (
    echo.
    echo [ERROR] npm install ha fallado. Revisa el mensaje de arriba.
    pause
    exit /b 1
)

echo.
echo Dependencias instaladas correctamente.
echo.

:MENU
echo ============================================
echo   Que quieres hacer?
echo ============================================
echo   1. Ejecutar la app en modo desarrollo ^(npm run dev^)
echo   2. Compilar el instalador de Windows ^(npm run dist^)
echo   3. Salir
echo.
set /p OPCION="Elige una opcion (1-3): "

if "%OPCION%"=="1" goto DEV
if "%OPCION%"=="2" goto DIST
if "%OPCION%"=="3" goto FIN

echo Opcion no valida.
echo.
goto MENU

:DEV
echo.
echo Arrancando PoyeriaOpti en modo desarrollo...
echo ^(Cierra esta ventana o pulsa Ctrl+C para detenerla^)
echo.
call npm run dev
goto FIN

:DIST
echo.
echo Compilando el instalador de Windows ^(npm run dist^)...
echo El resultado se guardara en la carpeta "release".
echo.
call npm run dist
if errorlevel 1 (
    echo.
    echo [ERROR] La compilacion ha fallado. Revisa el mensaje de arriba.
    pause
    exit /b 1
)
echo.
echo Listo. Busca el instalador dentro de la carpeta "release".
echo.
pause
goto FIN

:FIN
endlocal
