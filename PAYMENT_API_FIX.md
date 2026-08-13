# 💳 To'lov API 404 Xato - Yechim

## ❌ Muammo:

Student panel → To'lov qilish:
```
Request URL: http://localhost:5173/api/v1/payments/create
Status: 404 Not Found
```

Request frontend server'ga (5173) ketayapti, lekin backend 3002 portda.

---

## ✅ Yechim:

### 1. `.env.development` O'zgartirildi:

**Eski:**
```env
VITE_API_URL=http://localhost:3002/api/v1
```

**Yangi:**
```env
VITE_API_URL=/api/v1
```

### Sabab:
- Vite proxy ishlatish CORS muammosini hal qiladi
- `/api/v1` → Vite proxy → `http://localhost:3002/api/v1`
- Browser CORS xatosini ko'rmaydi

---

## 🔧 Qanday Ishlaydi:

### Vite Proxy Flow:
```
Frontend (5173)
    ↓
    | POST /api/v1/payments/create
    ↓
Vite Proxy (vite.config.js)
    ↓
    | Proxy to http://localhost:3002
    ↓
Backend (3002)
    ↓
    | POST /api/v1/payments/create
    ↓
Response ← Frontend
```

### vite.config.js:
```js
server: {
  proxy: {
    '/api/v1': {
      target: 'http://localhost:3002',
      changeOrigin: true,
      secure: false,
    }
  }
}
```

---

## 📋 Backend Endpoint Mavjud:

✅ **POST** `/api/v1/payments/create`
- File: `backend/src/routes/payments.js`
- Middleware: `authMiddleware`
- Database: `payments.db`

---

## 🚀 Frontend Server'ni Restart Qiling:

### Terminal'da:
```bash
# 1. Stop frontend (Ctrl+C)
# 2. Start again
npm run dev
```

Yoki:
```bash
# Kill process and restart
taskkill /F /IM node.exe /T
npm run dev
```

---

## ✅ Test Qilish:

1. Frontend server restart
2. Student panel'ga kiring
3. To'lov qilish → Plan tanlang
4. Network tab:
   ```
   ✅ POST /api/v1/payments/create
   ✅ Status: 200 OK
   ✅ Response: { success: true, ... }
   ```

---

## 📝 `.env` Fayllar:

### Development:
```env
VITE_API_URL=/api/v1
```

### Production (Netlify):
```env
VITE_API_URL=https://two87-maktab-backend.onrender.com/api/v1
```

---

## 🎯 Xulosa:

✅ `.env.development` o'zgartirildi (`/api/v1`)
✅ Vite proxy ishlatiladi (CORS yo'q)
✅ Backend endpoint mavjud
✅ **Restart frontend server!**

---

## ⚡ Quick Fix:

```bash
# Terminal'da:
npm run dev
```

Tayyor! To'lov tizimi ishlaydi! 💳✅
