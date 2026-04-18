# Sobe a stack completa no Docker: MySQL (3307) + Apache/PHP Laravel (8080).
# Terminal 1: este script (ou docker compose up sem -d para ver logs).
# Terminal 2: cd pwa-rider && npm run dev  -> http://localhost:5173
#
# Uso: powershell -ExecutionPolicy Bypass -File .\run-docker-stack.ps1
# Com logs no primeiro plano: docker compose up --build

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "A verificar Docker..."
docker version *> $null
if ($LASTEXITCODE -ne 0) {
	Write-Host "Docker nao responde. Abre o Docker Desktop e tenta de novo." -ForegroundColor Red
	exit 1
}

Write-Host "A construir e a subir web + db..."
docker compose up -d --build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Pronto." -ForegroundColor Green
Write-Host "  API / site Laravel: http://localhost:8080"
Write-Host "  MySQL na maquina:     127.0.0.1:3307 (user uberx / pass uberx_local)"
Write-Host ""
Write-Host "Terminal 2 (PWA):" -ForegroundColor Cyan
Write-Host "  cd pwa-rider"
Write-Host "  npm install"
Write-Host "  npm run dev"
Write-Host "  Abre http://localhost:5173"
Write-Host ""
Write-Host "Ver logs do Apache: docker compose logs -f web" -ForegroundColor Yellow
