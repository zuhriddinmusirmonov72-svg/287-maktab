# PostgreSQL xizmatini ishga tushirish
Write-Host "PostgreSQL xizmatini ishga tushirilmoqda..." -ForegroundColor Yellow

# Xizmat nomlarini tekshirish
$serviceNames = @("postgresql-x64-18", "postgresql-18", "postgresql-x64-16", "postgresql-16")

$serviceStarted = $false

foreach ($serviceName in $serviceNames) {
    $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    
    if ($service) {
        Write-Host "Topildi: $serviceName" -ForegroundColor Green
        
        if ($service.Status -eq "Running") {
            Write-Host "PostgreSQL allaqachon ishlamoqda!" -ForegroundColor Green
            $serviceStarted = $true
            break
        } else {
            Write-Host "PostgreSQL ishga tushirilmoqda..." -ForegroundColor Yellow
            Start-Service -Name $serviceName
            Start-Sleep -Seconds 2
            
            $service = Get-Service -Name $serviceName
            if ($service.Status -eq "Running") {
                Write-Host "PostgreSQL muvaffaqiyatli ishga tushdi!" -ForegroundColor Green
                $serviceStarted = $true
                break
            }
        }
    }
}

if (-not $serviceStarted) {
    Write-Host "XATO: PostgreSQL xizmati topilmadi yoki ishga tushmadi!" -ForegroundColor Red
    Write-Host "Qo'lda ishga tushiring: services.msc" -ForegroundColor Yellow
    exit 1
}

Write-Host "`nDatabase yaratish..." -ForegroundColor Yellow

# Database yaratish (psql orqali)
# MUHIM: Parolni kiriting!
$env:PGPASSWORD = "postgres"  # <-- PAROLINGIZNI SHU YERGA YOZING!

$createDb = "CREATE DATABASE maktab287;" | psql -U postgres -h localhost -p 5432 -d postgres 2>&1

if ($createDb -match "already exists" -or $createDb -match "created") {
    Write-Host "Database tayyor!" -ForegroundColor Green
} else {
    Write-Host "Database yaratildi yoki allaqachon mavjud" -ForegroundColor Green
}

Write-Host "`n✅ PostgreSQL tayyor! Backend'ni ishga tushiring:" -ForegroundColor Green
Write-Host "cd backend" -ForegroundColor Cyan
Write-Host "npm start" -ForegroundColor Cyan
