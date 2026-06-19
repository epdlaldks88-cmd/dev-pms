# L.PMS Frontend Setup Script
Write-Host "========================================"
Write-Host "  L.PMS Frontend - Setup"
Write-Host "========================================"
Write-Host ""

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "[1/1] Frontend dependencies..."
Set-Location "$root\frontend"
npm install --legacy-peer-deps

Write-Host ""
Write-Host "Setup complete! Run start.ps1 to launch." -ForegroundColor Green
Read-Host "Press Enter to exit"
