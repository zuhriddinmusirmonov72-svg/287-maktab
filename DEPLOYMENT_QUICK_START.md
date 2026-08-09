# 🚀 Tez Deploy Qilish Yo'riqnomasi

## ✅ Sizning Talablaringiz

1. ✅ **Internet orqali kirish** (link bilan)
2. ✅ **Backend va Frontend ishlab turishi** (24/7)
3. ✅ **Ma'lumotlar saqlanishi** (1.5 yil+)
4. ✅ **Hamma foydalanuvchilar ko'rishi**
5. ✅ **Telefonga app o'rnatish** (PWA)
6. ✅ **Ma'lumotlar uchib ketmasligi**

---

## 🎯 Eng Oson Yo'l (3 variant)

### 📋 Variant 1: Render.com (BEPUL, Tavsiya) ⭐

**Afzalliklari:**
- ✅ **100% BEPUL**
- ✅ Avtomatik SSL (HTTPS)
- ✅ 24/7 ishlab turadi
- ✅ Database saqlanadi
- ✅ Deploy 5 daqiqa

**Qadamlar:**

1. **Render.com'ga kirish:**
   - https://render.com/
   - GitHub bilan register

2. **GitHub'ga loyihani yuklash:**
```bash
cd d:\8-Oy\uyishi-2
git init
git add .
git commit -m "Initial commit"
git branch -M main
# GitHub'da yangi repository yaratish va push qilish
```

3. **Render'da Web Service yaratish:**
   - "New" → "Web Service"
   - GitHub repository tanlash
   - Settings:
     ```
     Name: 287-maktab
     Root Directory: backend
     Build Command: npm install
     Start Command: node src/app.js
     ```
   - "Create Web Service"

4. **Environment Variables qo'shish:**
   ```
   NODE_ENV=production
   PORT=3001
   JWT_SECRET=your-secret-key-change-this
   ```

5. **Frontend build va deploy:**
   - Render dashboard → "New" → "Static Site"
   - GitHub repository tanlash (bir xil)
   - Settings:
     ```
     Name: 287-maktab-frontend
     Build Command: npm install && npm run build
     Publish Directory: dist
     ```

6. **Tayyor!**
   - URL: `https://287-maktab.onrender.com`
   - PWA o'rnatish: URL'ni ochib "Install" bosish

---

### 📋 Variant 2: Railway.app (BEPUL, Oson)

**Afzalliklari:**
- ✅ BEPUL $5/oy credit
- ✅ Juda oson deploy
- ✅ Database bepul
- ✅ Avtomatik SSL

**Qadamlar:**

1. **Railway.app'ga kirish:**
   - https://railway.app/
   - GitHub bilan login

2. **New Project:**
   - "Deploy from GitHub repo"
   - Repository tanlash

3. **Settings:**
   - Root directory: `backend`
   - Start command: `node src/app.js`
   - Add variables:
     ```
     NODE_ENV=production
     JWT_SECRET=your-secret-key
     ```

4. **URL olish:**
   - Settings → "Generate Domain"
   - `https://287-maktab.up.railway.app`

---

### 📋 Variant 3: VPS (Professional, $5/oy)

**Provider tanlash:**
- DigitalOcean - https://digitalocean.com
- Vultr - https://vultr.com
- Hetzner - https://hetzner.com

**Tez sozlash:**

```bash
# 1. Server'ga SSH qilish
ssh root@your-ip

# 2. Node.js o'rnatish
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 3. PM2 o'rnatish
npm install -g pm2

# 4. Loyiha yuklash (Git yoki FTP)
cd /var/www
git clone your-repo-url 287-maktab

# 5. Dependencies
cd 287-maktab/backend
npm install

cd ../
npm install
npm run build

# 6. PM2 bilan ishga tushirish
cd backend
pm2 start src/app.js --name 287-maktab
pm2 save
pm2 startup

# 7. Nginx (ixtiyoriy)
apt-get install -y nginx
# Config qo'shish...
```

**URL:** `http://your-ip:3001`

---

## 📱 PWA O'rnatish (Tayyor!)

**Fayllar allaqachon yaratilgan:**
- ✅ `public/manifest.json`
- ✅ `public/sw.js`
- ✅ `public/offline.html`
- ✅ `src/components/InstallPWA.jsx`
- ✅ `index.html` (PWA meta tags)

