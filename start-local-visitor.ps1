[CmdletBinding()]
param(
    [string]$AdminPassword = "booker-local-admin",
    [int]$Port = 8765,
    [switch]$NoOpen
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

if (-not (Test-Path (Join-Path $ProjectRoot "server\visitor_api.py"))) {
    throw "server\visitor_api.py was not found. Run this script from the Booker project root."
}

$healthUrl = "http://127.0.0.1:$Port/api/health"
$pageUrl = "http://127.0.0.1:$Port/visitor.html"

try {
    $health = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 2
    if ($health.ok) {
        Write-Host "Booker visitor API is already running on port $Port." -ForegroundColor Yellow
        Write-Host "Open: $pageUrl" -ForegroundColor Green
        Write-Host "Use the password from the process that started it. If unsure, stop that process and rerun this script." -ForegroundColor Yellow
        if (-not $NoOpen) {
            Start-Process $pageUrl
        }
        return
    }
} catch {
    # Port is free or not serving the Booker API; continue with startup.
}

$env:BOOKER_ADMIN_PASSWORD = $AdminPassword
$process = Start-Process -FilePath python `
    -ArgumentList @(
        ".\server\visitor_api.py",
        "--serve",
        "--host",
        "127.0.0.1",
        "--port",
        [string]$Port,
        "--static-root",
        $ProjectRoot
    ) `
    -WorkingDirectory $ProjectRoot `
    -PassThru `
    -WindowStyle Hidden
Remove-Item Env:\BOOKER_ADMIN_PASSWORD -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2
$health = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 5
if (-not $health.ok) {
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    throw "Booker visitor API failed to start."
}

Write-Host "Booker visitor API started." -ForegroundColor Green
Write-Host "Open: $pageUrl" -ForegroundColor Green
Write-Host "Admin password: $AdminPassword" -ForegroundColor Cyan
Write-Host "Process ID: $($process.Id)" -ForegroundColor Cyan
Write-Host "Stop command: Stop-Process -Id $($process.Id)" -ForegroundColor Yellow

if (-not $NoOpen) {
    Start-Process $pageUrl
}
