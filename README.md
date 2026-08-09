# 🎓 287-maktab LMS (Learning Management System)

> O'quv markazlari uchun zamonaviy Learning Management System - O'quvchilar, o'qituvchilar va ma'murlar uchun to'liq funksional platforma

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-purple.svg)](https://web.dev/progressive-web-apps/)

## 🌟 Features

### 👨‍🎓 O'quvchilar uchun
- ✅ Guruhlar va darslar ro'yxati
- ✅ Video darslarni ko'rish
- ✅ Uyga vazifa yuklash (fayl va GitHub link)
- ✅ Uyga vazifa statuslari (Kutilmoqda, Qabul qilingan, Qaytarilgan)
- ✅ Kumush tangalar va XP tizimi (gamification)
- ✅ Bildirishnomalar paneli
- ✅ Reyting va ko'rsatgichlar
- ✅ Sozlamalar (parol o'zgartirish)

### 👨‍🏫 O'qituvchilar uchun
- ✅ Guruhlarni boshqarish
- ✅ Darslarni yaratish va tahrirlash
- ✅ Video dars yuklash
- ✅ Uyga vazifa berish va tekshirish
- ✅ O'quvchilar baholash
- ✅ Davomat boshqarish
- ✅ Statistika va hisobotlar

### 🔐 Super Admin uchun
- ✅ Foydalanuvchilarni boshqarish
- ✅ Kurslar va xonalar yaratish
- ✅ O'qituvchilar va o'quvchilarni qo'shish
- ✅ Guruhlar tashkil qilish
- ✅ To'liq tizim nazorati

### 🚀 Qo'shimcha Features
- ✅ **PWA (Progressive Web App)** - Telefonga app sifatida o'rnatish
- ✅ **Mobile Responsive** - 360px-425px ekranlar uchun optimallashtirilgan
- ✅ **Offline Mode** - Internet yo'q bo'lganda ham asosiy sahifalar ishlaydi
- ✅ **Push Notifications** - Real-time bildirishnomalar
- ✅ **SMS OTP** - Parolni tiklash (Telegram bot)
- ✅ **File Upload** - Video, rasm va hujjatlar yuklash

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Material-UI** - Component library
- **React Router** - Routing
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **NeDB** - File-based database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File upload
- **Swagger** - API documentation

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Clone Repository
```bash
git clone https://github.com/zuhriddinmusirmonov72-svg/287-maktab.git
cd 287-maktab
```

### Backend Setup
```bash
cd backend
npm install
node src/app.js
```

Backend runs on: `http://localhost:3001`

### Frontend Setup
```bash
cd ..
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

## 🚀 Deployment

### Quick Deploy (Render.com - Free)

1. **Push to GitHub** ✅ (Already done!)

2. **Deploy Backend:**
   - Go to https://render.com
   - New → Web Service
   - Connect GitHub repository
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node src/app.js`
   - Add Environment Variables:
     ```
     NODE_ENV=production
     PORT=3001
     JWT_SECRET=your-secret-key
     ```

3. **Deploy Frontend:**
   - New → Static Site
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

**See full deployment guide:** [DEPLOYMENT_QUICK_START.md](DEPLOYMENT_QUICK_START.md)

## 📱 PWA Setup

1. **Create Icons:**
   - Use Canva to create 512×512 logo
   - Generate all sizes: https://realfavicongenerator.net
   - Place in `public/` folder

2. **Test PWA:**
   - Chrome DevTools → Application → Manifest
   - Lighthouse → PWA (Score should be >90)
   - Install on mobile device

**Full PWA guide:** [PWA_SETUP.md](PWA_SETUP.md)

## 📚 Documentation

- [📖 FINAL_SUMMARY.md](FINAL_SUMMARY.md) - Complete overview
- [🚀 DEPLOYMENT_QUICK_START.md](DEPLOYMENT_QUICK_START.md) - Deploy guide
- [📱 PWA_SETUP.md](PWA_SETUP.md) - Progressive Web App setup
- [🎨 ICON_CREATION_GUIDE.md](ICON_CREATION_GUIDE.md) - Icon creation guide
- [📱 MODERN_ANDROID_OPTIMIZATION.md](MODERN_ANDROID_OPTIMIZATION.md) - Mobile optimization
- [📧 SMS_SETUP.md](SMS_SETUP.md) - SMS/Telegram OTP setup

## 🔐 Default Credentials

```
Super Admin:
  Phone: 998901234567
  Password: admin123

Teacher:
  Phone: 998901234568
  Password: teacher123

Student:
  Phone: 998901234569
  Password: student123
```

**⚠️ Change these in production!**

## 👤 Author

**Zuhriddin Musirmonov**
- GitHub: [@zuhriddinmusirmonov72-svg](https://github.com/zuhriddinmusirmonov72-svg)
- Email: zuhriddinmusirmonov72@gmail.com

## 📞 Support

For support, email zuhriddinmusirmonov72@gmail.com or create an issue.

---

**⭐ Star this repo if you find it useful!**

**🚀 Ready to deploy? Check [DEPLOYMENT_QUICK_START.md](DEPLOYMENT_QUICK_START.md)**
