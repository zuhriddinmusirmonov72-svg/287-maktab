# 📱 Sizning Telefonda Test Qilish Yo'riqnomasi

## 📱 Telefon: 6.67" (1080×2400, 395 PPI)

---

## 🚀 TEZKOR BOSHLASH

### 1️⃣ Dev Server Ishga Tushirish
```cmd
cd d:\8-Oy\uyishi-2
npm run dev
```

Server ishga tushgach, terminal'da ko'rsatiladi:
```
Local: http://localhost:5173
Network: http://192.168.1.XXX:5173
```

### 2️⃣ IP Manzilni Topish (agar ko'rsatilmasa)
```cmd
ipconfig
```

Qidiring:
```
IPv4 Address: 192.168.1.XXX
```

### 3️⃣ Telefonda Ochish

1. **Telefonda Chrome yoki Browser ochish**
2. **Manzil kiritish:**
   ```
   http://192.168.1.XXX:5173
   ```
   (XXX ni o'z IP bilan almashtirish)
3. **Login qilish**

---

## ✅ TEST QILISH RO'YXATI

### Login Page ✓
- [ ] Sahifa to'g'ri yuklanadi
- [ ] Rasm yuqorida ko'rinadi
- [ ] Logo to'g'ri o'lchamda (55px)
- [ ] Telefon input to'liq kenglikda
- [ ] Parol input to'liq kenglikda
- [ ] Ko'z tugmasi (parolni ko'rish) ishlaydi
- [ ] "Parolni unutdingizmi?" tugmasi ko'rinadi
- [ ] Login tugmasi bosiladi (44px+ baland)
- [ ] Keyboard ochilganda input ko'rinadi

### Dashboard ✓
- [ ] Hamburger menu (☰) chap yuqorida ko'rinadi
- [ ] Hamburger bosilganda sidebar ochiladi
- [ ] Sidebar smooth animatsiya bilan ochiladi
- [ ] Qora overlay paydo bo'ladi
- [ ] Overlay bosilsa sidebar yopiladi
- [ ] Logo "287-maktab" o'qiladi
- [ ] Nav items barcha ko'rinadi
- [ ] Nav item bosilsa sidebar yopiladi va sahifa o'zgaradi
- [ ] Profile icon o'ng yuqorida
- [ ] Notification bell icon ko'rinadi

### Guruhlarim ✓
- [ ] Guruhlar ro'yxati ko'rinadi
- [ ] Har bir guruh kartasi to'liq kenglikda
- [ ] Font o'qiladi (12-13px)
- [ ] Guruhni bosish mumkin
- [ ] Darslar ro'yxati ochiladi

