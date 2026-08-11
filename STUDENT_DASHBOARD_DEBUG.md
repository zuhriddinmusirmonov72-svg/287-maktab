# Student Dashboard Debug Guide

## Problem
Student paneliga kirmayapdi (bo'sh sahifa yoki xato)

## Tekshirish Qadamlari

### 1. Browser Console (F12)
```javascript
// Login qilingandan keyin console'da tekshiring:

// Token bormi?
console.log('Token:', localStorage.getItem('token'));

// Role to'g'rimi?
console.log('Role:', localStorage.getItem('role'));

// User data bormi?
console.log('User:', JSON.parse(localStorage.getItem('user')));

// API base URL to'g'rimi?
console.log('API URL:', import.meta.env.VITE_API_URL);
```

### 2. Network Tab (F12 → Network)
Login qilingandan keyin quyidagi so'rovlarni tekshiring:

```
✅ POST /api/v1/auth/login         → 200 OK
✅ GET  /api/v1/students/my/groups → 200 OK (yoki 404)
✅ GET  /api/v1/coins/my           → 200 OK (yoki 404)
✅ GET  /api/v1/notifications/my   → 200 OK (yoki 404)
```

### 3. Kuzatilishi Mumkin Bo'lgan Xatolar

#### A. 404 Not Found
```
❌ GET /api/v1/students/my/groups → 404
```
**Sabab:** Backend'da endpoint yo'q yoki noto'g'ri

**Yechim:**
```javascript
// backend/src/routes/students.js
router.get('/my/groups', authMiddleware, async (req, res) => {
  // Implementation
});
```

#### B. 401 Unauthorized
```
❌ GET /api/v1/students/my/groups → 401
```
**Sabab:** Token noto'g'ri yoki muddati o'tgan

**Yechim:** Qayta login qiling

#### C. CORS Error
```
❌ Access to XMLHttpRequest blocked by CORS policy
```
**Sabab:** Backend CORS settings noto'g'ri

**Yechim:** backend/src/app.js'da CORS sozlamalarini tekshiring

#### D. Network Error
```
❌ Network Error / ERR_CONNECTION_REFUSED
```
**Sabab:** Backend ishlamayapti

**Yechim:** 
- Render dashboard → Logs tekshiring
- Backend URL to'g'rimi?

### 4. Console Logs (StudentDashboard)

StudentDashboard ochilganda quyidagi loglar ko'rinishi kerak:

```
🔵 fetchMyGroups boshlandi
🔵 API base URL: https://two87-maktab-backend.onrender.com/api/v1
✅ API response: { data: { data: [...] } }
✅ Groups data: [...]
```

Agar xato bo'lsa:
```
❌ Guruhlarni yuklashda xato: Error message
❌ Error response: { message: "..." }
❌ Error status: 404
```

### 5. Backend Logs (Render)

Render Dashboard → two87-maktab-backend → Logs

Qidiring:
```
GET /api/v1/students/my/groups
POST /api/v1/auth/login
```

Xatolar:
```
❌ 404 Not Found
❌ 401 Unauthorized
❌ 500 Internal Server Error
```

## Eng Ko'p Uchraydigan Muammolar

### 1. Student guruhga qo'shilmagan
```sql
-- Backend database tekshirish
SELECT * FROM student_group WHERE student_id = ?
```

Agar bo'sh bo'lsa, student hech qanday guruhga qo'shilmagan.

**Test uchun:**
- SUPERADMIN panel → Guruhlar → Guruh ochish → Talabalar qo'shish
- Yoki SUPERADMIN panel → O'quvchilar → Student → Guruhga qo'shish

### 2. Backend endpoint yo'q
```javascript
// backend/src/routes/students.js tekshiring
router.get('/my/groups', authMiddleware, async (req, res) => {
  // ...
});
```

### 3. Authentication middleware xato
```javascript
// backend/src/middleware/auth.js
// req.user to'g'ri o'rnatilganmi?
```

### 4. Frontend API URL noto'g'ri
```
# .env.production
VITE_API_URL=https://two87-maktab-backend.onrender.com/api/v1
```

Netlify Environment Variables'da ham to'g'ri bo'lishi kerak!

## Quick Fix Checklist

- [ ] Token localStorage'da bor
- [ ] Role = "STUDENT" (katta harflar bilan)
- [ ] Backend ishlab turibdi (https://two87-maktab-backend.onrender.com/)
- [ ] API URL to'g'ri (.env.production va Netlify)
- [ ] CORS sozlamalari to'g'ri
- [ ] Backend'da `/students/my/groups` endpoint bor
- [ ] Student kamida 1 ta guruhga qo'shilgan
- [ ] Network tab'da xato yo'q
- [ ] Console'da xato yo'q

## Test User

```
Phone: 998901234569
Password: student123
```

Bu user backend seed data'da bo'lishi kerak va kamida 1 ta guruhga qo'shilgan bo'lishi kerak.
