# 🔐 SUPER ADMIN Login Ma'lumotlari

## 👑 Sizning maxsus SUPER ADMIN hisobingiz:

```
📱 Telefon: 975661099
🔑 Parol:   Mohidil
```

**MUHIM:** Login qilishda telefon raqamini **998 siz** kiriting!

---

## 🚀 Backend'ni qayta ishga tushiring:

### 1. Terminal'da backend papkasiga o'ting:
```bash
cd backend
```

### 2. Backend'ni ishga tushiring:
```bash
npm start
```

### 3. Console'da ko'rasiz:
```
✅ Seed ma'lumotlar yuklandi!

🔐 ═══════════════════════════════════════════
👑 SUPER ADMIN: 975661099 / Mohidil
🔐 ═══════════════════════════════════════════

📝 Test login ma'lumotlari:
👤 ADMIN:    998901234567 / admin123
👤 TEACHER:  998901234568 / teacher123
👤 STUDENT:  998901234569 / student123
```

---

## 🌐 Login sahifasida:

1. `http://localhost:5173/login` ga kiring
2. **Telefon:** `975661099` (998 siz!)
3. **Parol:** `Mohidil`
4. **Login** tugmasini bosing
5. ✅ SUPER ADMIN paneliga kirasiz!

---

## 🔒 Xavfsizlik:

- ✅ Parol bcrypt bilan hash qilingan
- ✅ Faqat siz bilasiz
- ✅ Database'da xavfsiz saqlanadi
- ✅ Token-based authentication

---

## 📝 Boshqa role'lar (test uchun):

### Admin:
```
📱 Telefon: 998901234567
🔑 Parol:   admin123
```

### O'qituvchi:
```
📱 Telefon: 998901234568
🔑 Parol:   teacher123
```

### O'quvchi:
```
📱 Telefon: 998901234569
🔑 Parol:   student123
```

---

## ⚠️ Agar login ishlamasa:

### Backend restart qiling:
```bash
# Terminal'da Ctrl+C bosing (backend to'xtatish)
# Keyin qayta ishga tushiring:
npm start
```

### Yoki database'ni qayta yarating:
```bash
# Backend to'xtatilgan holatda:
rm backend/data/users.db
npm start
```

---

## 🎉 Tayyor!

Endi sizning maxsus **SUPER ADMIN** hisobingiz tayyor!

**Login:** `975661099` / `Mohidil`

Backend ishga tushgandan keyin login qilishingiz mumkin! 👑
