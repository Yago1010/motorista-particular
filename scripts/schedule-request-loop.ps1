$ErrorActionPreference = "SilentlyContinue"
$url = if ($env:APP_URL) { "$($env:APP_URL.TrimEnd('/'))/server/schedulerequest" } else { "http://localhost:8888/server/schedulerequest" }
while ($true) {
    try { Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 15 | Out-Null } catch {}
    Start-Sleep -Seconds 30
}
