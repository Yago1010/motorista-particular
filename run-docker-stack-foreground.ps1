# Mesma stack que run-docker-stack.ps1, mas com logs no primeiro plano (Ctrl+C para parar).
# Uso: powershell -ExecutionPolicy Bypass -File .\run-docker-stack-foreground.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

docker version *> $null
if ($LASTEXITCODE -ne 0) {
	Write-Host "Docker nao responde. Abre o Docker Desktop." -ForegroundColor Red
	exit 1
}

Write-Host "A subir web + db (logs no primeiro plano). Ctrl+C para parar os containers." -ForegroundColor Yellow
docker compose up --build
