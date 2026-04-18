# Importa uberx.sql via PHP (mysqli). Precisas de MySQL/MariaDB a correr.
# Ex.: $env:DB_PASSWORD = "secret"; .\setup-database.ps1
# Se DB_PORT não estiver definido, deteta 3306 (local) ou 3307 (Docker Compose), como run-local.ps1.

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
        Write-Host "Detetado MySQL na porta 3307 (Docker Compose): utilizador uberx."
    } else {
        $env:DB_PORT = "3306"
        Write-Host "Aviso: nenhuma porta 3306/3307 aberta. A usar 3306 (root). Inicia MySQL ou Docker antes de continuar." -ForegroundColor Yellow
    }
}

if (-not $env:DB_DATABASE) { $env:DB_DATABASE = "uberx" }
if (-not $env:DB_USERNAME) { $env:DB_USERNAME = "root" }
if ($null -eq $env:DB_PASSWORD) { $env:DB_PASSWORD = "" }

Write-Host "A importar para ${env:DB_HOST}:${env:DB_PORT} / $env:DB_DATABASE (user=$env:DB_USERNAME) ..."
php scripts/import-db.php
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "A criar utilizadores demo (admin, passageiro, motorista)..."
php scripts/seed-demo-users.php
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Feito. Arranca o site com: .\run-local.ps1"
