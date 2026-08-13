# Guruh Detallari Sahifasi O'zgarishlari

## ✅ Bajarilgan O'zgarishlar:

### 1. **Tablar O'zgartirildi**
- ❌ **"Akademik davomati"** tabi olib tashlandi
- ✅ Endi faqat 2 ta tab qoldi:
  - Ma'lumotlar
  - Guruh darsliklari

### 2. **"Ma'lumotlar" Tabidan O'chirildi**
- ❌ **"Guruh mentorlari"** bo'limi to'liq olib tashlandi
- ❌ **"Parametrlar"** bo'limi to'liq olib tashlandi
- ✅ Endi faqat "Dars jadvali" ko'rsatiladi

### 3. **"Dars jadvali" Yangilandi**

#### Eski Format:
- Barcha kunlar ketma-ket ko'rsatilgan
- O'tgan kunlar ham ko'rsatilgan
- Flexbox layout (kichik kartochkalar)

#### Yangi Format:
- ✅ **2 qator x 4 ustun** grid layout
- ✅ **Faqat keyingi 8 kun** ko'rsatiladi
- ✅ **O'tgan kunlar avtomatik yashirinadi**
- ✅ **Bugungi va kelajak kunlar** ko'rsatiladi
- ✅ Kun o'tgach avtomatik yangi kunlar paydo bo'ladi
- ✅ Kattaroq kartochkalar (90px balandlik)
- ✅ Grid responsive (4 ustun)

#### Yangi Dizayn:
```
┌─────────┬─────────┬─────────┬─────────┐
│  Du 12  │  Se 13  │  Ch 14  │  Pa 15  │ ← 1-qator
├─────────┼─────────┼─────────┼─────────┤
│  Ju 16  │  Sha 17 │  Du 19  │  Se 20  │ ← 2-qator
└─────────┴─────────┴─────────┴─────────┘
```

---

## 🎯 Xususiyatlar:

### Dars Jadvalidagi Har Bir Kun:
- **Hafta kuni**: Ya, Du, Se, Ch, Pa, Ju, Sh
- **Kun raqami**: Katta shrift (24px)
- **Vaqt**: 20:49 (agar mavjud bo'lsa)
- **Holat belgisi**: ✓ (tugallangan darslar uchun)

### Ranglar:
- **Yashil border + fon**: Tugallangan dars
- **Moviy border + fon**: Davomat kiritish mumkin
- **Kulrang border**: Hali sana kelmagan

### Interaktivlik:
- **Hover effect**: Purple border + shadow
- **Clickable**: Faqat tugallangan yoki bugungi kunlar
- **Click**: Dars sahifasiga o'tish (`/groups/{id}/lesson?date=2026-08-12`)

---

## 📱 Mobile Responsive:

Grid layout `gridTemplateColumns: 'repeat(4, 1fr)'` ishlatadi, shuning uchun:
- Desktop: 4 ustun
- Tablet: 4 ustun (kichikroq)
- Mobile: Avtomatik responsive (CSS bilan qo'shimcha sozlash mumkin)

---

## 🔄 Avtomatik Yangilanish:

**Misol:**
- **Bugun**: 12-avgust, 2026
- **Ko'rsatiladigan kunlar**: 12, 13, 14, 15, 16, 17, 19, 20 avgust
- **Ertaga** (13-avgust): 13, 14, 15, 16, 17, 19, 20, 21 avgust ko'rsatiladi
- 12-avgust avtomatik yo'qoladi ✅

---

## 📋 Fayllar O'zgartirildi:

1. `src/pages/GroupDetails.jsx`:
   - Tabs array o'zgartirildi (3 → 2)
   - "Guruh mentorlari" va "Parametrlar" bloklari o'chirildi
   - `renderMonthDays` funksiyasi qayta yozildi:
     - O'tgan kunlarni filter qilish
     - Faqat 8 kunni ko'rsatish
     - Grid layout (2x4)

---

## ✅ Test Qilish:

1. SUPER ADMIN sifatida kiring (975661099 / Mohidil)
2. Guruhlar → Biror guruhni tanlang
3. "Ma'lumotlar" tabini tekshiring:
   - ❌ "Guruh mentorlari" yo'q
   - ❌ "Parametrlar" yo'q
   - ❌ "Akademik davomati" tab yo'q
   - ✅ Faqat "Dars jadvali" 2x4 grid

---

## 🚀 Keyingi Qadamlar:

User manual push qiladi:
```bash
git add .
git commit -m "Guruh detallari: mentorlari va parametrlar olib tashlandi, dars jadvali 2x4 grid"
git push origin main
```

Netlify avtomatik deploy qiladi! 🎉
