#!/usr/bin/env powershell
# Setup Rápido - Uber Clone Laravel Local
# Executa: Verificação, Composer, Banco, Seeds, Servidor

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  🚀 SETUP UBER CLONE - LARAVEL LOCAL" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# ========== PASSO 1: VERIFICAÇÕES ==========
Write-Host "[1/5] Verificando Requisitos..." -ForegroundColor Yellow

# PHP
Write-Host "  ✓ PHP" -NoNewline
$phpVersion = php -v 2>$null | Select-Object -First 1
if ($phpVersion) {
    Write-Host " ✅ $phpVersion" -ForegroundColor Green
} else {
    Write-Host " ❌ Não encontrado" -ForegroundColor Red
    exit 1
}

# Composer
Write-Host "  ✓ Composer" -NoNewline
$composerVersion = composer --version 2>$null
if ($composerVersion) {
    Write-Host " ✅ $composerVersion" -ForegroundColor Green
} else {
    Write-Host " ❌ Não encontrado" -ForegroundColor Red
    Write-Host "    Instale em: https://getcomposer.org" -ForegroundColor Yellow
    exit 1
}

# MySQL Port Check
Write-Host "  ✓ MySQL" -NoNewline
$mysqlPort = $null
foreach ($port in @(3306, 3307)) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $ar = $client.BeginConnect("127.0.0.1", $port, $null, $null)
        if ($ar.AsyncWaitHandle.WaitOne(500, $false)) {
            $client.EndConnect($ar)
            $client.Close()
            $mysqlPort = $port
            break
        }
        $client.Close()
    } catch {}
}

if ($mysqlPort) {
    Write-Host " ✅ Rodando na porta $mysqlPort" -ForegroundColor Green
    $env:DB_PORT = $mysqlPort
} else {
    Write-Host " ⚠️  Não detectado na porta 3306/3307" -ForegroundColor Yellow
    Write-Host "    Inicie MySQL/MariaDB antes de continuar" -ForegroundColor Yellow
    $continue = Read-Host "    Continuar mesmo assim? (s/n)"
    if ($continue -ne "s") { exit 1 }
}

Write-Host ""

# ========== PASSO 2: COMPOSER INSTALL ==========
Write-Host "[2/5] Instalando Dependências Composer..." -ForegroundColor Yellow

if (-not (Test-Path "vendor")) {
    Write-Host "  Executando: composer install --no-scripts"
    try {
        composer install --no-scripts --prefer-dist -q 2>&1 | ForEach-Object { Write-Host "  $_" }
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ⚠️  Tentando com --ignore-platform-reqs..." -ForegroundColor Yellow
            composer install --no-scripts --ignore-platform-reqs --prefer-dist -q
        }
        Write-Host "  ✅ Dependências instaladas" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Erro ao instalar: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  ✅ Dependências já instaladas (vendor/ existe)" -ForegroundColor Green
}
Write-Host ""

# ========== PASSO 3: SETUP DATABASE ==========
Write-Host "[3/5] Configurando Banco de Dados..." -ForegroundColor Yellow

if (-not $env:DB_HOST) { $env:DB_HOST = "127.0.0.1" }
if (-not $env:DB_PORT) { $env:DB_PORT = "3306" }
if (-not $env:DB_DATABASE) { $env:DB_DATABASE = "uberx" }
if (-not $env:DB_USERNAME) { $env:DB_USERNAME = "root" }
if ($null -eq $env:DB_PASSWORD) { $env:DB_PASSWORD = "" }

Write-Host "  Host: $($env:DB_HOST):$($env:DB_PORT)" -ForegroundColor Gray
Write-Host "  Database: $($env:DB_DATABASE)" -ForegroundColor Gray
Write-Host "  User: $($env:DB_USERNAME)" -ForegroundColor Gray

# Atualizar db-env-prepend.php
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

# Testar conexão
Write-Host "  Testando conexão..."
$checkScript = Join-Path $PSScriptRoot "scripts\check-db-connection.php"
$result = php -d "auto_prepend_file=$prependPath" $checkScript 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Conexão OK" -ForegroundColor Green
    $result | Select-String "OK" | ForEach-Object { Write-Host "  $_" -ForegroundColor Green }
} else {
    Write-Host "  ⚠️  Aviso: Não foi possível conectar ao MySQL" -ForegroundColor Yellow
    Write-Host "  Certifique-se que MySQL está rodando" -ForegroundColor Yellow
    $result | ForEach-Object { Write-Host "  $_" }
}
Write-Host ""

# ========== PASSO 4: SEEDS (OPCIONAL) ==========
Write-Host "[4/5] Seeding do Banco (Opcional)..." -ForegroundColor Yellow

$seedAnswer = Read-Host "  Executar seeds? (s/n)"
if ($seedAnswer -eq "s") {
    try {
        Write-Host "  Executando seed-admin..."
        php -d "auto_prepend_file=$prependPath" scripts/seed-admin.php
        Write-Host "  ✅ Admin seed OK" -ForegroundColor Green
        
        Write-Host "  Executando seed-demo-users..."
        php -d "auto_prepend_file=$prependPath" scripts/seed-demo-users.php
        Write-Host "  ✅ Demo users seed OK" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  Erro ao executar seeds: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Pulado" -ForegroundColor Gray
}
Write-Host ""

# ========== PASSO 5: RODAR SERVIDOR ==========
Write-Host "[5/5] Iniciando Servidor Local..." -ForegroundColor Yellow
Write-Host ""

if (-not $env:APP_URL) { $env:APP_URL = "http://localhost:8888" }
if (-not $env:APP_DEBUG) { $env:APP_DEBUG = "true" }

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🚀 SERVIDOR INICIADO COM SUCESSO!   ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Acesse: $($env:APP_URL)" -ForegroundColor Green
Write-Host "  Parando o servidor: Ctrl+C" -ForegroundColor Gray
Write-Host ""

php -d "auto_prepend_file=$prependPath" -S localhost:8888 router.php
