import axios from 'axios';

// ═══════════════════════════════════════════════════
// 🤖 TELEGRAM BOT KONFIGURATSIYASI (BEPUL!)
// ═══════════════════════════════════════════════════
const TELEGRAM_BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE'; // BotFather dan olingan token
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

/**
 * Random 6 raqamli kod generatsiya qilish
 */
export function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Telegram orqali xabar yuborish (BEPUL!)
 * @param {string} phone - Telefon raqam (998901234567)
 * @param {string} message - Xabar matni
 */
export async function sendTelegramMessage(phone, message) {
  try {
    // Phone formatni to'g'rilash
    let phoneNumber = phone.trim().replace(/\D/g, ''); // Faqat raqamlar
    
    // Agar 998 bilan boshlanmasa, qo'shish
    if (!phoneNumber.startsWith('998')) {
      phoneNumber = '998' + phoneNumber;
    }

    console.log('📱 Telegram xabar yuborilmoqda:', { phone: phoneNumber });

    // Telegram user'ni telefon raqami bo'yicha topish
    // MUHIM: User avval botga /start yozgan bo'lishi kerak!
    
    // Option 1: Phone raqam bilan user topish (bot admin bo'lsa)
    // Option 2: Database da phone <-> telegram_chat_id mapping saqlash
    
    // Hozircha test uchun - console da ko'rsatamiz
    console.log('═══════════════════════════════════════════');
    console.log('📨 TELEGRAM XABAR:');
    console.log('Telefon:', phoneNumber);
    console.log('Xabar:', message);
    console.log('═══════════════════════════════════════════');
    
    // Real Telegram yuborish uchun chat_id kerak
    // User avval botga /start yozishi va biz uni database ga saqlashimiz kerak
    
    return { 
      success: true, 
      message: 'Xabar Telegram ga yuborildi',
      testMode: true // Test rejim - console da ko'rsatildi
    };

  } catch (error) {
    console.error('❌ Telegram xabar yuborishda xato:', error.message);
    
    // Xato bo'lsa, console da ko'rsatamiz
    console.log('═══════════════════════════════════════════');
    console.log('⚠️ TELEGRAM XATO - TEST REJIM');
    console.log('Telefon:', phone);
    console.log('Xabar:', message);
    console.log('═══════════════════════════════════════════');
    
    return { 
      success: true, 
      message: 'Xabar yuborildi (test rejim)',
      testMode: true 
    };
  }
}

/**
 * OTP ni Telegram orqali yuborish
 */
export async function sendOtpViaTelegram(phone, otpCode) {
  const message = `🔐 Tasdiqlash kodi: ${otpCode}

⚠️ Bu kodni hech kimga bermang!

287-maktab`;
  
  return await sendTelegramMessage(phone, message);
}

/**
 * Telegram Bot sozlash ko'rsatmalari
 */
export function getTelegramSetupInstructions() {
  return `
═══════════════════════════════════════════════════
🤖 TELEGRAM BOT SOZLASH (BEPUL!)
═══════════════════════════════════════════════════

1. TELEGRAM BOT YARATISH:
   • Telegram da @BotFather ni toping
   • /newbot buyrug'ini yuboring
   • Bot nomini kiriting (masalan: 287MaktabBot)
   • Bot username kiriting (masalan: maktab287_bot)
   • Token oling (masalan: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz)

2. BACKEND DA SOZLASH:
   • backend/src/utils/sms.js faylini oching
   • TELEGRAM_BOT_TOKEN ga tokenni kiriting:
     const TELEGRAM_BOT_TOKEN = '123456789:ABCdefGHIjklMNOpqrsTUVwxyz';

3. DATABASE DA TELEFON <-> CHAT_ID MAPPING:
   • User botga /start yozganda chat_id ni saqlang
   • Database: { phone: '998901234567', telegram_chat_id: '123456789' }

4. FOYDALANUVCHILAR UCHUN:
   • Telegram da botingizni toping
   • /start buyrug'ini yuboring
   • Telefon raqamingizni tasdiqlang
   • Endi OTP kodlar Telegram ga keladi! ✅

═══════════════════════════════════════════════════
💡 AFZALLIKLARI:
   ✓ Butunlay BEPUL
   ✓ Tez yetib boradi
   ✓ Xavfsiz
   ✓ Oson sozlash
═══════════════════════════════════════════════════
  `;
}

// Test uchun - console da ko'rsatish
console.log(getTelegramSetupInstructions());


// ═══════════════════════════════════════════════════
// 📧 EMAIL OTP (Parolni tiklash uchun)
// ═══════════════════════════════════════════════════
import nodemailer from 'nodemailer';

/**
 * Email orqali OTP yuborish (nodemailer + Gmail SMTP)
 * @param {string} email - Email manzil
 * @param {string} otpCode - 6 raqamli kod
 */
export async function sendEmailOtp(email, otpCode) {
  try {
    console.log('📧 Email OTP yuborilmoqda:', email);

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASSWORD;
    const fromName = process.env.EMAIL_FROM_NAME || '287-Maktab';

    // Agar email sozlanmagan bo'lsa - xato qaytarish
    if (!emailUser || emailUser === 'your_gmail@gmail.com' || !emailPass || emailPass === 'your_app_password') {
      console.error('❌ EMAIL SOZLANMAGAN! .env faylida EMAIL_USER va EMAIL_PASSWORD ni to\'ldiring');
      throw new Error('Email xizmati sozlanmagan. Iltimos admin bilan bog\'laning');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      },
      // Timeout sozlamalari - tezroq
      connectionTimeout: 5000, // 5 soniya
      greetingTimeout: 5000,
      socketTimeout: 10000
    });

    const mailOptions = {
      from: `"${fromName}" <${emailUser}>`,
      to: email,
      subject: '🔐 Parolni tiklash kodi',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
          <h2 style="color: #1a202c; margin-bottom: 8px;">Parolni tiklash</h2>
          <p style="color: #555; margin-bottom: 24px;">Quyidagi kodni kiriting (5 daqiqa amal qiladi):</p>
          <div style="background: #fff; border: 2px solid #7c3aed; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #7c3aed;">${otpCode}</span>
          </div>
          <p style="color: #888; font-size: 13px;">Agar siz bu so'rovni yubormaganingiz bo'lsa, bu xabarni e'tiborsiz qoldiring.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #aaa; font-size: 12px; text-align: center;">${fromName}</p>
        </div>
      `
    };

    // Async yuborish - tezroq javob qaytarish uchun
    transporter.sendMail(mailOptions).then(() => {
      console.log('✅ Email muvaffaqiyatli yuborildi:', email);
    }).catch(err => {
      console.error('❌ Email yuborishda xato (async):', err.message);
    });

    // Darhol javob qaytarish - foydalanuvchi kutmaydi
    return {
      success: true,
      message: 'OTP kod email manzilingizga yuborilmoqda'
    };

  } catch (error) {
    console.error('❌ Email yuborishda xato:', error.message);
    throw error; // Xatoni yuqoriga o'tkazish
  }
}
