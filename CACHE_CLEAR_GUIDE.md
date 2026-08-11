# 🧹 Cache Tozalash - To'liq Yo'riqnoma

## ❓ Muammo:
Console'da eski fayllar ko'rinmoqda yoki o'zgarishlar ko'rinmayapdi.

---

## 🔧 Yechim: Cache ni tozalash

### 1️⃣ **Frontend Cache (Terminal'da)**

```bash
# node_modules, dist, .vite cache'ni o'chirish
rm -rf node_modules dist .vite

# Qayta install
npm install

# Qayta build
npm run build
```

**Windows (PowerShell):**
```powershell
Remove-Item -Recurse -Force node_modules, dist, .vite -ErrorAction SilentlyContinue
npm install
npm run build
```

---

### 2️⃣ **Browser Cache (Chrome)**

#### A) **Hard Refresh:**
```
Ctrl + Shift + R
```
yoki
```
Ctrl + F5
```

#### B) **DevTools bilan:**
1. **F12** - DevTools ni oching
2. **Network** tab'ga o'ting
3. **Disable cache** checkbox'ni belgilang
4. **F5** - Refresh qiling

#### C) **Manual Clear:**
1. **F12** - DevTools
2. **Application** tab
3. **Storage** → **Clear site data**
4. **Clear site data** tugmasini bosing

#### D) **Settings:**
```
Chrome Settings → Privacy and security → Clear browsing data
```
- ✅ Cached images and files
- ✅ Site settings
- Time range: **Last hour**
- **Clear data**

---

### 3️⃣ **Service Worker o'chirish**

#### Chrome DevTools:
1. **F12** → **Application** tab
2. **Service Workers** bo'limiga o'ting
3. **Unregister** tugmasini bosing (har bir service worker uchun)
4. **F5** - Refresh

#### Yoki kodda:
```javascript
// public/index.html yoki src/main.jsx
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
      console.log('Service Worker unregistered');
    });
  });
}
```

---

### 4️⃣ **Backend Cache (Terminal'da)**

```bash
cd backend

# node_modules o'chirish
rm -rf node_modules

# Qayta install
npm install

# Backend restart
npm start
```

**Windows:**
```powershell
cd backend
Remove-Item -Recurse -Force node_modules
npm install
npm start
```

---

### 5️⃣ **localStorage tozalash**

#### Browser Console'da:
```javascript
// Hamma narsa o'chirish
localStorage.clear()

// Faqat token
localStorage.removeItem('token')
localStorage.removeItem('user')

// Refresh
location.reload()
```

---

### 6️⃣ **Git fayllarni tozalash**

Agar eski fayllar git'da qolgan bo'lsa:

```bash
# Git cache tozalash
git rm -r --cached .
git add .
git commit -m "Clear git cache"
git push origin main
```

---

## 🚀 To'liq Tozalash (Barchasi):

### Terminal'da:
```bash
# Frontend
rm -rf node_modules dist .vite package-lock.json
npm install
npm run build

# Backend
cd backend
rm -rf node_modules package-lock.json
npm install
cd ..

# Git cache
git rm -r --cached .
git add .
git commit -m "Clear all cache"
git push origin main
```

### Browser'da:
1. **Ctrl + Shift + Delete** - Clear browsing data
2. ✅ Cached images and files
3. ✅ Cookies and site data
4. Time range: **All time**
5. **Clear data**
6. **F5** - Refresh

---

## 🔍 Cache tekshirish:

### 1. Console'da:
```javascript
// Qaysi fayllar yuklanayotganini ko'rish
console.log('Current files:', performance.getEntriesByType('resource'))

// Service Worker status
console.log('Service Worker:', navigator.serviceWorker.controller)

// Build version (package.json'dan)
console.log('Version:', '1.0.0')
```

### 2. Network Tab'da:
- **F12** → **Network**
- **Disable cache** belgilangan bo'lsin
- **F5** - Refresh
- Har bir fayl **200** status bilan yangi yuklanayotganini ko'ring
- **304 Not Modified** ko'rinmasligi kerak

---

## ⚠️ Development'da Cache prevent qilish:

### 1. **Vite config (vite.config.js):**
```javascript
export default defineConfig({
  server: {
    watch: {
      usePolling: true
    }
  },
  build: {
    rollupOptions: {
      output: {
        // Hash qo'shish - cache prevent
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  }
})
```

### 2. **package.json script:**
```json
{
  "scripts": {
    "dev": "vite --force",
    "build": "vite build",
    "clean": "rm -rf node_modules dist .vite && npm install"
  }
}
```

### 3. **Browser DevTools always open:**
```
F12 → Settings → Preferences → DevTools → Disable cache (while DevTools is open)
```

---

## 🎯 Agar hali ham ishlamasa:

### 1. **Incognito/Private mode:**
```
Ctrl + Shift + N (Chrome)
Ctrl + Shift + P (Firefox)
```
Cache'siz ochiladi.

### 2. **Boshqa browser:**
- Firefox
- Edge
- Safari

### 3. **Port o'zgartirish:**
```javascript
// vite.config.js
export default defineConfig({
  server: {
    port: 5174 // 5173 o'rniga
  }
})
```

### 4. **Kompyuter restart:**
Barcha cache cleared bo'ladi.

---

## 📝 Cache Types:

| Type | Qayerda? | Qanday tozalash? |
|------|----------|------------------|
| **Node Modules** | `node_modules/` | `rm -rf node_modules && npm install` |
| **Vite Cache** | `.vite/` | `rm -rf .vite` |
| **Build Cache** | `dist/` | `rm -rf dist && npm run build` |
| **Browser Cache** | Browser | `Ctrl + Shift + R` |
| **Service Worker** | Browser | DevTools → Unregister |
| **localStorage** | Browser | `localStorage.clear()` |
| **Git Cache** | `.git/` | `git rm -r --cached .` |

---

## ✅ Tekshirish:

Console'da:
```javascript
// Versiyani ko'rish
console.log('App Version:', Date.now())

// Fayllar listini ko'rish
console.log('Loaded files:', 
  performance.getEntriesByType('resource')
    .map(r => r.name)
)

// Service Worker
console.log('SW:', navigator.serviceWorker.controller ? 'Active' : 'None')
```

Network Tab'da:
- ✅ Barcha fayllar **200** status
- ❌ **304 Not Modified** yo'q
- ✅ **Size** column'da "memory cache" yo'q
- ✅ Yangi hash'lar: `index-DqNI27zN.js`

---

## 🎉 To'liq Cleanup Script:

Qo'lda yarating: `cleanup.sh`
```bash
#!/bin/bash

echo "🧹 Cleaning frontend..."
rm -rf node_modules dist .vite package-lock.json

echo "📦 Installing frontend..."
npm install

echo "🏗️ Building frontend..."
npm run build

echo "🧹 Cleaning backend..."
cd backend
rm -rf node_modules package-lock.json
npm install
cd ..

echo "✅ Cleanup complete!"
echo "🚀 Run: npm run dev"
```

Ishlatish:
```bash
chmod +x cleanup.sh
./cleanup.sh
```

---

## 💡 Xulosa:

**Eski fayllar ko'rinsa:**
1. ✅ `rm -rf node_modules dist .vite`
2. ✅ `npm install && npm run build`
3. ✅ Browser: `Ctrl + Shift + R`
4. ✅ DevTools → Application → Clear storage
5. ✅ Service Worker → Unregister

**Har doim DevTools ochiq bo'lsin:**
- F12 → Settings → Disable cache ✅

**🎯 Endi yangi o'zgarishlar darhol ko'rinadi!**
