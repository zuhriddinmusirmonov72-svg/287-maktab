# 🚀 Netlify Deployment - Boshidan Oxirigacha

## 📋 Sizning ma'lumotlaringiz:

- **Frontend URL**: https://287-maktab-backend.netlify.app
- **Backend URL**: https://two87-maktab-backend.onrender.com
- **GitHub Repo**: https://github.com/zuhriddinmusirmonov72-svg/287-maktab

---

## 🎯 Netlify - Qadamma-qadam:

### 1. **Netlify.com'ga kiring**

👉 https://app.netlify.com

- **Sign up** yoki **Log in** qiling
- GitHub bilan login qiling

---

### 2. **Add new site**

Netlify dashboard'da:

1. **Add new site** tugmasini bosing
2. **Import an existing project** tanlang
3. **Deploy with GitHub** tanlang

---

### 3. **GitHub Repository tanlang**

1. **Configure Netlify on GitHub** (birinchi marta)
2. Repository'larni ko'ring
3. Qidirishda yozing:
   ```
   287-maktab
   ```
4. **zuhriddinmusirmonov72-svg/287-maktab** ni tanlang

---

### 4. **Build Settings**

#### **Branch to deploy:**
```
main
```

#### **Base directory:**
```
(bo'sh qoldiring)
```
*Root directory - frontend root'da*

#### **Build command:**
```
npm run build
```

#### **Publish directory:**
```
dist
```

#### **Functions directory:**
```
(bo'sh qoldiring)
```

---

### 5. **Environment Variables**

⚠️ **BU JUDA MUHIM!**

**Add environment variables** tugmasini bosing:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://two87-maktab-backend.onrender.com/api/v1` |

**Key:** (aniq yozing)
```
VITE_API_URL
```

