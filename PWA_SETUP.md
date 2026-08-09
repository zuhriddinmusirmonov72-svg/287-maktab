# 📱 PWA (Progressive Web App) Setup

## 🎯 Maqsad

Saytni **telefonga app sifatida o'rnatish** - Google Play yoki App Store kerak emas!

---

## ✨ PWA Nima?

**Progressive Web App** - bu web sayt, lekin telefonda oddiy app kabi ishlaydi:

- ✅ Home screen'ga qo'shish
- ✅ Fullscreen ochiladi (browser bar yo'q)
- ✅ Offline ishlaydi (internet yo'q bo'lsa ham)
- ✅ Push notifications
- ✅ Install banner
- ✅ App icon

---

## 📦 1. Manifest File Yaratish

**public/manifest.json** yaratish:

```json
{
  "name": "287-maktab LMS",
  "short_name": "287-maktab",
  "description": "287-maktab Learning Management System",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#7c3aed",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

---

## 🖼️ 2. Icon'lar Yaratish

### Option A: Canva (Oson)

1. **Canva'ga kirish:** https://canva.com
2. **Custom size:** 512x512 px
3. **Logo yaratish:**
   - Gradient background (purple → pink)
   - Matn: "287"
   - Font: Bold, oq rang
4. **Download PNG**
5. **Icon generator:** https://realfavicongenerator.net
   - Upload 512x512 PNG
   - Download all sizes

### Option B: Figma (Professional)

```
512x512 - Base icon
192x192 - Android
384x384 - Android
152x152 - iOS
144x144 - Windows
128x128 - Chrome
96x96   - Chrome
72x72   - Chrome
```

### Option C: Online Tool

**PWA Icon Generator:**
- https://tools.crawlink.com/tools/pwa-icon-generator/
- Upload bitta 512x512 rasm
- Barcha o'lchamlari avtomatik yaratiladi

---

## 🛠️ 3. Service Worker Yaratish

**public/sw.js** yaratish:

```javascript
const CACHE_NAME = '287-maktab-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/favicon.svg',
  '/manifest.json',
];

