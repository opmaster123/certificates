Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Starting Khutta-SaaS Certificate Services  " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Get the directory of the running script
$RepoRoot = $PSScriptRoot

# 1. Start Frontend (Vite)
Write-Host "Launching Frontend (Vite) dev server in a new window..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RepoRoot'; Write-Host 'Starting Vite Frontend...' -ForegroundColor Cyan; pnpm dev:frontend"

# 2. Start Backend (NestJS)
Write-Host "Launching Backend (NestJS) dev server in a new window..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RepoRoot'; Write-Host 'Starting NestJS Backend...' -ForegroundColor Cyan; pnpm dev:backend"

# 3. Start Prisma Studio
Write-Host "Launching Prisma Studio in a new window..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RepoRoot\certificates-backend'; Write-Host 'Starting Prisma Studio...' -ForegroundColor Cyan; npx prisma studio --config prisma.config.ts --browser none"

Write-Host "---------------------------------------------" -ForegroundColor Cyan
Write-Host "All processes have been launched! Check the new windows." -ForegroundColor Yellow
