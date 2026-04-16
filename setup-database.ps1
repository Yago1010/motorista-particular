# Importa uberx.sql via PHP (mysqli). Precisas de MySQL/MariaDB a correr.
# Ex.: $env:DB_PASSWORD = "secret"; .\setup-database.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not $env:DB_HOST) { $env:DB_HOST = "127.0.0.1" }
if (-not $env:DB_DATABASE) { $env:DB_DATABASE = "uberx" }
if (-not $env:DB_USERNAME) { $env:DB_USERNAME = "root" }
if ($null -eq $env:DB_PASSWORD) { $env:DB_PASSWORD = "" }

Write-Host "A importar para $env:DB_HOST / $env:DB_DATABASE ..."
php scripts/import-db.php
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "A criar utilizadores demo (admin, passageiro, motorista)..."
php scripts/seed-demo-users.php
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Feito. Arranca o site com: .\run-local.ps1"
