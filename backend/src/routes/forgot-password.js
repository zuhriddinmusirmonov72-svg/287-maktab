import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { generateOtpCode, sendEmailOtp } from '../utils/sms.js';

const router = Router();

// PostgreSQL yoki NeDB ni dinamik aniqlash
const USE_POSTGRES = process.env.DATABASE_URL ? true : false;

// ─────────────────────────────────────────────
// POST /auth/forgot-password/send-otp
// ─────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email manzil kiritilishi shart' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Noto'g'ri email format" });
    }

    const emailNorm = email.trim().toLowerCase();
    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 daqiqa

    if (USE_POSTGRES) {
      const { pool } = await import('../db-postgres.js');

      // Foydalanuvchini email bo'yicha topish
      const userResult = await pool.query(
        'SELECT * FROM users WHERE LOWER(email) = $1',
        [emailNorm]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'Bu email bilan foydalanuvchi topilmadi' });
      }

      // Eski OTP larni o'chirish
      await pool.query('DELETE FROM otp_codes WHERE email = $1', [emailNorm]);

      // Yangi OTP saqlash
      await pool.query(
        `INSERT INTO otp_codes (email, code, verified, expires_at) VALUES ($1, $2, false, $3)`,
        [emailNorm, otpCode, expiresAt]
      );

    } else {
      const { db, collections } = await import('../database.js');

      const user = await db.findOne(collections.users, { email: emailNorm });
      if (!user) {
        return res.status(404).json({ message: 'Bu email bilan foydalanuvchi topilmadi' });
      }

      await db.remove(collections.otpCodes, { email: emailNorm });
      await db.insert(collections.otpCodes, {
        email: emailNorm,
        code: otpCode,
        expires_at: expiresAt.toISOString(),
        verified: false
      });
    }

    // Email yuborish - async (tezroq javob qaytarish uchun)
    try {
      await sendEmailOtp(email.trim(), otpCode);
      console.log('📧 Email OTP yuborildi:', email.trim());
    } catch (emailError) {
      console.error('📧 Email yuborishda xato:', emailError.message);
      // Email yuborilmasa ham davom etamiz - kod database da saqlangan
    }

    res.json({
      success: true,
      message: 'Tasdiqlash kodi email manzilingizga yuborildi'
    });

  } catch (err) {
    console.error('Forgot password send-otp xato:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /auth/forgot-password/verify-otp
// ─────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email va OTP kod kiritilishi shart' });
    }

    const emailNorm = email.trim().toLowerCase();
    const now = new Date();

    if (USE_POSTGRES) {
      const { pool } = await import('../db-postgres.js');

      const result = await pool.query(
        `SELECT * FROM otp_codes WHERE email = $1 AND code = $2`,
        [emailNorm, String(otp).trim()]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ message: "Noto'g'ri tasdiqlash kodi" });
      }

      const record = result.rows[0];
      if (now > new Date(record.expires_at)) {
        await pool.query('DELETE FROM otp_codes WHERE id = $1', [record.id]);
        return res.status(400).json({ message: 'Tasdiqlash kodi muddati tugagan. Yangi kod oling' });
      }

      await pool.query('UPDATE otp_codes SET verified = true WHERE id = $1', [record.id]);

    } else {
      const { db, collections } = await import('../database.js');

      const otpRecord = await db.findOne(collections.otpCodes, {
        email: emailNorm,
        code: String(otp).trim()
      });

      if (!otpRecord) {
        return res.status(400).json({ message: "Noto'g'ri tasdiqlash kodi" });
      }

      if (now > new Date(otpRecord.expires_at)) {
        await db.remove(collections.otpCodes, { _id: otpRecord._id });
        return res.status(400).json({ message: 'Tasdiqlash kodi muddati tugagan. Yangi kod oling' });
      }

      await db.update(collections.otpCodes, { _id: otpRecord._id }, { verified: true });
    }

    res.json({ success: true, message: "Tasdiqlash kodi to'g'ri" });

  } catch (err) {
    console.error('Forgot password verify-otp xato:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /auth/forgot-password/reset
// ─────────────────────────────────────────────
router.post('/reset', async (req, res) => {
  try {
    const { email, otp, new_password } = req.body;

    if (!email || !otp || !new_password) {
      return res.status(400).json({ message: 'Email, OTP va yangi parol kiritilishi shart' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak" });
    }

    const emailNorm = email.trim().toLowerCase();
    const hash = bcrypt.hashSync(new_password, 10);

    if (USE_POSTGRES) {
      const { pool } = await import('../db-postgres.js');

      // Tasdiqlangan OTP ni topish
      const otpResult = await pool.query(
        `SELECT * FROM otp_codes WHERE email = $1 AND code = $2 AND verified = true`,
        [emailNorm, String(otp).trim()]
      );

      if (otpResult.rows.length === 0) {
        return res.status(400).json({ message: 'Avval email manzilingizni tasdiqlang' });
      }

      // Foydalanuvchini topish
      const userResult = await pool.query(
        'SELECT * FROM users WHERE LOWER(email) = $1',
        [emailNorm]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
      }

      // Parolni yangilash
      await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, userResult.rows[0].id]);

      // OTP ni o'chirish
      await pool.query('DELETE FROM otp_codes WHERE id = $1', [otpResult.rows[0].id]);

    } else {
      const { db, collections } = await import('../database.js');

      const otpRecord = await db.findOne(collections.otpCodes, {
        email: emailNorm,
        code: String(otp).trim(),
        verified: true
      });

      if (!otpRecord) {
        return res.status(400).json({ message: 'Avval email manzilingizni tasdiqlang' });
      }

      const user = await db.findOne(collections.users, { email: emailNorm });
      if (!user) {
        return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
      }

      await db.update(collections.users, { _id: user._id }, { password: hash });
      await db.remove(collections.otpCodes, { _id: otpRecord._id });
    }

    console.log("✅ Parol email orqali tiklandi:", emailNorm);
    res.json({ success: true, message: "Parol muvaffaqiyatli o'zgartirildi" });

  } catch (err) {
    console.error('Forgot password reset xato:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
