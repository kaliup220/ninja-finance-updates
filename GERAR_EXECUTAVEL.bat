@echo off
setlocal
chcp 65001 >nul
title Ninja Finance - Gerar Instalador
set "PROJECT_DIR=%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js nao encontrado. Instale Node.js e npm antes de gerar o instalador.
 pause
 exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
 echo npm nao encontrado. Instale Node.js com npm antes de gerar o instalador.
 pause
 exit /b 1
)
cd /d "%PROJECT_DIR%"
echo [1/2] Instalando dependencias do projeto...
call npm install
if errorlevel 1 goto fail
echo.
echo [2/2] Gerando instalador Windows...
call npm run dist
if errorlevel 1 goto fail
echo.
echo Build concluido. Abrindo a pasta release...
start "" "%PROJECT_DIR%release"
echo Procure Ninja-Finance-Setup-1.0.2.exe (instalador)
pause
exit /b 0
:fail
echo.
echo O build falhou. Nao apague dados do Ninja Finance antigo.
pause
exit /b 1