**Value:** (aniq yozing, oxirida `/api/v1` bo'lishi kerak)
```
https://two87-maktab-backend.onrender.com/api/v1
```

---

### 6. **Deploy Site!**

- **Deploy site** tugmasini bosing
- Deploy jarayoni boshlanadi (1-3 daqiqa)
- **Site deploy in progress** ko'rsatiladi

---

### 7. **Deploy Status**

Deploy jarayonida ko'rasiz:

```
1. Initializing ✅
2. Building ⏳
3. Deploying ⏳
4. Published ✅
```

**Logs'ni ko'ring:**
```
> npm run build
✓ building...
✓ built in 15.32s
```

---

### 8. **Site Name o'zgartirish (ixtiyoriy)**

Default nomi:
```
random-name-12345.netlify.app
```

**O'zgartirish:**
1. **Site settings** → **General**
2. **Change site name**
3. Yangi nom yozing:
   ```
   287-maktab
   ```
4. **Save**

Yangi URL:
```
https://287-maktab.netlify.app
```

---

## 🔧 Netlify Settings (muhim):

### **Site Settings → Build & Deploy**

#### 1. **Build Settings**
```
Base directory: (bo'sh)
Build command: npm run build
Publish directory: dist
```

#### 2. **Environment Variables**
```
VITE_API_URL = https://two87-maktab-backend.onrender.com/api/v1
```

#### 3. **Deploy Contexts**

**Production branch:**
```
main
```

**Branch deploys:**
```
Deploy only production branch
```

---

## 🔄 Avtomatik Deploy:

### GitHub'ga push qilganingizda:

1. ✅ `git push origin main`
2. 🔄 Netlify avtomatik deploy qiladi
3. ⏰ 1-2 daqiqa
4. ✅ Yangi versiya live!

### Manual Deploy:

1. Netlify dashboard → **Deploys**
2. **Trigger deploy** → **Deploy site**
3. Yoki **Retry deploy** (xato bo'lsa)

---

## 🐛 Muammolar va Yechimlar:

### ❌ Build failed
**Sabab**: `package.json` da script yo'q yoki xato

**Yechim:**
1. Netlify logs'ni o'qing
2. Local'da test qiling:
   ```bash
   npm run build
   ```
3. Xatolarni to'g'irlang va push qiling

---

### ❌ 404 Not Found (sahifalar)
**Sabab**: React Router SPA uchun sozlanmagan

**Yechim:**
1. `public/_redirects` faylini yarating:
   ```
   /*    /index.html   200
   ```
2. Yoki `netlify.toml` yarating:
   ```toml
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

---

### ❌ CORS Error / Network Error
**Sabab**: `VITE_API_URL` noto'g'ri yoki yo'q

**Yechim:**
1. Netlify → **Site settings** → **Environment variables**
2. Tekshiring:
   ```
   VITE_API_URL = https://two87-maktab-backend.onrender.com/api/v1
   ```
3. **Redeploy** qiling

---

### ❌ Environment Variable ishlamayapti
**Sabab**: Vite `import.meta.env` ishlatadi, `process.env` emas

**Frontend kodda:**
```javascript
// ✅ TO'G'RI:
const API_URL = import.meta.env.VITE_API_URL

// ❌ NOTO'G'RI:
const API_URL = process.env.VITE_API_URL
```

---

### ❌ API calls ishlamayapti
**Sabab**: Backend URL noto'g'ri yoki backend offline

**Yechim:**
1. Backend ishlayaptimi? Test qiling:
   ```
   https://two87-maktab-backend.onrender.com
   ```
2. Frontend'da API URL to'g'rimi? Tekshiring:
   ```javascript
   console.log(import.meta.env.VITE_API_URL)
   ```
3. Browser Console → Network tab → so'rovlarni ko'ring

---

## 📱 Custom Domain (ixtiyoriy):

Agar o'z domeningiz bo'lsa:

### 1. **Domain qo'shish**
Netlify → **Domain settings** → **Add custom domain**

### 2. **DNS sozlash**
Domain provider'da:
```
A Record: 75.2.60.5
CNAME: 287-maktab.netlify.app
```

### 3. **HTTPS**
Netlify avtomatik SSL sertifikat beradi (Let's Encrypt)

---

## 🔍 Testing:

### 1. **Frontend ochilmoqdimi?**
```
https://287-maktab-backend.netlify.app
```

Ko'rishingiz kerak:
- ✅ Login sahifasi
- ✅ Logo
- ✅ Input'lar

---

### 2. **API bilan bog'lanmoqdimi?**

Login qilishga harakat qiling:
```
Phone: 975661099
Password: Mohidil
```

**Agar ishlamasa:**
- ❌ Browser Console → Network tab
- ❌ Qizil so'rovlarni ko'ring
- ❌ Error message'ni o'qing

---

### 3. **Production test**

✅ **Desktop'dan:**
1. https://287-maktab-backend.netlify.app
2. Login qiling
3. Reels menyusiga boring
4. Video yuklang

✅ **Telefondan:**
1. Telefoningizda browser oching
2. https://287-maktab-backend.netlify.app
3. Login qiling
4. Barcha funksiyalarni test qiling

---

## 📊 Netlify Dashboard:

### **Site Overview**
```
Status: Published
URL: https://287-maktab-backend.netlify.app
Last published: 2 minutes ago
```

### **Deploys**
```
✅ Published (main) - 2 minutes ago
✅ Published (main) - 1 hour ago
❌ Failed (main) - 2 hours ago (agar bo'lsa)
```

### **Functions** (kerak emas)
```
(bo'sh)
```

### **Analytics** (ixtiyoriy)
```
Page views, unique visitors, bandwidth
```

---

## 🎯 Netlify.toml (ixtiyoriy, lekin tavsiya etiladi)

Project root'da yarating `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

Push qiling:
```bash
git add netlify.toml
git commit -m "Add netlify.toml"
git push origin main
```

---

## 💡 Netlify Features:

### ✅ **Avtomatik Deploy**
- Har safar `git push` qilganingizda
- 1-2 daqiqada deploy
- Instant rollback

### ✅ **Preview Deploys**
- Har bir Pull Request uchun
- Test URL: `deploy-preview-123.netlify.app`

### ✅ **Branch Deploys**
- Development branch uchun
- `dev` → `dev--287-maktab.netlify.app`

### ✅ **Split Testing**
- A/B testing
- Traffic distribution

### ✅ **Forms** (kerak emas)
### ✅ **Identity** (kerak emas)
### ✅ **Functions** (kerak emas - backend Render'da)

---

## 🎉 Yakuniy Test:

### 1. **Browser'da:**
```
https://287-maktab-backend.netlify.app
```

### 2. **Login:**
```
Phone: 975661099
Password: Mohidil
```

### 3. **Test qiling:**
- ✅ Guruhlar ko'rinmoqdami?
- ✅ Darslar ochilmoqdami?
- ✅ Reels ishlayaptimi?
- ✅ Video yuklash ishlayaptimi?

---

## 📝 Xulosa:

| Sozlama | Qiymat |
|---------|--------|
| **Build Command** | `npm run build` |
| **Publish Directory** | `dist` |
| **Environment Variable** | `VITE_API_URL=https://two87-maktab-backend.onrender.com/api/v1` |
| **Branch** | `main` |

---

## 🚀 Tayyor!

✅ **Frontend**: https://287-maktab-backend.netlify.app
✅ **Backend**: https://two87-maktab-backend.onrender.com
✅ **Login**: `975661099` / `Mohidil`

**Noutbookingiz o'chib qolsa ham, sayt 24/7 ishlaydi!** 🎉
