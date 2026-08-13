# 🚀 Production Deployment Guide

## ✅ Qilingan o'zgarishlar:

### 1. **SUPER ADMIN - Homework Check Panel**
- ✅ Mobile responsive qilindi (425px, 768px breakpoints)
- ✅ Avatar, font sizes, paddings mobile uchun optimizatsiya
- ✅ Ball slider va input responsive
- ✅ Fayllar upload section mobile uchun moslab qilindi
- ✅ Buttons full-width mobile da

### 2. **API Configuration**
- ✅ Production backend URL hardcoded: `https://two87-maktab-backend.onrender.com/api/v1`
- ✅ Development mode: Vite proxy (`/api/v1`)
- ✅ Console debug log qo'shildi

---

## 📦 Deployment Status:

### **Backend (Render)**
- URL: https://two87-maktab-backend.onrender.com
- Status: ✅ Running
- Auto-deploy: GitHub push'dan keyin

### **Frontend (Netlify)**
- URL: https://287-maktab-backend.netlify.app
- Status: 🔄 Deploying...
- Auto-deploy: GitHub push'dan keyin (1-2 min)

---

## ⚠️ VIDEO YUKLASH 404 XATOSI

### **Muammo:**
```
POST https://287-maktab-backend.netlify.app/api/v1/files/group/1/upload 404
```

### **Sabab:**
Browser cache eski frontend kodini eslab qolgan. Eski kodda API_BASE_URL noto'g'ri edi.

### **Yechim:**

#### **1. Browser Cache Tozalash (Foydalanuvchi uchun)**

**Usul 1 - Hard Reload:**
```
Ctrl + Shift + R  (Chrome, Firefox)
Ctrl + F5         (Windows)
Cmd + Shift + R   (Mac)
```

**Usul 2 - Console Command:**
1. `F12` bosing (DevTools ochish)
2. Console tab'ga o'ting
3. Quyidagi kodni copy-paste qiling:

```javascript
caches.keys().then(k=>k.forEach(c=>caches.delete(c)));
localStorage.clear();
sessionStorage.clear();
setTimeout(()=>location.reload(true),500);
```

**Usul 3 - Incognito Mode:**
- Yangi Incognito/Private window ochib, saytni test qiling

#### **2. Netlify Deploy Tekshirish**

1. https://app.netlify.com ga kiring
2. **287-maktab-backend** siteni oching
3. **Deploys** tab'ga o'ting
4. Oxirgi deploy **Published** statusda bo'lishini tekshiring

Agar **Failed** yoki **Building** bo'lsa:
- 2-3 daqiqa kuting
- **Trigger deploy → Clear cache and deploy site** bosing

#### **3. API URL Tekshirish (Console)**

Sayt ochgandan keyin Console'da ko'ring:

```
🔧 API Configuration: {
  isDev: false,
  VITE_API_URL: undefined,
  resolvedURL: "https://two87-maktab-backend.onrender.com/api/v1"
}
```

✅ **To'g'ri:** `resolvedURL` Render backend URL'i
❌ **Noto'g'ri:** `resolvedURL` Netlify URL'i

---

## 🔧 Test Qilish:

### **1. Login Test**
```
URL: https://287-maktab-backend.netlify.app
Username: 975661099
Password: Mohidil
```

### **2. Video Upload Test**
1. SUPER ADMIN → Guruhlar → GroupDetails
2. Lesson → Video yuklash
3. Fayl tanla → Yuklash
4. **Xato bo'lmasligi kerak!**

### **3. Mobile Responsive Test**
1. `F12` → Toggle device toolbar
2. Device: iPhone SE, Pixel 5
3. SUPER ADMIN → Uy vazifalar → Tekshirish
4. **Layout to'g'ri ko'rinishi kerak**

---

## 📱 Mobile Test (Real Device)

### **Telefon orqali test:**
1. https://287-maktab-backend.netlify.app ochish
2. Cache tozalash:
   - Chrome: Settings → Privacy → Clear browsing data
   - Safari: Settings → Safari → Clear History and Website Data
3. Login: `975661099` / `Mohidil`
4. Uy vazifalar tekshirish sahifasiga kirish
5. Layout to'g'ri ko'rinishi va tugmalar ishlashi kerak

---

## ❓ Xatoliklar va Yechimlar

### **404 Error (Video upload)**
- **Sabab:** Browser cache eski kod
- **Yechim:** Yuqoridagi cache tozalash usullaridan foydalaning

### **Network Error (Login)**
- **Sabab:** Backend Render'da uxlab qolgan (cold start)
- **Yechim:** 30-60 soniya kuting, qayta urinib ko'ring

### **CORS Error**
- **Sabab:** Backend CORS sozlamalari noto'g'ri
- **Yechim:** Backend `app.js` da CORS config tekshiring

### **Deployment Failed**
- **Sabab:** Build error, environment variable yo'q
- **Yechim:** Netlify Deploys → Failed deploy → Logs ni o'qing

---

## 🔗 Foydali Linklar

- **Frontend:** https://287-maktab-backend.netlify.app
- **Backend:** https://two87-maktab-backend.onrender.com
- **GitHub:** https://github.com/zuhriddinmusirmonov72-svg/287-maktab
- **Netlify Dashboard:** https://app.netlify.com
- **Render Dashboard:** https://dashboard.render.com

---

## 📝 Keyingi Qadamlar

1. ✅ Git push qilindi
2. 🔄 Netlify auto-deploy (1-2 min)
3. ⏳ Browser cache tozalash
4. ✅ Test qilish
5. ✅ Production ready!

**Deploy vaqti:** ~2-3 daqiqa
**Last Updated:** 2026-08-13
