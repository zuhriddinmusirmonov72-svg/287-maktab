# 🚀 Render.com Deployment - To'liq Yo'riqnoma

## 📋 Sizning ma'lumotlaringiz:

- **Backend URL**: https://two87-maktab-backend.onrender.com
- **Frontend URL**: https://287-maktab-backend.netlify.app
- **GitHub Repo**: https://github.com/zuhriddinmusirmonov72-svg/287-maktab

---

## 🔧 Render.com Sozlamalari:

### 1. **Root Directory**
```
backend
```
*Bu juda muhim! Backend papkasi root sifatida belgilanishi kerak.*

### 2. **Build Command**
```bash
npm install
```

### 3. **Start Command**
```bash
node src/app.js
```

### 4. **Environment Variables** (Render Dashboard)

Render.com dashboard → Your Service → Environment → Add Environment Variable:

| Key | Value | Izoh |
|-----|-------|------|
| `NODE_ENV` | `production` | Production rejim |
| `PORT` | `3002` | (ixtiyoriy, Render avtomatik beradi) |
| `JWT_SECRET` | `your-super-secret-jwt-key-12345` | JWT token uchun |

---

## 📦 Render.com - Qadamma-qadam:

### Agar yangi service yaratish kerak bo'lsa:

#### 1. **Render.com'ga kiring**
- https://dashboard.render.com
- GitHub bilan login qiling

#### 2. **New Web Service**
- **New +** → **Web Service**

#### 3. **GitHub Repo tanlang**
```
zuhriddinmusirmonov72-svg/287-maktab
```

#### 4. **Sozlamalar**

**Name:**
```
two87-maktab-backend
```

**Region:**
```
Oregon (US West)
```
yoki eng yaqin region

**Branch:**
```
main
```

**Root Directory:**
```
backend
```
⚠️ **BU JUDA MUHIM!** Backend papkasi ichidagi fayllarni ko'radi

**Runtime:**
```
Node
```

**Build Command:**
```
npm install
```

**Start Command:**
```
node src/app.js
```

**Instance Type:**
```
Free
```

#### 5. **Environment Variables qo'shish**

**Create Web Service** bosmasdan oldin:

Advanced → **Add Environment Variable**:

```
NODE_ENV = production
```

#### 6. **Deploy!**
- **Create Web Service** tugmasini bosing
- Deploy jarayoni boshlanadi (2-5 daqiqa)

---

## 📱 Netlify.com Sozlamalari:

### Frontend uchun:

#### 1. **Build Settings**

**Base directory:**
```
(bo'sh qoldiring - root)
```

**Build command:**
```
npm run build
```

**Publish directory:**
```
dist
```

#### 2. **Environment Variables**

Netlify dashboard → Site settings → Environment variables:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://two87-maktab-backend.onrender.com/api/v1` |

---

## 🔍 Tekshirish:

### Backend ishlayaptimi?

Browser'da oching:
```
https://two87-maktab-backend.onrender.com
```

Ko'rishingiz kerak:
```json
{
  "status": "✅ Ishlayapti",
  "docs": "https://two87-maktab-backend.onrender.com/api/docs",
  "api": "https://two87-maktab-backend.onrender.com/api/v1",
  "logins": {
    "superadmin": "998901234567 / admin123",
    "teacher": "998901234568 / teacher123",
    "student": "998901234569 / student123"
  }
}
```

### Swagger ishlayaptimi?
```
https://two87-maktab-backend.onrender.com/api/docs
```

### Frontend ishlayaptimi?
```
https://287-maktab-backend.netlify.app
```

---

## 🐛 Muammolar va Yechimlar:

### ❌ 502 Bad Gateway
**Sabab**: Build xatosi yoki start command noto'g'ri

**Yechim**:
1. Render dashboard → Logs'ni ko'ring
2. Build logs'da xatolarni toping
3. `Root Directory = backend` ekanligini tekshiring

### ❌ CORS Error
**Sabab**: Backend frontend URL'ni qabul qilmayapti

**Yechim**: `backend/src/app.js` da CORS sozlamalari:
```javascript
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://287-maktab-backend.netlify.app',
    /\.netlify\.app$/
  ],
  credentials: true
};
```

### ❌ Environment Variables ishlamayapti
**Sabab**: Render'da env qo'shilmagan

**Yechim**:
1. Render dashboard → Environment
2. `NODE_ENV = production` qo'shing
3. Redeploy qiling

### ❌ Database fayllari yo'qoladi
**Sabab**: Render free tier'da disk temporary

**Yechim**: 
- Render disk storage persistent qilish uchun:
- Render dashboard → Disks → Add Disk
- Mount path: `/opt/render/project/backend/data`

---

## 🔄 Yangilanishlar (Updates):

### Avtomatik Deploy:
1. ✅ GitHub'ga push qiling: `git push origin main`
2. 🔄 Render avtomatik deploy qiladi
3. ⏰ 2-3 daqiqa kutish
4. ✅ Yangi versiya live!

### Manual Deploy:
1. Render dashboard → Service → **Manual Deploy**
2. **Deploy latest commit** tugmasini bosing

---

## 📊 Deployment Status:

### Render'da ko'rish:
```
https://dashboard.render.com/web/srv-xxxxx
```

**Status:**
- 🟢 **Live** - Ishlayapti
- 🔵 **Deploying** - Deploy qilinmoqda
- 🔴 **Deploy failed** - Xato

**Logs:**
```
✅ SUPER ADMIN yaratildi: 975661099 / Mohidil
🚀 Najot Ta'lim Backend ishga tushdi!
📡 Server: https://two87-maktab-backend.onrender.com
```

---

## 🎯 Production Login:

### SUPER ADMIN:
```
📱 Phone: 975661099
🔑 Password: Mohidil
```

### Test Accounts:
```
Admin:    998901234567 / admin123
Teacher:  998901234568 / teacher123
Student:  998901234569 / student123
```

---

## 💡 Muhim Eslatmalar:

1. ⚠️ **Root Directory**: `backend` bo'lishi kerak
2. ⚠️ **Start Command**: `node src/app.js` (npm start emas!)
3. ⚠️ **Port**: Render avtomatik beradi, hardcode qilmang
4. ⚠️ **Free Tier**: 15 daqiqa inactive bo'lsa sleep mode'ga o'tadi
5. ✅ **First Request**: Birinchi so'rov sekin bo'lishi mumkin (cold start)

---

## 🎉 Tayyor!

Render va Netlify sozlandi! 

**Backend**: https://two87-maktab-backend.onrender.com
**Frontend**: https://287-maktab-backend.netlify.app

**Login**: `975661099` / `Mohidil` 👑

Noutbookingiz o'chib qolsa ham, sayt 24/7 ishlaydi! 🚀
