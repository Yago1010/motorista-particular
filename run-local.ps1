# Servidor PHP embutido (PHP 8+ com patches do projeto).
# Antes: .\start-mariadb.ps1 e .\setup-database.ps1 (ou tudo de uma vez: .\start-all.ps1)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not $env:DB_HOST) { $env:DB_HOST = "127.0.0.1" }

function Test-PortLocal([int]$Port) {
    try {
        $c = New-Object System.Net.Sockets.TcpClient
        $iar = $c.BeginConnect('127.0.0.1', $Port, $null, $null)
        if (-not $iar.AsyncWaitHandle.WaitOne(900, $false)) { try { $c.Close() } catch {}; return $false }
        $c.EndConnect($iar)
        $c.Close()
        return $true
    } catch { return $false }
}

if (-not $env:DB_PORT) {
    $p3306 = Test-PortLocal 3306
    $p3307 = Test-PortLocal 3307
    if ($p3306) {
        $env:DB_PORT = "3306"
    } elseif ($p3307) {
        $env:DB_PORT = "3307"
        if (-not $env:DB_USERNAME) { $env:DB_USERNAME = "uberx" }
        if ($null -eq $env:DB_PASSWORD) { $env:DB_PASSWORD = "uberx_local" }
        Write-Host "MySQL do Docker Compose detetado (porta 3307, utilizador uberx)."
    } else {
        $env:DB_PORT = "3306"
    }
}

if (-not $env:DB_DATABASE) { $env:DB_DATABASE = "uberx" }
if (-not $env:DB_USERNAME) { $env:DB_USERNAME = "root" }
if ($null -eq $env:DB_PASSWORD) { $env:DB_PASSWORD = "" }
if (-not $env:APP_URL) { $env:APP_URL = "http://localhost:8888" }
if (-not $env:APP_DEBUG) { $env:APP_DEBUG = "true" }

Write-Host "Uber1 em $env:APP_URL (Ctrl+C para parar)"
Write-Host "Portal:  $env:APP_URL/"
Write-Host "Passageiro: $env:APP_URL/pwa-rider/  (requer npm run build se dist nao existir)"
Write-Host "Motorista:  $env:APP_URL/pwa-motoristas/"
Write-Host "Admin:      $env:APP_URL/admin/login"
Write-Host "Hot reload dev: npm run dev  -> :3000 passageiro, :3001 motorista"
Write-Host "MySQL: ${env:DB_HOST}:${env:DB_PORT} / $env:DB_DATABASE / user=$env:DB_USERNAME"
Write-Host "Erro 2002: inicia MySQL/MariaDB local (porta 3306) ou, com Docker: docker compose up -d db (porta 3307)."

# O servidor embutido do PHP no Windows nem sempre herda DB_* nos workers; putenv + $_ENV + $_SERVER.
$prependPath = Join-Path $PSScriptRoot "bootstrap\db-env-prepend.php"
$dbMap = [ordered]@{
    DB_HOST     = "$($env:DB_HOST)"
    DB_PORT     = "$($env:DB_PORT)"
    DB_DATABASE = "$($env:DB_DATABASE)"
    DB_USERNAME = "$($env:DB_USERNAME)"
    DB_PASSWORD = if ($null -eq $env:DB_PASSWORD) { "" } else { "$($env:DB_PASSWORD)" }
}
$json = ($dbMap | ConvertTo-Json -Compress)
$b64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($json))
$phpPutenv = @"
<?php
`$__db = json_decode(base64_decode('$b64'), true) ?: array();
foreach (`$__db as `$k => `$v) {
	`$v = (string) `$v;
	putenv(`$k . '=' . `$v);
	`$_ENV[`$k] = `$v;
	`$_SERVER[`$k] = `$v;
}
"@
[System.IO.File]::WriteAllText($prependPath, $phpPutenv, [System.Text.UTF8Encoding]::new($false))

Write-Host "A testar ligação MySQL (mesmo ambiente que o servidor)..."
& php -d "auto_prepend_file=$prependPath" (Join-Path $PSScriptRoot "scripts\check-db-connection.php")
if ($LASTEXITCODE -ne 0) {
	Write-Host ""
	Write-Host "Não foi possível ligar à base de dados. O erro SQLSTATE[2002] no site vem daqui." -ForegroundColor Red
	Write-Host "Opções: MySQL local na 3306 + base uberx (.\setup-database.ps1) OU Docker: .\run-local-docker.ps1" -ForegroundColor Yellow
	Write-Host "Se o MySQL acabou de arrancar, espera ~10s e volta a executar este script." -ForegroundColor Yellow
	exit 1
}

Write-Host "Cron local: GET /server/schedulerequest a cada 30s (timeout/rotacao motorista)"
$scheduleScript = Join-Path $PSScriptRoot "scripts\schedule-request-loop.ps1"
if (Test-Path $scheduleScript) {
    Start-Process powershell -ArgumentList "-NoProfile","-WindowStyle","Hidden","-File",$scheduleScript -WorkingDirectory $PSScriptRoot | Out-Null
}

php -d "auto_prepend_file=$prependPath" -S localhost:8888 router.php
