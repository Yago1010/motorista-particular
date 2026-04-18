# Abre DOIS terminais separados:
#   1) Docker: web (8080) + db (3307) com logs
#   2) PWA: Vite em http://localhost:5173 (proxy -> 8080)
#
# Uso (na raiz do projeto): powershell -ExecutionPolicy Bypass -File .\start-web-and-pwa.ps1

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

$dockerScript = Join-Path $root "run-docker-stack-foreground.ps1"
if (-not (Test-Path $dockerScript)) {
	Write-Host "Ficheiro em falta: $dockerScript" -ForegroundColor Red
	exit 1
}

Write-Host "A abrir Terminal 1: Docker (web + db)..." -ForegroundColor Cyan
Start-Process powershell.exe -WorkingDirectory $root -ArgumentList @(
	"-NoExit",
	"-ExecutionPolicy", "Bypass",
	"-File", $dockerScript
)

Start-Sleep -Seconds 2

Write-Host "A abrir Terminal 2: PWA (npm run dev)..." -ForegroundColor Cyan
$pwaDir = Join-Path $root "pwa-rider"
$cmd = "if (-not (Test-Path node_modules)) { npm install }; npm run dev"
Start-Process powershell.exe -WorkingDirectory $pwaDir -ArgumentList @(
	"-NoExit",
	"-ExecutionPolicy", "Bypass",
	"-Command", $cmd
)

Write-Host ""
Write-Host "Terminais abertos." -ForegroundColor Green
Write-Host "  Laravel: http://localhost:8080"
Write-Host "  PWA:     http://localhost:5173"
Write-Host ""
Write-Host "Nota: o primeiro terminal precisa do Docker Desktop a correr." -ForegroundColor Yellow
