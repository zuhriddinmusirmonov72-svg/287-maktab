import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, collections } from '../database.js';
import { JWT_SECRET, authMiddleware } from '../middleware/auth.js';
import { generateOtpCode, sendOtpViaTelegram } from '../utils/sms.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ message: 'Telefon va parol kiritilishi shart' });

    const user = await db.findOne(collections.users, { phone });
    if (!user) return res.status(401).json({ message: 'Telefon yoki parol noto\'g\'ri' });

    if (!bcrypt.compareSync(password, user.password))
      return res.status(401).json({ message: 'Telefon yoki parol noto\'g\'ri' });

    let profile = null;
    if (user.role === 'teacher') profile = await db.findOne(collections.teachers, { user_id: user.id });
    else if (user.role === 'student') profile = await db.findOne(collections.students, { user_id: user.id });

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role, profile_id: profile?.id },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ success: true, data: { token, user: { id: user.id, phone: user.phone, role: user.role, full_name: profile?.full_name || user.phone, photo: profile?.photo || null, profile_id: profile?.id || null } } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// OTP yuborish - real SMS
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ message: 'Telefon raqami kiritilishi shart' });
    }

    // Phone formatni to'g'rilash
    let phoneNumber = phone.trim().replace(/\D/g, ''); // Faqat raqamlar
    
    // Agar 998 bilan boshlanmasa, qo'shish
    if (!phoneNumber.startsWith('998')) {
      phoneNumber = '998' + phoneNumber;
    }

    // Foydalanuvchini tekshirish
    const user = await db.findOne(collections.users, { phone: phone.trim() });
    if (!user) {
      return res.status(404).json({ message: 'Ushbu telefon raqam bilan foydalanuvchi topilmadi' });
    }

    // Random 6 raqamli kod generatsiya qilish
    const otpCode = generateOtpCode();
    
    console.log('🔐 OTP kod generatsiya qilindi:', { phone: phoneNumber, code: otpCode });

    // OTP ni database ga saqlash (5 daqiqa amal qiladi)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 daqiqa
    
    // Eski OTP kodlarni o'chirish
    await db.remove(collections.otpCodes, { phone: phone.trim() });
    
    // Yangi OTP ni saqlash
    await db.insert(collections.otpCodes, {
      phone: phone.trim(),
      code: otpCode,
      expires_at: expiresAt.toISOString(),
      verified: false
    });

    // SMS yuborish
    try {
      const smsResult = await sendOtpViaTelegram(phoneNumber, otpCode);
      console.log('📱 Telegram xabar yuborish natijasi:', smsResult);
      
      res.json({ 
        success: true, 
        message: 'Tasdiqlash kodi yuborildi',
        testMode: smsResult.testMode || false,
        // Test rejimda kodni qaytarish (production da o'chirish kerak!)
        ...(process.env.NODE_ENV !== 'production' && { testCode: otpCode })
      });
    } catch (smsError) {
      console.error('Telegram xabar yuborishda xato:', smsError);
      // Telegram yuborilmasa ham, test uchun kod saqlanadi
      res.json({ 
        success: true, 
        message: 'Tasdiqlash kodi yuborildi (test rejim)',
        testMode: true,
        testCode: otpCode // Test uchun
      });
    }
  } catch (err) {
    console.error('OTP yuborishda xato:', err);
    res.status(500).json({ message: err.message });
  }
});

// OTP tekshirish
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ message: 'Telefon va OTP kod kiritilishi shart' });
    }

    // OTP ni database dan topish
    const otpRecord = await db.findOne(collections.otpCodes, { 
      phone: phone.trim(),
      code: String(otp).trim()
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Noto\'g\'ri tasdiqlash kodi' });
    }

    // OTP muddatini tekshirish
    const now = new Date();
    const expiresAt = new Date(otpRecord.expires_at);
    
    if (now > expiresAt) {
      // Muddati o'tgan OTP ni o'chirish
      await db.remove(collections.otpCodes, { _id: otpRecord._id });
      return res.status(400).json({ message: 'Tasdiqlash kodi muddati tugagan. Yangi kod oling' });
    }

    // OTP ni tasdiqlangan deb belgilash
    await db.update(collections.otpCodes, { _id: otpRecord._id }, { verified: true });

    res.json({ 
      success: true, 
      message: 'Tasdiqlash kodi to\'g\'ri' 
    });
  } catch (err) {
    console.error('OTP tekshirishda xato:', err);
    res.status(500).json({ message: err.message });
  }
});

// Parol o'zgartirish - OTP tasdiqlanganligini tekshirish
router.post('/change-password', async (req, res) => {
  try {
    const { phone, new_password } = req.body;
    
    if (!phone || !new_password) {
      return res.status(400).json({ message: 'Telefon va yangi parol kiritilishi shart' });
    }
    
    if (new_password.length < 6) {
      return res.status(400).json({ message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' });
    }

    // OTP tasdiqlanganligini tekshirish
    const otpRecord = await db.findOne(collections.otpCodes, { 
      phone: phone.trim(),
      verified: true
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Avval telefon raqamingizni tasdiqlang' });
    }

    // OTP muddatini tekshirish (10 daqiqa ichida parol o'zgartirilishi kerak)
    const now = new Date();
    const expiresAt = new Date(otpRecord.expires_at);
    const tenMinutesAfterExpiry = new Date(expiresAt.getTime() + 10 * 60 * 1000);
    
    if (now > tenMinutesAfterExpiry) {
      await db.remove(collections.otpCodes, { _id: otpRecord._id });
      return res.status(400).json({ message: 'Vaqt tugadi. Qaytadan tasdiqlash kodni oling' });
    }

    // Foydalanuvchini topish
    const user = await db.findOne(collections.users, { phone: phone.trim() });
    if (!user) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }
    
    // Yangi parolni hash qilish va saqlash
    const hash = bcrypt.hashSync(new_password, 10);
    await db.update(collections.users, { _id: user._id }, { password: hash });
    
    // Ishlatilgan OTP ni o'chirish
    await db.remove(collections.otpCodes, { _id: otpRecord._id });
    
    console.log('✅ Parol muvaffaqiyatli o\'zgartirildi:', phone.trim());
    
    res.json({ 
      success: true, 
      message: 'Parol muvaffaqiyatli o\'zgartirildi' 
    });
  } catch (err) { 
    console.error('Parol o\'zgartirishda xato:', err);
    res.status(500).json({ message: err.message }); 
  }
});

// Parol o'zgartirish - autentifikatsiya bilan (Sozlamalar uchun)
router.post('/change-password-authenticated', authMiddleware, async (req, res) => {
  try {
    const { new_password } = req.body;
    
    if (!new_password) {
      return res.status(400).json({ message: 'Yangi parol kiritilishi shart' });
    }
    
    if (new_password.length < 6) {
      return res.status(400).json({ message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' });
    }
    
    // Foydalanuvchini topish
    const user = await db.findOne(collections.users, { id: req.user.id });
    if (!user) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }
    
    // Yangi parolni hash qilish va saqlash
    const hash = bcrypt.hashSync(new_password, 10);
    await db.update(collections.users, { _id: user._id }, { password: hash });
    
    res.json({ 
      success: true, 
      message: 'Parol muvaffaqiyatli o\'zgartirildi' 
    });
  } catch (err) { 
    console.error('Parol o\'zgartirishda xato:', err);
    res.status(500).json({ message: err.message }); 
  }
});

export default router;
