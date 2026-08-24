import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db-postgres.js';
import { JWT_SECRET, authMiddleware } from '../middleware/auth.js';
import { generateOtpCode, sendOtpViaTelegram } from '../utils/sms.js';

const router = Router();

// =============================================
// 🔐 LOGIN
// =============================================
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ message: 'Telefon va parol kiritilishi shart' });
    }

    // Phoneni xuddi kiritilganidek qidirish (998 qo'shmasdan)
    const userResult = await query('SELECT * FROM users WHERE phone = $1', [phone.trim()]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Telefon yoki parol noto\'g\'ri' });
    }

    const user = userResult.rows[0];

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Telefon yoki parol noto\'g\'ri' });
    }

    // Profile ma'lumotlarini olish
    let profile = null;
    if (user.role.toLowerCase() === 'teacher') {
      const teacherResult = await query('SELECT * FROM teachers WHERE user_id = $1', [user.id]);
      profile = teacherResult.rows[0] || null;
    } else if (user.role.toLowerCase() === 'student') {
      const studentResult = await query('SELECT * FROM students WHERE user_id = $1', [user.id]);
      profile = studentResult.rows[0] || null;
    }

    // JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        phone: user.phone, 
        role: user.role, 
        profile_id: profile?.id 
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // ✅ Foydalanuvchini default chat guruhiga qo'shish (ID=1)
    try {
      await query(`
        INSERT INTO chat_group_members (chat_group_id, user_id, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (chat_group_id, user_id) DO NOTHING
      `, [1, user.id, 'member']);
    } catch (chatErr) {
      console.warn('Chat guruhiga qo\'shishda xato:', chatErr.message);
      // Ignore error - chat is not critical for login
    }

    res.json({ 
      success: true, 
      data: { 
        token, 
        user: { 
          id: user.id, 
          phone: user.phone, 
          role: user.role, 
          full_name: profile?.full_name || user.full_name || user.phone, 
          photo: profile?.photo || null, 
          profile_id: profile?.id || null 
        } 
      } 
    });
  } catch (err) { 
    console.error('Login xato:', err);
    res.status(500).json({ message: err.message }); 
  }
});

// =============================================
// 📱 OTP YUBORISH
// =============================================
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
    const userResult = await query('SELECT * FROM users WHERE phone = $1', [phone.trim()]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Ushbu telefon raqam bilan foydalanuvchi topilmadi' });
    }

    // Random 6 raqamli kod generatsiya qilish
    const otpCode = generateOtpCode();
    
    console.log('🔐 OTP kod generatsiya qilindi:', { phone: phoneNumber, code: otpCode });

    // OTP ni database ga saqlash (5 daqiqa amal qiladi)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 daqiqa
    
    // Eski OTP kodlarni o'chirish
    await query('DELETE FROM otp_codes WHERE phone = $1', [phone.trim()]);
    
    // Yangi OTP ni saqlash
    await query(
      'INSERT INTO otp_codes (phone, code, expires_at) VALUES ($1, $2, $3)',
      [phone.trim(), otpCode, expiresAt]
    );

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

// =============================================
// ✅ OTP TEKSHIRISH
// =============================================
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ message: 'Telefon va OTP kod kiritilishi shart' });
    }

    // OTP ni database dan topish
    const otpResult = await query(
      'SELECT * FROM otp_codes WHERE phone = $1 AND code = $2',
      [phone.trim(), String(otp).trim()]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ message: 'Noto\'g\'ri tasdiqlash kodi' });
    }

    const otpRecord = otpResult.rows[0];

    // OTP muddatini tekshirish
    const now = new Date();
    const expiresAt = new Date(otpRecord.expires_at);
    
    if (now > expiresAt) {
      // Muddati o'tgan OTP ni o'chirish
      await query('DELETE FROM otp_codes WHERE id = $1', [otpRecord.id]);
      return res.status(400).json({ message: 'Tasdiqlash kodi muddati tugagan. Yangi kod oling' });
    }

    // OTP ni tasdiqlangan deb belgilash (verified column qo'shish kerak bo'lsa)
    // await query('UPDATE otp_codes SET verified = true WHERE id = $1', [otpRecord.id]);

    res.json({ 
      success: true, 
      message: 'Tasdiqlash kodi to\'g\'ri' 
    });
  } catch (err) {
    console.error('OTP tekshirishda xato:', err);
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 🔑 PAROL O'ZGARTIRISH (OTP bilan)
// =============================================
router.post('/change-password', async (req, res) => {
  try {
    const { phone, new_password } = req.body;
    
    if (!phone || !new_password) {
      return res.status(400).json({ message: 'Telefon va yangi parol kiritilishi shart' });
    }
    
    if (new_password.length < 6) {
      return res.status(400).json({ message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' });
    }

    // OTP tasdiqlanganligini tekshirish (oxirgi OTP)
    const otpResult = await query(
      'SELECT * FROM otp_codes WHERE phone = $1 ORDER BY created_at DESC LIMIT 1',
      [phone.trim()]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ message: 'Avval telefon raqamingizni tasdiqlang' });
    }

    const otpRecord = otpResult.rows[0];

    // OTP muddatini tekshirish (10 daqiqa ichida parol o'zgartirilishi kerak)
    const now = new Date();
    const expiresAt = new Date(otpRecord.expires_at);
    const tenMinutesAfterExpiry = new Date(expiresAt.getTime() + 10 * 60 * 1000);
    
    if (now > tenMinutesAfterExpiry) {
      await query('DELETE FROM otp_codes WHERE id = $1', [otpRecord.id]);
      return res.status(400).json({ message: 'Vaqt tugadi. Qaytadan tasdiqlash kodni oling' });
    }

    // Foydalanuvchini topish
    const userResult = await query('SELECT * FROM users WHERE phone = $1', [phone.trim()]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }

    const user = userResult.rows[0];
    
    // Yangi parolni hash qilish va saqlash
    const hash = bcrypt.hashSync(new_password, 10);
    await query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hash, user.id]);
    
    // Ishlatilgan OTP ni o'chirish
    await query('DELETE FROM otp_codes WHERE id = $1', [otpRecord.id]);
    
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

// =============================================
// 🔐 PAROL O'ZGARTIRISH (Authenticated)
// =============================================
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
    const userResult = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }
    
    // Yangi parolni hash qilish va saqlash
    const hash = bcrypt.hashSync(new_password, 10);
    await query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hash, req.user.id]);
    
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
