# 1) MariaDB  2) Importa SQL (se pedido)  3) Servidor PHP
param(
    [switch]$SkipImport
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

& "$PSScriptRoot\start-mariadb.ps1"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (-not $SkipImport) {
    & "$PSScriptRoot\setup-database.ps1"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

& "$PSScriptRoot\run-local.ps1"
