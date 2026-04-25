# Testa a integração do PWA com as APIs Laravel (mesmo contrato que o app usa).
# Pré-requisitos:
#   1) .\run-local-docker.ps1  (ou PHP na 8888 + MySQL na 3307)
#   2) Opcional: php scripts/seed-demo-users.php  (com DB_* iguais ao stack)
#
# Uso: powershell -ExecutionPolicy Bypass -File .\scripts\test-pwa-integration.ps1
# Env opcional: $env:API_BASE = "http://localhost:8080"   (Docker web)
#               $env:API_BASE = "http://localhost:8888" (PHP embutido)

$ErrorActionPreference = "Stop"
$api = if ($env:API_BASE) { $env:API_BASE.TrimEnd('/') } else { "http://localhost:8080" }

Write-Host "API_BASE = $api"

function Test-DockerCli {
	try {
		& docker version *> $null
		return ($LASTEXITCODE -eq 0)
	} catch {
		return $false
	}
}

if (-not (Test-DockerCli)) {
	Write-Host "Aviso: Docker CLI não responde nesta sessão (normal em alguns ambientes remotos)." -ForegroundColor Yellow
} else {
	Write-Host "Docker CLI OK."
}

function Invoke-FormPost([string]$Path, [hashtable]$Fields) {
	$parts = @()
	foreach ($k in $Fields.Keys) {
		$enc = [System.Uri]::EscapeDataString([string]$Fields[$k])
		$parts += "$k=$enc"
	}
	$body = $parts -join '&'
	return Invoke-RestMethod -Uri "$api$Path" -Method Post -ContentType "application/x-www-form-urlencoded; charset=UTF-8" -Body $body
}

function Build-QueryUri([string]$Path, [hashtable]$Query) {
	$parts = @()
	foreach ($k in $Query.Keys) {
		$enc = [System.Uri]::EscapeDataString([string]$Query[$k])
		$parts += "$k=$enc"
	}
	return "${api}${Path}?" + ($parts -join '&')
}

Write-Host ""
Write-Host '1) Login passageiro POST /user/login'
$login = Invoke-FormPost "/user/login" @{
	email         = "passageiro@demo.local"
	password      = "Admin123!"
	login_by      = "manual"
	device_type   = "android"
	device_token  = "pwa-integration-test"
}
if (-not $login.success) {
	Write-Host "FALHOU login: $($login | ConvertTo-Json -Compress)" -ForegroundColor Red
	Write-Host "Confirma que o PHP está na 8888 e que existe o owner (php scripts/seed-demo-users.php)." -ForegroundColor Yellow
	exit 1
}
$tokPreview = if ($login.token -and $login.token.Length -ge 8) { $login.token.Substring(0, 8) + "..." } else { $login.token }
Write-Host "OK id=$($login.id) token=$tokPreview"

Write-Host ""
Write-Host '2) Corrida em progresso GET /user/requestinprogress'
$ripUri = Build-QueryUri "/user/requestinprogress" @{ token = $login.token; id = [string]$login.id }
$rip = Invoke-RestMethod -Uri $ripUri -Method Get
Write-Host ($rip | ConvertTo-Json -Compress)

Write-Host ""
Write-Host '3) Criar corrida POST /user/createrequest'
$cr = Invoke-FormPost "/user/createrequest" @{
	token         = $login.token
	id            = [string]$login.id
	type          = "1"
	latitude      = "-22.66255"
	longitude     = "-42.50312"
	d_latitude    = "-22.67000"
	d_longitude   = "-42.51000"
	payment_mode  = "1"
}
Write-Host ($cr | ConvertTo-Json -Depth 4 -Compress)

if (-not $cr.success) {
	Write-Host "createrequest devolveu success=false (pode ser sem motoristas, dívida, etc.)." -ForegroundColor Yellow
	exit 0
}

Write-Host ""
Write-Host '4) request_id em progresso de novo'
$rip2Uri = Build-QueryUri "/user/requestinprogress" @{ token = $login.token; id = [string]$login.id }
$rip2 = Invoke-RestMethod -Uri $rip2Uri -Method Get
$rid = [int]$rip2.request_id
Write-Host "request_id = $rid"
if ($rid -gt 0) {
	Write-Host ""
	Write-Host '5) Detalhe GET /user/getrequest'
	$grUri = Build-QueryUri "/user/getrequest" @{ token = $login.token; id = [string]$login.id; request_id = [string]$rid }
	$gr = Invoke-RestMethod -Uri $grUri -Method Get
	Write-Host ($gr | ConvertTo-Json -Depth 3 -Compress)
}

Write-Host ""
Write-Host '--- API OK: login, criar corrida, estado. ---' -ForegroundColor Green
Write-Host 'PWA: cd pwa-rider; npm run dev; abrir http://localhost:5173' -ForegroundColor Cyan