### Darslar ✓
- [ ] Darslar jadvali ko'rinadi
- [ ] Jadval horizontal scroll bor (agar kerak)
- [ ] Status badge'lar ko'rinadi:
  - [ ] Berilmagan (kulrang)
  - [ ] Bajarilmagan (qizil)
  - [ ] Kutilmoqda (ko'k)
  - [ ] Qabul qilingan (yashil)
  - [ ] Qaytarilgan (sariq)
- [ ] Darsni bosish ishlaydi
- [ ] Modal ochiladi

### Uyga Vazifa Modal ✓
- [ ] Modal to'liq ekranda
- [ ] Video player ko'rinadi
- [ ] Video play tugmasi ishlaydi
- [ ] Video to'liq ekranda (responsive)
- [ ] Uyga vazifa tavsifi ko'rinadi
- [ ] File upload tugmasi ishlaydi
- [ ] Telefonda fayl tanlanadi
- [ ] Matn input (GitHub link) to'liq kenglikda
- [ ] Yuborish tugmasi bosiladi
- [ ] Upload progress ko'rinadi
- [ ] Success xabari chiqadi

### Notification Panel ✓
- [ ] Bell icon'ni bosish
- [ ] Panel ochiladi (ekran kengligiga mos)
- [ ] Panel ekrandan chiqib ketmaydi
- [ ] Scroll ishlaydi (ko'p notification bo'lsa)
- [ ] Notification'ni bosish
- [ ] O'qilgan deb belgilanadi
- [ ] "Barchasini o'qilgan" tugmasi ishlaydi

### Sozlamalar ✓
- [ ] Sozlamalar sahifasi ochiladi
- [ ] Ism ko'rinadi (readonly)
- [ ] Telefon raqam ko'rinadi (readonly)
- [ ] Parol o'zgartirish tugmasi bor
- [ ] Modal ochiladi
- [ ] Yangi parol input'lari to'liq kenglikda
- [ ] Ko'z tugmalari ishlaydi
- [ ] Parol o'zgartirish ishlaydi
- [ ] Success xabari chiqadi

### Ko'rsatgichlarim ✓
- [ ] Kumush tangalar soni ko'rinadi
- [ ] XP va Level ko'rinadi
- [ ] Progress bar to'liq kenglikda
- [ ] Progress bar animatsiya bor
- [ ] Ko'k gradient rangi

---

## 🐛 MUAMMOLAR VA YECHIMLAR

### 1. Sayt ochilmayapti
**Muammo:** "This site can't be reached"

**Yechim:**
- [ ] Kompyuter va telefon bir xil Wi-Fi'da ekanligini tekshiring
- [ ] IP manzilni to'g'ri kiritdingizmi tekshiring
- [ ] Dev server ishlab turganligini tekshiring
- [ ] Firewall saytga ruxsat berganligini tekshiring

```cmd
# Windows Firewall uchun
# "Allow an app through firewall" → Node.js'ga ruxsat bering
```

### 2. Hamburger menu ko'rinmayapti
**Muammo:** Sidebar doimo ochiq

**Yechim:**
- [ ] Ekran kengligini tekshiring (360px CSS width bo'lishi kerak)
- [ ] Browser cache'ni tozalang (Chrome → Settings → Clear browsing data)
- [ ] Sahifani refresh qiling (F5)

### 3. Elementlar kichik yoki katta
**Muammo:** Font size noto'g'ri

**Yechim:**
- [ ] Browser zoom 100% ekanligini tekshiring
- [ ] Settings → Display → Font size: Normal
- [ ] Hard refresh: Ctrl+Shift+R (yoki Cmd+Shift+R)

### 4. Scroll ishlamayapti
**Muammo:** Sahifa scroll qilmayapti

**Yechim:**
- [ ] Browser'ni yangilang (oxirgi versiya)
- [ ] Touch scrolling yoqilganligini tekshiring
- [ ] Sahifani refresh qiling

### 5. Video play bo'lmayapti
**Muammo:** Video boshlanganda error

**Yechim:**
- [ ] Internet tezligini tekshiring
- [ ] Backend ishlab turganligini tekshiring
- [ ] Video format qo'llab-quvvatlanishini tekshiring
- [ ] Browser console'da error'larni ko'ring

### 6. File upload ishlamayapti
**Muammo:** Fayl yuklanmayapti

**Yechim:**
- [ ] File size juda katta emasligini tekshiring (<10MB)
- [ ] Internet connection barqarorligini tekshiring
- [ ] Backend endpoint ishlayotganligini tekshiring
- [ ] Browser permissions (file access) tekshiring

---

## 📊 PERFORMANCE TEST

### Yuklanish Vaqti
```
Yaxshi:     <2 soniya
O'rtacha:   2-4 soniya
Sekin:      >4 soniya
```

**Agar sekin bo'lsa:**
- Internet tezligini tekshiring
- Backend server yaqinligini tekshiring
- Image'lar optimized ekanligini tekshiring

### Scroll Smoothness
```
Smooth:     60 FPS
O'rtacha:   30-60 FPS
Lag:        <30 FPS
```

**Agar lag bo'lsa:**
- Browser'ni yangilang
- Cache'ni tozalang
- Background app'larni yoping

---

## 📸 SCREENSHOT OLISH

### Test natijalari uchun
1. Login page screenshot
2. Dashboard (hamburger yopiq)
3. Dashboard (sidebar ochiq)
4. Guruhlar ro'yxati
5. Darslar jadvali
6. Uyga vazifa modal
7. Notification panel
8. Sozlamalar sahifasi

---

## 🎯 KUTILGAN NATIJA

### Desktop vs Telefon

| Element | Desktop | Telefon (360px) |
|---------|---------|-----------------|
| Sidebar | Doimo ko'rinadi | Hamburger menu |
| Logo | 28px | 24px |
| Nav items | 13px | 12px |
| Content padding | 24px | 12px 10px |
| Table font | 14px | 11px |
| Button font | 14px | 12px |

### Touch Targets

Barcha tugmalar kamida **44px** baland bo'lishi kerak:
- ✅ Login tugmasi
- ✅ Hamburger menu
- ✅ Nav items
- ✅ Upload tugmasi
- ✅ Yuborish tugmasi
- ✅ Notification bell
- ✅ Profile icon

---

## ✅ FINAL CHECKLIST

### Before Test
- [ ] Dev server ishlab turibdi
- [ ] Backend server ishlab turibdi
- [ ] Telefon va kompyuter bir xil Wi-Fi'da
- [ ] IP manzil to'g'ri
- [ ] Browser yangilangan

### During Test
- [ ] Har bir sahifani ochish
- [ ] Har bir tugmani bosish
- [ ] Har bir input'ga yozish
- [ ] Scroll qilish (yuqori-pastga)
- [ ] Horizontal scroll (jadval)
- [ ] Video play qilish
- [ ] File upload qilish

### After Test
- [ ] Screenshot'lar olindi
- [ ] Muammolar yozildi
- [ ] Performance yaxshi
- [ ] Barcha funksiyalar ishlaydi
- [ ] UI chiroyli ko'rinadi

---

## 📞 YORDAM

### Chrome DevTools (Desktop)
Agar telefonda test qilishdan oldin desktop'da tekshirmoqchi bo'lsangiz:

```
1. Chrome'ni oching
2. F12 bosing
3. Ctrl+Shift+M bosing
4. Width: 360px
5. Height: 800px
6. DPR: 3
7. User Agent: Android
8. Test qiling
```

### Network Tab
Agar muammo bo'lsa, Network tab'da tekshiring:
```
F12 → Network → Refresh
```

- Red color: Failed request
- Status 200: OK
- Status 404: Not found
- Status 500: Server error

### Console Tab
JavaScript error'larni ko'rish:
```
F12 → Console
```

Red error'lar bo'lmasligi kerak.

---

## 🎉 SUCCESS!

Agar barcha test'lar o'tsa:
- ✅ **Sayt telefonda mukammal ishlaydi!**
- ✅ **Barcha funksiyalar to'g'ri**
- ✅ **UI chiroyli**
- ✅ **Performance yaxshi**
- ✅ **Production uchun tayyor!**

---

**Test Sana:** 2026-08-09  
**Telefon:** 6.67" (1080×2400, 360px CSS)  
**Status:** 🟢 **TAYYOR TEST QILISH UCHUN**
