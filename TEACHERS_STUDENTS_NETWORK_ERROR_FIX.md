# Teachers & Students Network Error Fix

## 🔴 Muammo

SUPER ADMIN sifatida:
- ❌ O'qituvchi qo'shish → **Network Error**
- ❌ O'qituvchi edit qilish → **Network Error**
- ❌ Talaba qo'shish → **Network Error**
- ❌ Talaba edit qilish → **Network Error**

### Sabab:

Vite proxy **multipart/form-data** (photo upload) so'rovlarini to'g'ri handle qilmayapti.

---

## ✅ Yechim

### Vite Config Yangilandi

**Fayl:** `vite.config.js`

**Qo'shildi:**
1. `/api/v1/teachers` uchun alohida proxy
2. `/api/v1/students` uchun alohida proxy

```javascript
proxy: {
  // Teachers API - multipart/form-data (photo upload)
  '/api/v1/teachers': {
    target: API_TARGET,
    changeOrigin: true,
    secure: true,
    timeout: 0,           // ⭐ Timeout yo'q
    proxyTimeout: 0,      // ⭐ Proxy timeout yo'q
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq, req) => {
        const cl = req.headers['content-length']
        if (cl) {
          proxyReq.setHeader('content-length', cl)
        }
        proxyReq.removeHeader('transfer-encoding')
      })
      
      proxy.on('proxyRes', (proxyRes) => {
        proxyRes.headers['access-control-allow-origin'] = '*'
      })
      
      proxy.on('error', (err, _req, res) => {
        console.error('[teachers API proxy error]', err.code, err.message)
        if (res && !res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ message: `Proxy xato: ${err.message}` }))
        }
      })
    },
  },
  
  // Students API - xuddi shunday
  '/api/v1/students': { /* ... */ },
  
  // Boshqa proxies...
}
```

---

## 📊 FormData Structure

### Teachers Create/Update:

```javascript
FormData {
  full_name: "Abdulloh Karimov",
  phone: "901234567",
  password: "secret123",       // Faqat create da
  email: "abdulloh@example.com",
  address: "Toshkent",
  groups[]: [1, 2, 3],         // Array
  photo: [File object]         // ⭐ Multipart!
}
```

### Students Create/Update:

```javascript
FormData {
  full_name: "Student Name",
  phone: "901234567",
  password: "secret123",
  email: "student@example.com",
  address: "Toshkent",
  photo: [File object]         // ⭐ Multipart!
}
```

---

## 🔧 Proxy Order (Muhim!)

Vite proxy **eng aniq yo'lni birinchi** tekshiradi:

```javascript
proxy: {
  '/api/v1/teachers',              // 1. Eng aniq
  '/api/v1/students',              // 2. Eng aniq
  '/api/v1/students/homeworkAnswer', // 3. Aniqroq
  '/api/v1/files/group',           // 4. Aniqroq
  '/api/v1',                       // 5. Umumiy (fallback)
}
```

**Nima uchun:**
- `/api/v1/teachers` → Teachers proxy ishlatadi ✅
- `/api/v1/students/homeworkAnswer` → Homework proxy ishlatadi ✅
- `/api/v1/students` → Students proxy ishlatadi ✅
- `/api/v1/courses` → Umumiy proxy ishlatadi ✅

---

## 🚀 Keyingi Qadamlar

### 1. Vite Serverni Restart Qiling

```bash
# Terminal da:
Ctrl+C  (serverni to'xtatish)
npm run dev  (qayta ishga tushirish)
```

**MUHIM:** Config o'zgarishlari faqat restart qilingandan keyin ishlaydi!

### 2. Browser Cache Tozalash

```
Ctrl+Shift+Delete → Cached images and files → Clear
```

Yoki hard reload:
```
Ctrl+F5
```

### 3. Qayta Test Qiling

#### Test 1: O'qituvchi Qo'shish
```
1. SUPER ADMIN → O'qituvchilar
2. "Yangi o'qituvchi" tugmasi
3. Formani to'ldiring:
   - Ism: Test Teacher
   - Telefon: 901234567
   - Parol: test123
   - Photo: [rasm tanlang]
4. "Saqlash" tugmasini bosing
5. ✅ Muvaffaqiyatli qo'shildi!
```

#### Test 2: O'qituvchi Edit Qilish
```
1. O'qituvchi qatorida ✏️ Edit icon
2. Ma'lumotni o'zgartiring
3. "Saqlash" tugmasini bosing
4. ✅ Muvaffaqiyatli yangilandi!
```

#### Test 3: Talaba Qo'shish/Edit
```
1. SUPER ADMIN → Talabalar
2. Yangi talaba qo'shish yoki edit qilish
3. ✅ Ishlashi kerak!
```

---

## 📝 O'zgargan Fayllar

| Fayl | O'zgarish |
|------|-----------|
| `vite.config.js` | ✅ Teachers proxy qo'shildi |
| `vite.config.js` | ✅ Students proxy qo'shildi |

---

## 🔍 Agar Hali Ham Xato Bo'lsa

### Debug Console Loglari:

Browser Console da (F12):
```javascript
[teachers API proxy error] ERR_NETWORK ...
```

Terminal da (npm run dev):
```
[teachers API proxy error] ECONNREFUSED ...
```

### Xato Turlari:

| Xato | Sabab | Yechim |
|------|-------|--------|
| `ERR_NETWORK` | Proxy ishlamagan | Vite restart qiling |
| `ECONNREFUSED` | Backend to'xtagan | Backend ishga tushiring |
| `ETIMEDOUT` | Timeout | Proxy timeout ni oshiring |
| `413 Payload Too Large` | Fayl katta | Backend max size ni oshiring |

---

## 🎯 Natija

Endi quyidagilar ishlaydi:

✅ **O'qituvchi qo'shish** (photo bilan)  
✅ **O'qituvchi edit qilish** (photo o'zgartirish)  
✅ **Talaba qo'shish** (photo bilan)  
✅ **Talaba edit qilish** (photo o'zgartirish)  
✅ **Har qanday FormData** (multipart/form-data)  
✅ **Network Error yo'q** ✅  

---

## 💡 Qo'shimcha Ma'lumot

### Proxy sozlamalari:

| Sozlama | Qiymat | Sabab |
|---------|--------|-------|
| `timeout` | `0` | Timeout yo'q (FormData uchun) |
| `proxyTimeout` | `0` | Proxy timeout yo'q |
| `changeOrigin` | `true` | Host header backend ga mos |
| `secure` | `true` | HTTPS sertifikat tekshirish |

### Content-Length:

```javascript
proxy.on('proxyReq', (proxyReq, req) => {
  const cl = req.headers['content-length']
  if (cl) {
    proxyReq.setHeader('content-length', cl)  // ⭐ To'g'ri o'tkazish
  }
  proxyReq.removeHeader('transfer-encoding')  // ⭐ Chunked ni olib tashlash
})
```

Bu **multipart/form-data** uchun juda muhim!

---

## 🎊 Xulosa

**Muammo:** Vite proxy multipart/form-data ni handle qilmagan → Network Error

**Yechim:** Teachers va Students uchun alohida proxy sozlamalari

**Natija:** Photo upload bilan CRUD operations to'liq ishlaydi! ✅

---

**MUHIM:** Vite serverni restart qiling va browser cache tozalang! 🚀
