# 🚀 Production Deployment Guide

## 📋 Maqsad

- ✅ Internet orqali kirish (domain yoki IP)
- ✅ Backend va Frontend ishlab turishi (24/7)
- ✅ Ma'lumotlar doimiy saqlanishi (1.5 yil+)
- ✅ Hamma foydalanuvchilar ko'rishi
- ✅ Telefonga app sifatida o'rnatish (PWA)

---

## 🏗️ Arxitektura

```
Internet
    ↓
[Domain/IP] → [Server] → [Backend (Node.js Port 3001)]
                      ↘ [Frontend (Static Files)]
                      ↘ [Database (NeDB files)]
```

---

## 📦 1. Backend Tayyorlash

### Backend Production Build

**backend/.env** yaratish:
```env
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secret-key-change-this-in-production-12345
```

**backend/package.json** - scripts qo'shish:
```json
{
  "scripts": {
    "dev": "node --watch src/app.js",
    "start": "node src/app.js",
    "build": "echo 'Backend build not needed'"
  }
}
```

### Database Ma'lumotlari

**MUHIM:** `backend/data/` papka **HECH QACHON O'CHIRILMASLIGI KERAK!**

```
backend/data/
├── users.db              ✅ Foydalanuvchilar
├── students.db           ✅ O'quvchilar
├── teachers.db           ✅ O'qituvchilar
├── groups.db             ✅ Guruhlar
├── lessons.db            ✅ Darslar
├── homeworks.db          ✅ Uyga vazifalar
├── homework_answers.db   ✅ Topshiriqlar
├── files.db              ✅ Fayllar
├── notifications.db      ✅ Bildirishnomalar
├── otp_codes.db          ✅ OTP kodlar
├── courses.db            ✅ Kurslar
├── rooms.db              ✅ Xonalar
├── attendance.db         ✅ Davomat
└── student_group.db      ✅ O'quvchi-guruh aloqa
```

**Bu fayllar:**
- ✅ Doimiy saqlanadi (uchib ketmaydi)
- ✅ Backup olinishi mumkin (copy qilish)
- ✅ 1.5 yil keyin ham ishlaydi
- ✅ Server restart qilinganda ham saqlanadi

---

## 🌐 2. Frontend Production Build

### Build qilish:

```bash
cd d:\8-Oy\uyishi-2
npm run build
```

