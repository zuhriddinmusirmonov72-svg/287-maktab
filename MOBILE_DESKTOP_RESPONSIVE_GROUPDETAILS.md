# Guruh Details - Mobile va Desktop Responsive

## ✅ Amalga Oshirildi:

### 🖥️ **DESKTOP (>768px)**
Hamma narsa **eski holatda qoladi**:
- ✅ "Ma'lumotlar" tabi
- ✅ "Guruh darsliklari" tabi
- ✅ **"Akademik davomati" tabi** (ko'rinadi)
- ✅ **"Guruh mentorlari"** bo'limi (ko'rinadi)
- ✅ **"Parametrlar"** bo'limi (ko'rinadi)
- ✅ **Dars jadvali** - Barcha kunlar, flexbox layout
- ✅ "Barchasini ko'rish" tugmasi ishlaydi

### 📱 **MOBILE (≤768px)**
Yangi soddalashtirilgan versiya:
- ✅ Faqat 2 ta tab:
  - "Ma'lumotlar"
  - "Guruh darsliklari"
- ❌ **"Akademik davomati" tabi yo'q**
- ❌ **"Guruh mentorlari" yo'q**
- ❌ **"Parametrlar" yo'q**
- ✅ **Dars jadvali** - Faqat keyingi 8 kun, **2 qator x 4 ustun** grid
- ❌ "Barchasini ko'rish" tugmasi yo'q

---

## 🎨 Responsive Mexanizmi:

### CSS Classes:
```css
/* Mobile'da yashirish */
.hide-on-mobile {
  display: none !important; /* ≤768px */
}

/* Mobile'da ko'rsatish */
.show-on-mobile {
  display: grid !important; /* ≤768px */
}
```

### Komponentlar:

#### Desktop Versiya:
```jsx
renderMonthDaysDesktop(month) // Barcha kunlar, flexbox
```

#### Mobile Versiya:
```jsx
renderMonthDaysMobile(month) // Faqat 8 kun, 2x4 grid
```

---

## 📋 O'zgartirilgan Fayllar:

### 1. `src/pages/GroupDetails.jsx`
- "Akademik davomati" tabiga `className="hide-on-mobile"` qo'shildi
- "Guruh mentorlari" va "Parametrlar" bloklariga `className="hide-on-mobile"` qo'shildi
- `renderMonthDaysDesktop()` funksiyasi yaratildi (eski versiya)
- `renderMonthDaysMobile()` funksiyasi yaratildi (yangi 2x4 grid)
- Ikkala versiya ham chaqiriladi, CSS orqali biri yashirinadi

### 2. `src/index.css`
- `.hide-on-mobile` class qo'shildi (mobile'da yashiradi)
- `.show-on-mobile` class qo'shildi (mobile'da ko'rsatadi)
- Media query: `@media (max-width: 768px)` va `@media (min-width: 769px)`

---

## 🎯 Xususiyatlar:

### Desktop Dars Jadvali:
- Barcha kunlar ko'rsatiladi
- Flexbox layout (wrap)
- 64px x 76px kartochkalar
- "Barchasini ko'rish" tugmasi
- O'tgan kunlar ham ko'rinadi

### Mobile Dars Jadvali:
```
┌──────┬──────┬──────┬──────┐
│ Du 12│ Se 13│ Ch 14│ Pa 15│  ← 1-qator
├──────┼──────┼──────┼──────┤
│ Ju 16│Sha 17│ Du 19│ Se 20│  ← 2-qator
└──────┴──────┴──────┴──────┘
```
- Faqat keyingi 8 kun
- Grid layout (4 ustun)
- Kattaroq kartochkalar (90px balandlik)
- O'tgan kunlar avtomatik yashirinadi
- Responsive width: 100%

---

## 🧪 Test Qilish:

### Desktop Test:
1. Browser kengligini >768px qiling
2. SUPER ADMIN kiring (975661099 / Mohidil)
3. Guruhlar → Biror guruhni oching
4. Tekshiring:
   - ✅ 3 ta tab (Ma'lumotlar, Guruh darsliklari, Akademik davomati)
   - ✅ Guruh mentorlari ko'rinadi
   - ✅ Parametrlar ko'rinadi
   - ✅ Dars jadvali - barcha kunlar

### Mobile Test:
1. Browser DevTools → Toggle Device Toolbar (Ctrl+Shift+M)
2. iPhone/Android tanla (360px, 390px, 425px)
3. Tekshiring:
   - ✅ 2 ta tab (Ma'lumotlar, Guruh darsliklari)
   - ❌ Akademik davomati yo'q
   - ❌ Guruh mentorlari yo'q
   - ❌ Parametrlar yo'q
   - ✅ Dars jadvali - 2x4 grid (8 kun)

---

## 🚀 Deployment:

```bash
git add .
git commit -m "Mobile: Guruh details soddalashtirildi (mentorlar, parametrlar yashirildi). Desktop eski holatda qoldi."
git push origin main
```

Netlify avtomatik deploy qiladi! 🎉

---

## 📝 Xulosa:

✅ **Desktop** - Hech narsa o'zgarmadi, barcha funksiyalar ishlaydi
✅ **Mobile** - Soddalashtirildi, faqat kerakli ma'lumotlar
✅ **Responsive** - CSS media query orqali avtomatik
✅ **O'tkazish oson** - Breakpoint: 768px
