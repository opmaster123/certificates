Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " Resetting and Syncing Certificate Database " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Ensure we run from the script's backend directory
Push-Location "$PSScriptRoot/certificates-backend"

try {
    # Generate Prisma Client first
    Write-Host "Generating Prisma Client..." -ForegroundColor Green
    npx prisma generate
    if ($LASTEXITCODE -ne 0) { throw "Prisma generate failed!" }

    # Push schema changes to database (forcing database reset to wipe conflicting columns)
    Write-Host "Pushing schema to PostgreSQL..." -ForegroundColor Green
    npx prisma db push --force-reset
    if ($LASTEXITCODE -ne 0) { throw "Prisma db push failed! Make sure the database Docker container is running." }

    # Run seed script to populate normalized variants from the workspace root
    Write-Host "Running DB seed script..." -ForegroundColor Green
    pnpm --dir "$PSScriptRoot" db:seed
    if ($LASTEXITCODE -ne 0) { throw "Prisma seed script failed!" }

    Write-Host "=============================================" -ForegroundColor Green
    Write-Host " Database reset and seeded successfully! " -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Green
}
catch {
    Write-Error $_
}
finally {
    Pop-Location
}
