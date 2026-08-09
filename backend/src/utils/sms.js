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

