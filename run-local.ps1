# Servidor PHP embutido (PHP 8+ com patches do projeto).
# Antes: .\start-mariadb.ps1 e .\setup-database.ps1 (ou tudo de uma vez: .\start-all.ps1)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not $env:DB_HOST) { $env:DB_HOST = "127.0.0.1" }
if (-not $env:DB_DATABASE) { $env:DB_DATABASE = "uberx" }
if (-not $env:DB_USERNAME) { $env:DB_USERNAME = "root" }
if ($null -eq $env:DB_PASSWORD) { $env:DB_PASSWORD = "" }
if (-not $env:APP_URL) { $env:APP_URL = "http://localhost:8888" }
if (-not $env:APP_DEBUG) { $env:APP_DEBUG = "true" }

Write-Host "Uber1 em $env:APP_URL (Ctrl+C para parar)"
Write-Host "MySQL: $env:DB_HOST / $env:DB_DATABASE / user=$env:DB_USERNAME"
php -S localhost:8888 router.php
