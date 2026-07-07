# Video 404 Error - Diagnostika va Yechim

## 🔴 Muammo

Video ochishda **404 Not Found** xatosi:

```
Video yuklash xatosi: {status: 404, data: {...}, message: 'Yuklash xatosi (404)'}
```

### Sabab:

Backend video faylni **topmiyor** yoki video URL **noto'g'ri**.

---

## ✅ Yechim

### 1. Aniq Error Logging Qo'shildi

**Fayllar:**
- `src/api/api.js` (loadVideoForPlayback)
- `src/pages/GroupDetails.jsx` (handlePlayVideo)

**O'zgarish:**

```javascript
// api.js da:
if (last?.status === 404) {
  console.error('[Video] 404 - Video fayl topilmadi');
  console.error('[Video] Sinab ko\'rilgan URL lar:', candidates);
  throw {
    status: 404,
    message: 'Yuklash xatosi (404)',
    details: 'Video fayl serverda topilmadi'
  };
}

// GroupDetails.jsx da:
catch (err) {
  console.error('=== VIDEO YUKLASH XATO ===');
  console.error('❌ Status:', err.status);
  console.error('❌ Data:', err.data);
  
  if (err.status === 404) {
    toast.error('Video fayl topilmadi! Backend admin ga murojaat qiling.', 
                { duration: 8000 });
  }
}
```

---

## 🔍 Diagnostika

### Endi consoleda ko'rasiz:

```javascript
[Video] Sinab ko'riladigan URL lar: [...]
[Video] HEAD tekshiruv: { url: "...", status: 404 }
[Video] ❌ Barcha urinishlar muvaffaqiyatsiz: [...]
[Video] 404 - Video fayl topilmadi
[Video] Sinab ko'rilgan URL lar: [
  "/api/v1/files/62/123",
  "https://najot-edu.softwareengineer.uz/api/v1/files/files/video.mp4",
  // ...
]

=== VIDEO YUKLASH XATO ===
❌ Status: 404
❌ Data: {...}
❌ Message: Yuklash xatosi (404)
```

---

## 🛠️ Muammoni Aniqlash

### 1. Console Loglarni Tekshiring

**Browser Console (F12):**

```javascript
[Video] Sinab ko'riladigan URL lar: [...]
```

Bu yerda backend qanday URL larni sinab ko'rayotganini ko'rasiz.

### 2. Network Tab Tekshiring

**F12 → Network → Filter: "video" yoki "files"**

Qaysi so'rov 404 qaytaryapti:
- Request URL: `https://najot-edu.softwareengineer.uz/api/v1/files/62/123`
- Status: `404 Not Found`

### 3. Backend Loglarni Tekshiring

Backend terminalda:
```
GET /api/v1/files/62/123 404
File not found: /uploads/videos/video.mp4
```

---

## 📊 Backend Muammolari

### Muammo 1: Video Fayl Yo'q

**Sabab:** Video yuklangan, lekin fayl serverda yo'q.

**Tekshirish:**
```bash
# Backend serverda:
ls -la /var/www/app/uploads/videos/
```

**Yechim:** Video ni qayta yuklash yoki backend admin ga murojaat.

---

### Muammo 2: URL Noto'g'ri

**Sabab:** Backend URL formatini o'zgartirgan.

**Tekshirish:**
Console da ko'rsatilgan URL larni Postman yoki curl bilan test qiling:

```bash
curl -I "https://najot-edu.softwareengineer.uz/api/v1/files/62/123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Yechim:** Backend API dokumentatsiyasiga qarab URL formatini to'g'irlash.

---

### Muammo 3: Permission Denied

**Sabab:** Backend video faylga kirish huquqi yo'q.

**Backend logda:**
```
EACCES: permission denied, open '/uploads/videos/video.mp4'
```

**Yechim:**
```bash
# Backend serverda:
chmod 755 /var/www/app/uploads/
chmod 644 /var/www/app/uploads/videos/*.mp4
```

---

### Muammo 4: Nginx Sozlamasi Noto'g'ri

**Sabab:** Nginx static files uchun to'g'ri sozlanmagan.

**Tekshirish:**
```nginx
# /etc/nginx/sites-available/default

location /uploads/ {
    alias /var/www/app/uploads/;
    try_files $uri =404;
}
```

**Yechim:** Nginx configni to'g'irlash va restart qilish:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔧 Frontend Muammolari

### Muammo: groupId Noto'g'ri

**Sabab:** `groupId` undefined yoki noto'g'ri.

**Tekshirish:**
```javascript
console.log('🎬 Video ochish — guruh ID:', id, file);
```

Agar `id` undefined bo'lsa, URL noto'g'ri tuziladi:
```
/api/v1/files/undefined/123  // ❌ Noto'g'ri
```

**Yechim:** GroupDetails component da `id` to'g'ri o'tkazilganini tekshiring.

---

## 🎯 Yechim Qadamlari

### 1. Console Loglarni O'qing

```javascript
[Video] Sinab ko'riladigan URL lar: [...]
```

Birinchi URL ni copy qiling.

### 2. Postman da Test Qiling

```
GET https://najot-edu.softwareengineer.uz/api/v1/files/62/123
Headers:
  Authorization: Bearer YOUR_TOKEN
```

Agar 404 bo'lsa → Backend muammosi ✅  
Agar 200 bo'lsa → Frontend URL building muammosi ✅

### 3. Backend Admin ga Xabar Bering

Agar backend muammosi bo'lsa:

**Xabar:**
```
Video 404 xatosi:
- URL: /api/v1/files/62/123
- Status: 404 Not Found
- Video ID: 123
- Group ID: 62

Iltimos tekshiring:
1. Video fayl serverda bormi? /uploads/videos/...
2. Database da video record bormi?
3. Nginx sozlamalari to'g'rimi?
```

---

## 📝 O'zgargan Fayllar

| Fayl | O'zgarish |
|------|-----------|
| `src/api/api.js` | ✅ 404 uchun aniq xato xabari |
| `src/api/api.js` | ✅ Sinab ko'rilgan URL larni log qilish |
| `src/pages/GroupDetails.jsx` | ✅ Batafsil error logging |
| `src/pages/GroupDetails.jsx` | ✅ 404 uchun alohida toast xabari |

---

## ✅ Natija

Endi video 404 xatosi aniqroq:

✅ **Console da:** Sinab ko'rilgan URL lar  
✅ **Console da:** 404 xato tafsiloti  
✅ **Toast:** "Video fayl topilmadi! Backend admin ga murojaat qiling."  
✅ **Diagnostika:** Qaysi URL 404 qaytarganini bilish mumkin  

---

## 🎊 Xulosa

**Muammo:** Video 404 - fayl topilmadi

**Diagnostika:** Console loglarni o'qing va backend bilan URL ni test qiling

**Yechim:** Backend video faylni to'g'rilash yoki URL formatini moslashtirish

**Keyingi qadam:** Console loglarni yuboring, backend muammosini hal qilamiz! 🔍
