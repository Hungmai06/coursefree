Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  COURSEFREE - Starting Full-Stack Platform" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

Write-Host "Starting Backend API on http://localhost:5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\Backend'; npm.cmd run dev"

Start-Sleep -Seconds 2

Write-Host "Starting Frontend UI on http://localhost:3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\Frontend'; npm.cmd run dev"

Write-Host "`nBoth services are starting in dedicated windows:" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor Green