**Icon'lar kerak:**
Icon generator: https://realfavicongenerator.net/
- Upload 512x512 logo
- Download va `public/` ga joylashtirish

**Telefonda o'rnatish:**
1. Saytni ochish (Chrome yoki Safari)
2. "Install" banner paydo bo'ladi
3. "O'rnatish" bosish
4. Home screen'da app icon ✅

---

## 💾 Database (Ma'lumotlar Saqlanishi)

**NeDB (hozirda):**
- ✅ File-based database
- ✅ `backend/data/*.db` fayllar
- ✅ Doimiy saqlanadi
- ✅ Server restart qilinganda ham saqlanadi
- ✅ 1.5 yil+ ishlaydi

**Backup (muhim!):**

```bash
# Backup qilish
cd backend
tar -czf backup_$(date +%Y%m%d).tar.gz data/

# Restore qilish
tar -xzf backup_20260809.tar.gz
```

**Avtomatik backup (Render/Railway):**
- Railway: Persistent Volumes (bepul)
- Render: Persistent Disks ($1/GB/oy)

---

## 🔐 Production Settings

**backend/.env:**
```env
NODE_ENV=production
PORT=3001
JWT_SECRET=o'zingizni-maxfiy-kalitingiz-12345
```

**CORS (backend/src/app.js):**
```javascript
app.use(cors({
  origin: ['https://287-maktab.onrender.com', 'https://287-maktab.uz'],
  credentials: true
}));
```

---

## ✅ Deploy Checklist

### Before Deploy
- [ ] `git init` va commit qilish
- [ ] GitHub'ga push qilish
- [ ] `.env` faylda production settings
- [ ] JWT_SECRET o'zgartirilgan
- [ ] Frontend build test qilish: `npm run build`
- [ ] Backend test qilish: `node backend/src/app.js`

### Deploy
- [ ] Platform tanlash (Render/Railway/VPS)
- [ ] Repository ulash
- [ ] Environment variables qo'shish
- [ ] Deploy qilish
- [ ] URL olish

### After Deploy
- [ ] URL ochiladi
- [ ] Login ishlaydi (admin/teacher/student)
- [ ] File upload ishlaydi
- [ ] Notification ishlaydi
- [ ] Mobile responsive
- [ ] PWA install banner ko'rinadi
- [ ] Icon'larni qo'shish (512x512, 192x192, etc.)

### PWA
- [ ] Icon'lar generate qilish
- [ ] Icon'larni `public/` ga qo'yish
- [ ] Chrome DevTools → Lighthouse → PWA test
- [ ] Real device'da o'rnatish test
- [ ] Offline mode test qilish

---

## 📞 Yordam

### Test URLs (local)
- Frontend dev: `http://localhost:5173`
- Backend dev: `http://localhost:3001`
- Production build: `npm run build` → `dist/` papka

### Production URLs (Render)
- Backend API: `https://287-maktab.onrender.com/api`
- Frontend: `https://287-maktab-frontend.onrender.com`
- Files: `https://287-maktab.onrender.com/files`

### Database Files (NeDB)
```
backend/data/
├── users.db              ✅
├── students.db           ✅
├── teachers.db           ✅
├── groups.db             ✅
├── lessons.db            ✅
├── homeworks.db          ✅
├── homework_answers.db   ✅
├── files.db              ✅
├── notifications.db      ✅
└── ...
```

**MUHIM:** `backend/data/` papkani HECH QACHON o'chirmang!

---

## 🎉 Natija

Deploy qilingandan keyin:
- ✅ Internet orqali har kimki href="https://your-url">kiradi
- ✅ 24/7 ishlab turadi (server o'chib qolmaydi)
- ✅ Ma'lumotlar doimiy (1.5 yil+)
- ✅ Hamma foydalanuvchilar ko'radi
- ✅ Telefonga o'rnatish mumkin (PWA)
- ✅ Ma'lumotlar uchib ketmaydi (backup bor)

---

**Eng oson:** Render.com (5 daqiqa, bepul)  
**Eng professional:** VPS ($5/oy, to'liq kontrol)  
**Eng tez:** Railway.app (2 daqiqa, bepul)

**Keyingi qadam:** Icon'lar yaratish va deploy qilish!
