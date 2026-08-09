# 📱 Mobile Responsive Test Guide

## Test qilish yo'riqnomasi

### 1. Chrome DevTools bilan test qilish

1. **Chrome browserni oching**
2. **F12** bosing (Developer Tools)
3. **Ctrl+Shift+M** bosing (Device Toolbar)
4. Qurilma tanlang:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - Samsung Galaxy S20 (360px)
   - Custom: 425px width

### 2. Login Page Test (425px)

#### ✅ Tekshirish kerak:
- [ ] Chap tomon (rasm) yuqorida ko'rinadi
- [ ] O'ng tomon (forma) pastda ko'rinadi
- [ ] Logo 60px o'lchamda
- [ ] Input'lar to'liq kenglikda
- [ ] Tugmalar touch-friendly (min 44px height)
- [ ] "Parolni unutdingizmi?" tugmasi ko'rinadi
- [ ] Modal'lar to'g'ri ochiladi va ekranga mos

#### Test qadamlari:
```
1. http://localhost:5173/login ga kiring
2. Telefon raqam kiriting
3. Parol kiriting
4. "Parolni unutdingizmi?" ni bosing
5. Modal to'g'ri ochilishini tekshiring
6. Modal yopilishini tekshiring
7. Login tugmasini bosing
```

### 3. StudentDashboard Test (425px)

#### ✅ Sidebar va Navigation
- [ ] Hamburger menu (☰) chap yuqori burchakda ko'rinadi
- [ ] Sidebar boshlang'ichda yashirin
- [ ] Hamburger bosilganda sidebar ochiladi (left: -100% → left: 0)
- [ ] Qora overlay paydo bo'ladi
- [ ] Overlay bosilsa sidebar yopiladi
- [ ] Nav item bosilsa sidebar yopiladi
- [ ] Logo "287-maktab" to'g'ri ko'rinadi

#### ✅ Content Area
- [ ] Padding: 16px 12px
- [ ] Font size'lar kichraytirilgan
- [ ] Guruhlar kartasi to'g'ri ko'rinadi
- [ ] Darslar jadvali horizontal scroll bor
- [ ] Statuslar to'g'ri ko'rinadi

#### ✅ Notifications
- [ ] Qo'ng'iroq icon'i yuqori o'ng burchakda
- [ ] Badge count ko'rinadi
- [ ] Bosish bilan panel ochiladi
- [ ] Panel full-width (mobilda)
- [ ] Scroll ishlaydi
- [ ] Notification'larni o'qish ishlaydi

#### ✅ Homework Modal
- [ ] Darsni bosish bilan modal ochiladi
- [ ] Video player responsive (max-width: 100%)
- [ ] Upload form to'g'ri ko'rinadi
- [ ] File select tugmasi touch-friendly
- [ ] Yuborish tugmasi ishlaydi

#### ✅ Settings Page
- [ ] Input'lar full-width
- [ ] Telefon raqam readonly
- [ ] Parol o'zgartirish tugmasi ko'rinadi
- [ ] Modal responsive

#### Test qadamlari:
```
1. Login qiling (student sifatida)
2. Hamburger menu'ni oching va yoping
3. Har bir nav item'ni bosing
4. Guruhni tanlang
5. Darsni oching
6. Video'ni play qiling
7. Uyga vazifa yuklang
8. Notification'larni oching
9. Settings'ga kiring
10. Parolni o'zgartiring
```

### 4. Landscape Mode Test (768x425)

#### ✅ Tekshirish kerak:
- [ ] Sidebar hamburger menu orqali ochiladi
- [ ] Content area to'liq kenglikda
- [ ] Tables horizontal scroll bor
- [ ] Modal'lar to'g'ri o'lchamda

### 5. Portrait Mode Test (425x768)

#### ✅ Tekshirish kerak:
- [ ] Barcha elementlar vertikal joylashgan
- [ ] Scroll ishlaydi
- [ ] Sidebar full-height
- [ ] Content scrollable

### 6. Real Device Test

#### iPhone (Safari)
```
1. Safari'da http://your-ip:5173 oching
2. Login qiling
3. Barcha funksiyalarni test qiling
4. Touch gestures ishlashini tekshiring
5. Scroll smooth ekanligini tekshiring
```

#### Android (Chrome)
```
1. Chrome'da http://your-ip:5173 oching
2. Login qiling
3. Barcha funksiyalarni test qiling
4. Back button ishlashini tekshiring
5. Keyboard ko'rinishi input focus'da
```

## Common Issues va Yechimlar

### Issue 1: Sidebar ko'rinmayapti
**Yechim:** `z-index: 1000` va `left: 0` class qo'shilganligini tekshiring

### Issue 2: Overlay bosilsa yopilmayapti
**Yechim:** `onClick={closeMobileMenu}` event handler qo'shilganligini tekshiring

### Issue 3: Content sidebar ostida qolgan
**Yechim:** `margin-left: 0` mobil ekranda qo'yilganligini tekshiring

### Issue 4: Modal ekrandan chiqib ketgan
**Yechim:** `max-width: calc(100% - 32px)` CSS qo'shilganligini tekshiring

### Issue 5: Jadval ko'rinmayapti
**Yechim:** `overflow-x: auto` va `min-width: 600px` qo'shilganligini tekshiring

## Performance Test

### Lighthouse Audit
```
1. Chrome DevTools oching
2. Lighthouse tab'ini tanlang
3. Mobile qurilma tanlang
4. "Analyze page load" bosing
5. Score'lar:
   - Performance: >80
   - Accessibility: >90
   - Best Practices: >80
   - SEO: >80
```

### Touch Target Size
- Minimum: 44px x 44px
- Recommended: 48px x 48px
- Spacing: 8px minimum

## Viewport Meta Tag

`index.html` da quyidagi tag borligini tekshiring:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

## CSS Features

### Flexbox
- ✅ Sidebar layout
- ✅ Navigation items
- ✅ Modal centering

### Media Queries
- ✅ 425px (mobile)
- ✅ 768px (tablet)
- ✅ 1024px+ (desktop)

### Touch Scrolling
```css
-webkit-overflow-scrolling: touch;
```

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ |
| Safari | 14+ | ✅ |
| Firefox | 88+ | ✅ |
| Edge | 90+ | ✅ |
| Samsung Internet | 14+ | ✅ |

## Checklist

### Before Deployment
- [ ] All pages responsive
- [ ] Touch targets ≥44px
- [ ] No horizontal scroll (except tables)
- [ ] Images optimized
- [ ] Fonts readable (≥13px)
- [ ] Buttons touch-friendly
- [ ] Forms easy to fill
- [ ] Modals mobile-optimized
- [ ] Tables scrollable
- [ ] Navigation easy to use

### After Deployment
- [ ] Test on real devices
- [ ] Check different screen sizes
- [ ] Verify touch interactions
- [ ] Test network conditions
- [ ] Monitor user feedback

---

**Test Sana:** 2026-08-09  
**Status:** ✅ Test tayyor