// Install event - cache'ga saqlash
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching files');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - eski cache'ni o'chirish
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - cache'dan yoki network'dan olish
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API requests (dynamic data)
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('/files/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache'da bor bo'lsa qaytarish
        if (response) {
          console.log('[Service Worker] Serving from cache:', event.request.url);
          return response;
        }

        // Cache'da yo'q bo'lsa network'dan olish
        console.log('[Service Worker] Fetching from network:', event.request.url);
        return fetch(event.request).then((response) => {
          // Network response'ni cache'ga qo'shish
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        }).catch(() => {
          // Offline bo'lsa offline page ko'rsatish
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Yangi xabar!',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '287-maktab', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});
```

---

## 📄 4. Offline Page Yaratish

**public/offline.html:**

```html
<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - 287-maktab</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      padding: 20px;
    }
    .container {
      max-width: 400px;
    }
    h1 {
      font-size: 48px;
      margin-bottom: 16px;
    }
    p {
      font-size: 18px;
      margin-bottom: 24px;
      opacity: 0.9;
    }
    button {
      background: white;
      color: #7c3aed;
      border: none;
      padding: 12px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }
    button:hover {
      transform: scale(1.05);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📡</h1>
    <h2>Internet yo'q</h2>
    <p>Internet ulanishini tekshiring va qayta urinib ko'ring</p>
    <button onclick="window.location.reload()">
      Qayta urinish
    </button>
  </div>
</body>
</html>
```

---

## 🔗 5. index.html'ga qo'shish

**index.html** `<head>` ichiga qo'shish:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest.json" />
    
    <!-- Theme color -->
    <meta name="theme-color" content="#7c3aed" />
    
    <!-- Apple Touch Icon -->
    <link rel="apple-touch-icon" href="/icon-152x152.png" />
    
    <!-- iOS meta tags -->
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="287-maktab" />
    
    <!-- Microsoft Tiles -->
    <meta name="msapplication-TileColor" content="#7c3aed" />
    <meta name="msapplication-TileImage" content="/icon-144x144.png" />
    
    <title>287-maktab LMS</title>
    
    <!-- Service Worker Registration -->
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
              console.log('✅ Service Worker registered:', registration.scope);
            })
            .catch((error) => {
              console.log('❌ Service Worker registration failed:', error);
            });
        });
      }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

## 🎨 6. Install Banner Component

**src/components/InstallPWA.jsx** yaratish:

```jsx
import { useState, useEffect } from 'react';
import { FiDownload, FiX } from 'react-icons/fi';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstall(false);
  };

  const handleDismiss = () => {
    setShowInstall(false);
  };

  if (!showInstall) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '16px 24px',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      maxWidth: 'calc(100vw - 40px)',
      animation: 'slideUp 0.3s ease-out',
    }}>
      <FiDownload size={24} />
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>
          287-maktab'ni o'rnating
        </p>
        <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.9 }}>
          Telefon yoki kompyuterga o'rnatib, tez kirish mumkin
        </p>
      </div>
      <button
        onClick={handleInstall}
        style={{
          background: 'white',
          color: '#7c3aed',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '6px',
          fontWeight: 600,
          fontSize: '13px',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        O'rnatish
      </button>
      <button
        onClick={handleDismiss}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <FiX size={20} />
      </button>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translate(-50%, 100px);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
```

**App.jsx'ga qo'shish:**

```jsx
import InstallPWA from './components/InstallPWA';

function App() {
  return (
    <>
      {/* ... boshqa komponentlar ... */}
      <InstallPWA />
    </>
  );
}
```

---

## 📱 7. Telefonga O'rnatish Yo'riqnomasi

### Android (Chrome)

1. **Saytni ochish:** `https://287-maktab.uz`
2. **Install banner paydo bo'ladi** - "O'rnatish" bosing
   YOKI
3. **Menu (⋮)** → **"Install app"** yoki **"Add to Home screen"**
4. **"Install"** bosing
5. **Home screen'da icon paydo bo'ladi** ✅

### iPhone (Safari)

1. **Saytni ochish:** `https://287-maktab.uz`
2. **Share tugmasi** 📤 bosing (pastda)
3. **"Add to Home Screen"** tanlang
4. **"Add"** bosing
5. **Home screen'da icon paydo bo'ladi** ✅

### Desktop (Chrome, Edge)

1. **Saytni ochish:** `https://287-maktab.uz`
2. **Address bar'da install icon** (+) paydo bo'ladi
3. **Icon'ni bosing**
4. **"Install"** bosing
5. **Desktop'da app ochiladi** ✅

---

## ✅ 8. PWA Checklist

### Manifest
- [ ] `manifest.json` yaratilgan
- [ ] `name` va `short_name` to'ldirilgan
- [ ] `icons` barcha o'lchamlarda (72-512px)
- [ ] `start_url` to'g'ri
- [ ] `display: standalone`
- [ ] `theme_color` va `background_color`

### Service Worker
- [ ] `sw.js` yaratilgan
- [ ] Cache strategiyasi to'g'ri
- [ ] Offline page mavjud
- [ ] `index.html`'da register qilingan

### Icons
- [ ] 72x72, 96x96, 128x128, 144x144
- [ ] 152x152 (Apple), 192x192, 384x384, 512x512
- [ ] PNG format
- [ ] Transparent background yoki solid color

### HTML Meta Tags
- [ ] `manifest` link
- [ ] `theme-color`
- [ ] `apple-touch-icon`
- [ ] `apple-mobile-web-app-capable`
- [ ] `viewport` tag

### HTTPS
- [ ] SSL sertifikat o'rnatilgan
- [ ] `https://` ishlay di
- [ ] PWA faqat HTTPS'da ishlaydi!

### Testing
- [ ] Chrome DevTools → Application → Manifest
- [ ] Chrome DevTools → Application → Service Workers
- [ ] Lighthouse audit (PWA score >90)
- [ ] Real device'da test qilish

---

## 🧪 9. Test Qilish

### Chrome DevTools

```
1. F12 bosing
2. Application tab'ni oching
3. Manifest - to'g'ri ko'rinishini tekshiring
4. Service Workers - registered ko'rinishi kerak
5. Lighthouse tab'ni oching
6. "Progressive Web App" tanlang
7. "Generate report" bosing
8. Score >90 bo'lishi kerak
```

### Real Device

**Android:**
- Chrome'da ochish
- Install banner ko'rinishi kerak
- O'rnatgandan keyin fullscreen ochilishi kerak

**iOS:**
- Safari'da ochish
- "Add to Home Screen" ishlashi kerak
- Icon home screen'da paydo bo'lishi kerak

---

## 🎯 10. Natija

**PWA o'rnatilgandan keyin:**
- ✅ Home screen'da icon
- ✅ App kabi ochiladi (browser bar yo'q)
- ✅ Fullscreen
- ✅ Offline ishlaydi (asosiy sahifalar)
- ✅ Tez yuklanadi (cache)
- ✅ Push notifications qabul qiladi
- ✅ Native app kabi his qiladi

**Farqi:**
- ❌ Google Play/App Store'da yo'q
- ❌ Bluetooth, NFC, Camera kabi API'lar cheklangan
- ✅ Lekin web funksiyalar to'liq ishlaydi
- ✅ O'rnatish oson (bir bosish)
- ✅ Yangilanish avtomatik

---

**Keyingi qadam:** Fayllarni yaratish va test qilish!
