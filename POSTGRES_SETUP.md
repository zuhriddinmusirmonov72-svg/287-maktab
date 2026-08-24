# PostgreSQL O'rnatish va Sozlash

## 1. PostgreSQL xizmatini ishga tushirish

CMD yoki PowerShell'ni **Administrator** sifatida oching va bajaring:

```bash
# PostgreSQL xizmatini ishga tushirish
net start postgresql-x64-18

# Yoki Registry'da xizmat nomini tekshiring:
# "postgresql-x64-18" yoki "postgresql-18"
```

## 2. Database yaratish

PostgreSQL Shell (psql) ochib quyidagi buyruqlarni bajaring:

```bash
# psql ochish (Start Menu → PostgreSQL → SQL Shell (psql))
# Host: localhost
# Port: 5432
# Database: postgres
# Username: postgres
# Password: (o'rnatishda kiritgan parol)

# Database yaratish
CREATE DATABASE maktab287;

# Chiqish
\q
```

## 3. Backend .env faylini sozlash

`backend/.env` faylidagi `DATABASE_URL`ni yangilang:

```
DATABASE_URL=postgresql://postgres:PAROLINGIZ@localhost:5432/maktab287
```

**PAROLINGIZ** o'rniga PostgreSQL o'rnatishda kiritgan parolni yozing.

## 4. Backend'ni ishga tushirish

```bash
cd backend
npm start
```

Backend avtomatik ravishda:
- Barcha jadvallarni yaratadi
- SUPER ADMIN yaratadi (975661099 / Mohidil)
- Default chat guruhini yaratadi (287-Maktab Umumiy Chat)

## 5. Frontend'ni ishga tushirish

```bash
npm run dev
```

## Xatolik yuz bersa:

### PostgreSQL ishlamayapti:
```bash
# Windows Services'da tekshirish
services.msc

# PostgreSQL xizmatini qidiring va Start bosing
```

### Port 5432 band:
```bash
# Port tekshirish
netstat -ano | findstr :5432

# PostgreSQL konfiguratsiyasini tekshirish
# C:\Program Files\PostgreSQL\18\data\postgresql.conf
```

### Connection refused:
- PostgreSQL xizmati ishga tushganligini tekshiring
- Parol to'g'ri kiritilganligini tekshiring
- Database maktab287 yaratilganligini tekshiring
