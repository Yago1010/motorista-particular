# Inicia MariaDB se ainda não estiver na porta 3306.
# Requer MariaDB instalado (ex.: winget install MariaDB.Server).
# O ficheiro de config é copiado para %TEMP% para evitar falhas com espaços em --defaults-file.

$ErrorActionPreference = "Stop"
$mysqld = "C:\Program Files\MariaDB 12.2\bin\mysqld.exe"
if (-not (Test-Path $mysqld)) {
    Write-Host "mysqld não encontrado em $mysqld. Ajusta o caminho ou instala MariaDB.Server."
    exit 1
}

$tcp = Test-NetConnection -ComputerName 127.0.0.1 -Port 3306 -WarningAction SilentlyContinue
if ($tcp.TcpTestSucceeded) {
    Write-Host "MariaDB já está a escutar em 3306."
    exit 0
}

$iniSrc = Join-Path $PSScriptRoot "docker\mariadb-local.ini"
if (-not (Test-Path $iniSrc)) {
    Write-Host "Falta: $iniSrc"
    exit 1
}
$iniTmp = Join-Path $env:TEMP "mariadb-uber-local.ini"
Copy-Item -Path $iniSrc -Destination $iniTmp -Force

$err = Join-Path $env:TEMP "mysqld-uber.err.log"
$out = Join-Path $env:TEMP "mysqld-uber.out.log"
Remove-Item $err, $out -ErrorAction SilentlyContinue
Start-Process -FilePath $mysqld -ArgumentList @("--defaults-file=$iniTmp", "--console") -WindowStyle Hidden -RedirectStandardError $err -RedirectStandardOutput $out

$ok = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    if ((Test-NetConnection -ComputerName 127.0.0.1 -Port 3306 -WarningAction SilentlyContinue).TcpTestSucceeded) {
        $ok = $true
        break
    }
}
if (-not $ok) {
    Write-Host "MariaDB não arrancou. Vê $err e $out"
    if (Test-Path $err) { Get-Content $err -Tail 25 }
    exit 1
}
Write-Host "MariaDB pronto em 127.0.0.1:3306"
