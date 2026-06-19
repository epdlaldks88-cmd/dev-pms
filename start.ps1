# L.PMS Frontend Start Script
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Starting L.PMS Frontend..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; npm run dev"

Write-Host ""
Write-Host "Frontend starting..." -ForegroundColor Green
Write-Host "  http://localhost:5173"
Write-Host ""
Write-Host "Open http://localhost:5173 in your browser."
