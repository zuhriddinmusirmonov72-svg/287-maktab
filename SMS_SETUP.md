# 📱 Real SMS Yuborish - Sozlash Qo'llanmasi

## ✅ Nima amalga oshirildi?

1. **Random OTP kod generatsiyasi** - Har safar 6 raqamli tasodifiy kod
2. **OTP database** - Kodlar 5 daqiqa davomida saqlanadi
3. **OTP tekshirish** - Kiritilgan kod database bilan solishtirilib tekshiriladi
4. **Eskiz.uz SMS API integratsiyasi** - Real SMS yuborish tayyor

## 🔧 Eskiz.uz SMS sozlash (Real SMS yuborish uchun)

### 1-qadam: Eskiz.uz da ro'yxatdan o'ting

1. Saytga o'ting: https://eskiz.uz
2. Ro'yxatdan o'ting va hisobingizni to'ldiring
3. Email va parolni eslang

### 2-qadam: Backend'da Eskiz.uz ma'lumotlarini kiriting

Faylni oching: `backend/src/utils/sms.js`

O'zgartiring:
```javascript
const ESKIZ_EMAIL = 'sizning-email@example.com'; // O'zingizning emailingiz
const ESKIZ_PASSWORD = 'sizning-parolingiz'; // O'zingizning parolingiz
```

### 3-qadam: Backend'ni qayta ishga tushiring

```bash
cd backend
npm start
```

## 🧪 TEST REJIM (Eskiz.uz sozlanmagan bo'lsa)

Agar Eskiz.uz sozlanmagan bo'lsa, tizim avtomatik **test rejimda** ishlaydi:

- ✅ OTP kod database ga saqlanadi
- ✅ Console da ko'rinadi
- ⚠️ Real SMS yuborilmaydi

**Console da OTP kodni ko'rish:**
```
🔐 OTP kod generatsiya qilindi: { phone: '998901234569', code: '123456' }
```

## 📱 Qanday ishlaydi?

### 1. Telefon raqamni kiriting
- Login sahifasida "Parolni unutdingizmi?" bosing
- Telefon raqamingizni kiriting (998 siz): `901234569`

### 2. SMS yuboriladi
- Tizim **random 6 raqamli kod** generatsiya qiladi
- Kod **5 daqiqa** amal qiladi
- Eskiz.uz orqali SMS yuboriladi (yoki test rejim)

### 3. OTP kodni kiriting
- SMS da kelgan kodni kiriting
- Tizim database bilan solishtiradi
- To'g'ri bo'lsa, parol o'zgartirish sahifasiga o'tasiz

### 4. Yangi parol kiriting
- Yangi parolni kiriting (kamida 6 ta belgi)
- Parol o'zgaradi ✅

## 🔐 Xavfsizlik

- ✅ Har bir telefon uchun **alohida kod**
- ✅ Kod **5 daqiqa** amal qiladi
- ✅ Kod ishlatilgandan so'ng **avtomatik o'chiriladi**
- ✅ Eski kodlar **avtomatik o'chiriladi**
- ✅ Kod **database da shifrlangan** saqlanadi

## 🚀 Production uchun

`backend/src/routes/auth.js` faylida **test kodini o'chirish:**

O'zgartiring:
```javascript
// Test rejimda kodni qaytarish (production da o'chirish kerak!)
...(process.env.NODE_ENV !== 'production' && { testCode: otpCode })
```

Bu qatorni o'chiring yoki `NODE_ENV=production` o'rnating.

## 📞 Boshqa SMS providerlar

Eskiz.uz o'rniga boshqa providerlardan foydalanish mumkin:

1. **Playmobile.uz** - https://playmobile.uz
2. **SMS.uz** - https://sms.uz
3. **Ucell/Beeline** - To'g'ridan-to'g'ri operatorlar

`backend/src/utils/sms.js` faylida `sendSMS` funksiyasini o'zgartiring.
