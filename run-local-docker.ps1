# Sobe só o MySQL do docker-compose e arranca o PHP com credenciais da porta 3307.
# Requer Docker Desktop a correr.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "A verificar se o Docker está acessível..."
docker version *> $null
if ($LASTEXITCODE -ne 0) {
	Write-Host ""
	Write-Host "Docker não está a responder (daemon parado ou Docker Desktop fechado)." -ForegroundColor Red
	Write-Host "1) Abre o Docker Desktop no Windows e espera ficar 'Running'." -ForegroundColor Yellow
	Write-Host "2) Volta a executar: .\run-local-docker.ps1" -ForegroundColor Yellow
	exit 1
}

Write-Host "A subir serviço db (MySQL 5.7)..."
docker compose up -d db
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "A aguardar o MySQL ficar pronto (15s)..."
Start-Sleep -Seconds 15

$env:DB_HOST = "127.0.0.1"
$env:DB_PORT = "3307"
$env:DB_DATABASE = "uberx"
$env:DB_USERNAME = "uberx"
$env:DB_PASSWORD = "uberx_local"

& "$PSScriptRoot\run-local.ps1"