Bu **dist/** papka yaratadi:
```
dist/
├── index.html
├── assets/
│   ├── index-abc123.js
│   ├── index-xyz789.css
│   └── ...
└── ...
```

### Backend'ga static serve qo'shish

**backend/src/app.js** - qo'shish:

```javascript
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ... boshqa imports ...

const app = express();

// ... middleware'lar ...

// 🌟 PRODUCTION: Frontend static files
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '../../dist');
  app.use(express.static(distPath));
  
  // SPA routing - barcha route'lar index.html'ga yo'naltiriladi
  app.get('*', (req, res) => {
    if (!req.url.startsWith('/api') && !req.url.startsWith('/files')) {
      res.sendFile(join(distPath, 'index.html'));
    }
  });
}

// ... routes ...
```

---

## 🖥️ 3. Server Sozlash (3 variant)

### Variant A: Local Server (Test uchun)

**Windows'da ishga tushirish:**

1. **Backend ishga tushirish:**
```cmd
cd d:\8-Oy\uyishi-2\backend
set NODE_ENV=production
set PORT=3001
node src/app.js
```

2. **Frontend build:**
```cmd
cd d:\8-Oy\uyishi-2
npm run build
```

3. **IP manzilni topish:**
```cmd
ipconfig
```

4. **Kirish:**
- Local: `http://localhost:3001`
- Network: `http://192.168.1.XXX:3001`

**MUAMMO:** Kompyuter o'chirilsa server ham to'xtaydi ❌

---

### Variant B: VPS Server (Tavsiya qilinadi) ⭐

**VPS Provider'lar:**
- [DigitalOcean](https://digitalocean.com) - $5/oy
- [Vultr](https://vultr.com) - $5/oy  
- [Hetzner](https://hetzner.com) - €4/oy
- [Contabo](https://contabo.com) - €4/oy

**O'rnatish (Ubuntu 22.04):**

```bash
# 1. Server'ga kirish
ssh root@your-server-ip

# 2. Node.js o'rnatish
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 3. PM2 o'rnatish (process manager)
npm install -g pm2

# 4. Loyihani yuklash
mkdir -p /var/www
cd /var/www
# Git orqali yoki FTP orqali fayllarni yuklash

# 5. Dependencies o'rnatish
cd /var/www/uyishi-2/backend
npm install

cd /var/www/uyishi-2
npm install
npm run build

# 6. PM2 bilan ishga tushirish
cd /var/www/uyishi-2/backend
pm2 start src/app.js --name "287-maktab-backend"
pm2 save
pm2 startup

# 7. Nginx o'rnatish (reverse proxy)
apt-get install -y nginx

# 8. Nginx config
nano /etc/nginx/sites-available/287-maktab
```

**Nginx config** (`/etc/nginx/sites-available/287-maktab`):
```nginx
server {
    listen 80;
    server_name your-domain.com;  # yoki IP

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Nginx activate
ln -s /etc/nginx/sites-available/287-maktab /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Firewall
ufw allow 80
ufw allow 443
ufw enable
```

**Kirish:**
- `http://your-domain.com` yoki
- `http://your-server-ip`

**Afzalliklari:**
- ✅ 24/7 ishlab turadi
- ✅ Kompyuter o'chirilsa ham ishlaydi
- ✅ Tez (SSD)
- ✅ Professional

---

### Variant C: Hosting (Shared Hosting)

**Hosting Provider'lar:**
- [Heroku](https://heroku.com) - Free tier mavjud
- [Render](https://render.com) - Free tier
- [Railway](https://railway.app) - Free tier
- [Vercel](https://vercel.com) - Frontend uchun

**Heroku deployment:**

```bash
# 1. Heroku CLI o'rnatish
# https://devcenter.heroku.com/articles/heroku-cli

# 2. Login
heroku login

# 3. App yaratish
heroku create 287-maktab

# 4. Git push
git init
git add .
git commit -m "Production ready"
git push heroku main

# 5. Open
heroku open
```

---

## 🔐 4. Domain Sozlash (Ixtiyoriy)

### Domain sotib olish:

- [Namecheap](https://namecheap.com) - $10/yil
- [GoDaddy](https://godaddy.com)
- [Cloudflare](https://cloudflare.com)

### DNS Settings:

```
Type: A Record
Name: @
Value: your-server-ip
TTL: 3600
```

**Subdomain uchun:**
```
Type: A Record
Name: app
Value: your-server-ip
```

→ `http://app.287-maktab.uz`

---

## 🔒 5. HTTPS (SSL) O'rnatish

### Let's Encrypt (Bepul) ⭐

```bash
# Certbot o'rnatish
apt-get install -y certbot python3-certbot-nginx

# SSL sertifikat olish
certbot --nginx -d your-domain.com

# Auto-renewal test
certbot renew --dry-run
```

Endi:
- ✅ `https://your-domain.com` ishlaydi
- ✅ Xavfsiz (padlock icon)
- ✅ PWA uchun kerak

---

## 📦 6. Backup Strategiyasi

### Automatic Backup Script

**backup.sh:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
SOURCE_DIR="/var/www/uyishi-2/backend/data"

# Backup yaratish
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/db_backup_$DATE.tar.gz $SOURCE_DIR

# 30 kundan eski backup'larni o'chirish
find $BACKUP_DIR -name "db_backup_*.tar.gz" -mtime +30 -delete

echo "Backup yaratildi: db_backup_$DATE.tar.gz"
```

**Cron job (har kuni 02:00'da):**
```bash
crontab -e

# Qo'shish:
0 2 * * * /var/www/backup.sh >> /var/log/backup.log 2>&1
```

### Manual Backup

```bash
# Backup qilish
cd /var/www/uyishi-2/backend
tar -czf backup_$(date +%Y%m%d).tar.gz data/

# Download (local kompyuterga)
scp root@your-server-ip:/var/www/uyishi-2/backend/backup_*.tar.gz ./

# Restore qilish
tar -xzf backup_20260809.tar.gz
```

---

## 🔄 7. Update Strategiyasi

### Code yangilash:

```bash
# Server'da
cd /var/www/uyishi-2

# Git pull (agar Git ishlatilsa)
git pull origin main

# Backend
cd backend
npm install
pm2 restart 287-maktab-backend

# Frontend rebuild
cd ..
npm install
npm run build

# Nginx restart
systemctl restart nginx
```

---

## 📊 8. Monitoring

### PM2 monitoring:

```bash
# Status
pm2 status

# Logs
pm2 logs 287-maktab-backend

# Real-time monitoring
pm2 monit
```

### Server monitoring:

```bash
# Disk space
df -h

# Memory
free -h

# CPU
top
```

---

## ✅ Production Checklist

### Before Deploy
- [ ] `.env` faylda production qiymatlar
- [ ] JWT_SECRET o'zgartirilgan
- [ ] Frontend build yaratilgan (`npm run build`)
- [ ] Backend test qilingan
- [ ] Database backup olingan
- [ ] CORS to'g'ri sozlangan

### After Deploy
- [ ] Health check endpoint ishlaydi
- [ ] Login ishlaydi (SUPER ADMIN, TEACHER, STUDENT)
- [ ] File upload ishlaydi
- [ ] Notification ishlaydi
- [ ] Mobile responsive
- [ ] HTTPS yoqilgan (SSL)
- [ ] PM2 auto-restart yoqilgan
- [ ] Nginx reverse proxy ishlaydi
- [ ] Backup script ishga tushgan
- [ ] Domain DNS sozlangan

---

## 🔗 Final URLs

### Development
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

### Production
- Web: `https://287-maktab.uz` (yoki `http://your-ip`)
- API: `https://287-maktab.uz/api`
- Files: `https://287-maktab.uz/files`

---

## 💡 Xulosa

**Eng yaxshi variant (Tavsiya):**
1. **VPS** sotib olish ($5/oy) - DigitalOcean yoki Vultr
2. **Ubuntu 22.04** o'rnatish
3. **Node.js + PM2** o'rnatish
4. **Nginx** reverse proxy
5. **Let's Encrypt SSL**
6. **Automatic backup** har kuni

**Natija:**
- ✅ 24/7 ishlab turadi
- ✅ Hamma kirishi mumkin
- ✅ Ma'lumotlar doimiy
- ✅ Tez va barqaror
- ✅ Professional

---

**Keyingi qadam:** PWA (Progressive Web App) qo'shish - telefonga o'rnatish uchun!
