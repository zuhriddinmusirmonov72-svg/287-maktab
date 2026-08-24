# 🗄️ PostgreSQL Migration Guide

## ⚠️ Muammo:
NeDB (file-based database) Render.com'da ishlamaydi chunki:
- Render free plan **ephemeral filesystem** ishlatadi
- Server restart bo'lganda fayllar o'chib ketadi
- Ma'lumotlar doimiy saqlanmaydi

## ✅ Yechim: PostgreSQL

PostgreSQL - real production database, ma'lumotlar doimiy saqlanadi.

---

## 📋 **1. Local PostgreSQL O'rnatish (Development)**

### **Windows:**

**1. PostgreSQL yuklab oling:**
```
https://www.postgresql.org/download/windows/
```

**2. Installer'ni ishga tushiring:**
- Version: 16.x (latest)
- Port: 5432 (default)
- Password: `postgres` (yoki boshqa parol)

**3. Installation check:**
```cmd
psql --version
```

**4. Database yaratish:**
```cmd
psql -U postgres
```

PostgreSQL shell'da:
```sql
CREATE DATABASE maktab287;
\q
```

### **Mac (Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
createdb maktab287
```

### **Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb maktab287
```

---

## 📋 **2. Render PostgreSQL Database Yaratish (Production)**

### **Qadamlar:**

1. **Render Dashboard ga kiring:** https://dashboard.render.com

2. **New Database yaratish:**
   - "New +" → "PostgreSQL" ni tanlang
   - **Name:** `287-maktab-db`
   - **Database:** `maktab287`
   - **User:** `maktab287_user`
   - **Region:** Frankfurt (EU Central) yoki Singapore (Asia)
   - **PostgreSQL Version:** 16
   - **Plan:** Free
   - **Create Database** bosing

3. **Database URL ni ko'chirish:**
   
   Database yaratilgandan keyin **Info** tabida quyidagilarni topasiz:
   
   - **Internal Database URL** (backend uchun):
     ```
     postgresql://maktab287_user:xxxxxxxxxxx@dpg-xxxxx.frankfurt-postgres.render.com/maktab287
     ```
   
   - **External Database URL** (local dev uchun):
     ```
     postgresql://maktab287_user:xxxxxxxxxxx@dpg-xxxxx.frankfurt-postgres.render.com/maktab287?ssl=true
     ```

4. **Environment Variable sozlash:**
   
   Render backend service'ga o'ting:
   - **Settings → Environment** ga boring
   - **Add Environment Variable** bosing
   - **Key:** `DATABASE_URL`
   - **Value:** Internal Database URL ni qo'ying
   - **Save Changes** bosing

---

## 📋 **3. Backend Kodini Yangilash**

### **✅ Qilingan o'zgarishlar:**

1. **`package.json`** - `pg` kutubxonasi qo'shildi
2. **`backend/src/db-postgres.js`** - PostgreSQL connection
3. **`backend/.env`** - DATABASE_URL qo'shildi
4. **`backend/src/app.js`** - PostgreSQL initialization

### **🔄 Keyingi qadamlar (hozir):**

Barcha route'larni PostgreSQL query'lariga o'zgartirish kerak:

**NeDB (eski):**
```javascript
const users = await db.find(collections.users, { phone });
```

**PostgreSQL (yangi):**
```javascript
const result = await query('SELECT * FROM users WHERE phone = $1', [phone]);
const users = result.rows;
```

---

## 📋 **4. Local Test (Development)**

### **1. PostgreSQL ishlab turganini tekshiring:**

```cmd
psql -U postgres -d maktab287
```

PostgreSQL shell'da:
```sql
\dt
```
(Jadvallar ro'yxati ko'rinadi)

### **2. Backend'ni ishga tushiring:**

```cmd
cd backend
npm run dev
```

Console'da ko'rish kerak:
```
✅ PostgreSQL connected
📦 Creating PostgreSQL tables...
✅ PostgreSQL tables created!
👑 SUPER ADMIN: 975661099 / Mohidil
```

### **3. API test:**

```bash
curl http://localhost:3002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"975661099","password":"Mohidil"}'
```

---

## 📋 **5. Production Deployment**

### **Render Backend Environment Variables:**

1. **Render Dashboard** → Backend Service → **Environment**
2. Quyidagi variables qo'shing:

```
DATABASE_URL=postgresql://maktab287_user:xxxxx@dpg-xxxxx.frankfurt-postgres.render.com/maktab287
NODE_ENV=production
PORT=3002
JWT_SECRET=najot_talim_super_secret_key_2024
```

3. **Manual Deploy** bosing

4. **Logs** ni kuzating:
```
✅ PostgreSQL connected
✅ PostgreSQL tables created!
```

---

## 📋 **6. Migration Checklist**

### **Phase 1: Database Setup** ✅
- [x] PostgreSQL o'rnatildi
- [x] Database yaratildi (`maktab287`)
- [x] `pg` package qo'shildi
- [x] `db-postgres.js` yaratildi
- [x] `.env` ga `DATABASE_URL` qo'shildi

### **Phase 2: Code Migration** (Keyingi qadam)
- [ ] `auth.js` - login/register PostgreSQL'ga
- [ ] `users.js` - CRUD operations
- [ ] `students.js` - CRUD operations
- [ ] `teachers.js` - CRUD operations
- [ ] `groups.js` - CRUD operations
- [ ] `lessons.js` - CRUD operations
- [ ] `homework.js` - CRUD operations
- [ ] `attendance.js` - CRUD operations
- [ ] `payments.js` - CRUD operations
- [ ] `files.js` - CRUD operations
- [ ] `notifications.js` - CRUD operations

### **Phase 3: Testing**
- [ ] Local test (localhost)
- [ ] Render test (production)
- [ ] Frontend integration test
- [ ] Ma'lumotlar saqlanishini tekshirish (1 hafta kutish)

---

## 🔧 **Troubleshooting**

### **Error: ECONNREFUSED**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Yechim:**
- PostgreSQL ishlab turganini tekshiring: `pg_ctl status`
- Ishga tushiring: `pg_ctl start` (Windows) yoki `brew services start postgresql` (Mac)

### **Error: password authentication failed**
```
Error: password authentication failed for user "postgres"
```

**Yechim:**
- `.env` faylda `DATABASE_URL` ni tekshiring
- PostgreSQL parolni reset qiling:
  ```sql
  ALTER USER postgres PASSWORD 'postgres';
  ```

### **Error: database "maktab287" does not exist**
```
Error: database "maktab287" does not exist
```

**Yechim:**
```bash
createdb maktab287
```

### **Render: Connection timed out**
```
Error: Connection timed out
```

**Yechim:**
- Render Dashboard → Database → **Info** → URL to'g'riligini tekshiring
- Backend service restart qiling

---

## 📚 **Qo'shimcha Resurslar**

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Render PostgreSQL Guide: https://docs.render.com/databases
- Node.js `pg` package: https://node-postgres.com/

---

## ⏭️ **Keyingi Qadam**

Barcha route'larni PostgreSQL'ga migration qilish kerak. 

**Sizga:**
1. Local PostgreSQL o'rnatish
2. Database yaratish
3. Backend ishga tushirish va test qilish
4. Render PostgreSQL database yaratish

**Menga:**
1. Barcha route'larni PostgreSQL'ga o'zgartirish
2. Test qilish
3. Production'ga deploy qilish

**Hozir qaysi qadamni bajaryapmiz?** 🚀
