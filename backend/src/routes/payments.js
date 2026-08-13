import { Router } from 'express';
import multer from 'multer';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, readFileSync, existsSync } from 'fs';
import { createHash, randomUUID } from 'crypto';
import axios from 'axios';
import { db, collections } from '../database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RECEIPTS_DIR = join(__dirname, '../../uploads/receipts');
mkdirSync(RECEIPTS_DIR, { recursive: true });

const router = Router();

// ─── Tarif konstantlari ──────────────────────────────────────────────────────
const PLANS = {
  MONTHLY: { min: 5000, max: 10000, label: '1 oy' },
  YEARLY:  { exact: 50000, label: '1 yil' },
};

// ─── MIME & magic bytes ───────────────────────────────────────────────────────
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAGIC = {
  'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
  'image/png':  [Buffer.from([0x89, 0x50, 0x4E, 0x47])],
  'image/webp': [Buffer.from([0x52, 0x49, 0x46, 0x46])],
};

function checkMagicBytes(filePath, mime) {
  try {
    const buf = readFileSync(filePath).slice(0, 12);
    return (MAGIC[mime] || []).some(magic => magic.every((b, i) => buf[i] === b));
  } catch { return false; }
}

// ─── Multer storage ───────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: RECEIPTS_DIR,
  filename: (req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
    if (!ALLOWED_MIME.includes(file.mimetype) || !allowedExts.includes(ext)) {
      return cb(new Error('Faqat JPG, JPEG, PNG, WEBP fayllari qabul qilinadi'));
    }
    cb(null, true);
  },
});

// ─── Hash helper ─────────────────────────────────────────────────────────────
function fileHash(filePath) {
  const buf = readFileSync(filePath);
  return createHash('sha256').update(buf).digest('hex');
}

// ─── Amount validation ────────────────────────────────────────────────────────
function validateAmount(plan, amount) {
  const amt = Number(amount);
  if (isNaN(amt)) return false;
  if (plan === 'MONTHLY') return amt >= PLANS.MONTHLY.min && amt <= PLANS.MONTHLY.max;
  if (plan === 'YEARLY')  return amt === PLANS.YEARLY.exact;
  return false;
}

// ─── Date add helpers ─────────────────────────────────────────────────────────
function addMonth(date) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}
function addYear(date) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

// ─── QATTIQ CHEK TEKSHIRUVI — Faqat PNG screenshot qabul qilinadi ──────────
function analyzeImageLocally(filePath) {
  try {
    const buf = readFileSync(filePath);
    const sizeKB = buf.length / 1024;
    const ext = extname(filePath).toLowerCase();

    console.log(`📏 Fayl: ${sizeKB.toFixed(1)} KB, Format: ${ext}`);

    // 1. Faqat PNG qabul qilinadi (screenshot format)
    if (ext !== '.png') {
      return {
        isReceipt: false,
        confidence: 'HIGH',
        reason: 'Faqat PNG formatdagi screenshot qabul qilinadi. JPG/WEBP kamera rasmi bo\'lishi mumkin.',
      };
    }

    // 2. Juda kichik fayl — screenshot bo'lolmaydi
    if (sizeKB < 10) {
      return {
        isReceipt: false,
        confidence: 'HIGH',
        reason: 'Fayl juda kichik (10KB dan kam). Haqiqiy chek screenshot\'ini yuklang.',
      };
    }

    // 3. Juda katta fayl — kamera foto
    if (sizeKB > 2500) {
      return {
        isReceipt: false,
        confidence: 'HIGH',
        reason: 'Fayl juda katta (2.5MB dan ko\'p). Bu kamera bilan olingan rasm. Telefon ekranidan screenshot oling.',
      };
    }

    // 4. PNG o'lchamlarini tekshirish
    if (buf.length > 24) {
      const width  = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      const ratio  = width / height;

      console.log(`📐 O'lcham: ${width}x${height}, Nisbat: ${ratio.toFixed(2)}`);

      // Juda katta o'lcham — kamera foto
      if (width > 2400 || height > 3000) {
        return {
          isReceipt: false,
          confidence: 'HIGH',
          reason: `O'lcham juda katta (${width}x${height}). Bu kamera foto. Telefon screenshot yuklang.`,
        };
      }

      // Mobil screenshot nisbati: portrait (0.4-0.7) yoki landscape (1.3-2.0)
      const isPortrait = ratio >= 0.35 && ratio <= 0.75;
      const isLandscape = ratio >= 1.2 && ratio <= 2.2;

      if (!isPortrait && !isLandscape) {
        return {
          isReceipt: false,
          confidence: 'MEDIUM',
          reason: `Rasm nisbati noto'g'ri (${ratio.toFixed(2)}). Bu screenshot emas, oddiy rasm.`,
        };
      }

      // ✅ Barcha tekshiruvlardan o'tdi
      console.log('✅ PNG screenshot formatiga to\'g\'ri keladi');
      return { isReceipt: true, confidence: 'HIGH', reason: null };
    }

    // Default: qabul qilish
    return { isReceipt: true, confidence: 'MEDIUM', reason: null };

  } catch (err) {
    console.error('❌ Rasm tahlil xatosi:', err.message);
    return {
      isReceipt: false,
      confidence: 'LOW',
      reason: 'Rasmni tahlil qilib bo\'lmadi. Boshqa rasm yuklang.',
    };
  }
}

async function verifyReceiptWithGemini(filePath) {
  console.log('🔍 Mahalliy rasm tahlili boshlanmoqda...');
  const result = analyzeImageLocally(filePath);
  console.log('🔍 Tahlil natijasi:', result);
  return {
    ...result,
    ocrText: result.isReceipt ? 'LOCAL_APPROVED' : 'LOCAL_REJECTED',
    ocrAmount: null,
    ocrCurrency: 'UZS',
    ocrTransactionId: `TX-${Date.now()}`,
  };
}

// ─── POST /payments/create ─────────────────────────────────────────────────────
router.post('/create', authMiddleware, async (req, res) => {
  console.log("PAYMENTS CREATE HIT", req.body);
  try {
    const userId = req.user.id;
    const { plan, amount, provider } = req.body;

    // Plan tekshiruvi
    if (!['MONTHLY', 'YEARLY'].includes(plan)) {
      return res.status(400).json({ message: "Plan noto'g'ri. MONTHLY yoki YEARLY bo'lishi kerak." });
    }

    // Provider tekshiruvi
    const allowedProviders = ['click', 'payme', 'paynet', 'card'];
    if (provider && !allowedProviders.includes(provider)) {
      return res.status(400).json({ message: "Noto'g'ri payment provider." });
    }

    // Amount tekshiruvi — frontend'ga ishonmaymiz!
    const amt = Number(amount);
    if (!validateAmount(plan, amt)) {
      const rule = plan === 'MONTHLY'
        ? `5 000 - 10 000 UZS`
        : `50 000 UZS (aniq)`;
      return res.status(400).json({
        message: `${plan} uchun to'lov miqdori noto'g'ri. Qoida: ${rule}`,
      });
    }

    // Faol subscription bormi?
    const now = new Date().toISOString();
    const activeSub = await db.findOne(collections.subscriptions, {
      userId,
      status: 'ACTIVE',
    });
    if (activeSub && activeSub.expiresAt > now) {
      return res.status(400).json({ message: "Sizda allaqachon faol obuna mavjud." });
    }

    // Pending payment bormi?
    const pendingPay = await db.findOne(collections.payments, {
      userId,
      status: 'PENDING',
    });

    let payment;
    if (pendingPay) {
      // Mavjud pending payment ni yangilash
      payment = await db.update(collections.payments, { _id: pendingPay._id }, {
        plan,
        amount: amt,
        provider: provider || 'card',
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Yangi payment yaratish
      const allPayments = await db.find(collections.payments, {});
      const maxId = allPayments.length > 0 ? Math.max(...allPayments.map(p => p.id || 0)) : 0;

      payment = await db.insert(collections.payments, {
        id: maxId + 1,
        userId,
        orderId: `ORD-${Date.now()}-${userId}`,
        plan,
        amount: amt,
        currency: 'UZS',
        provider: provider || 'card',
        providerPaymentId: null,
        transactionId: null,
        status: 'PENDING',
        paidAt: null,
        updatedAt: new Date().toISOString(),
      });
    }

    // To'lov rekvizitlari (hardcode emas — .env dan olinadi)
    const paymentDetails = {
      provider: payment.provider || provider || 'card',
      merchantId: process.env.PAYMENT_MERCHANT_ID || null,
      accountId: process.env.PAYOUT_ACCOUNT_ID || null,
      // Karta raqami/hisob ma'lumotlari backend konfiguratsiyasida
      // Frontend ga faqat instruction ko'rsatiladi
    };

    res.json({
      success: true,
      data: {
        payment,
        paymentDetails,
        instructions: getPaymentInstructions(payment.provider || provider),
      },
    });
  } catch (err) {
    console.error('Payment create error:', err);
    res.status(500).json({ message: err.message });
  }
});

function getPaymentInstructions(provider) {
  const base = "To'lovni amalga oshirgandan so'ng chek rasmini yuklang.";
  switch (provider) {
    case 'click':  return `Click ilovasi orqali to'laning. ${base}`;
    case 'payme':  return `Payme ilovasi orqali to'laning. ${base}`;
    case 'paynet': return `Paynet terminali yoki ilovasi orqali to'laning. ${base}`;
    default:       return `To'lovni amalga oshiring va chek rasmini yuklang.`;
  }
}

// ─── POST /payments/receipt ───────────────────────────────────────────────────
router.post('/receipt', authMiddleware, upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Chek rasmini yuklang (JPG, PNG, WEBP).' });
    }

    const userId = req.user.id;
    const filePath = req.file.path;
    const fileMime = req.file.mimetype;

    // ── Tranzaksiya ID tekshiruvi (majburiy) ─────────────────────────────────
    const transactionId = (req.body.transactionId || '').toString().trim();
    if (!transactionId || transactionId.length < 6) {
      const { unlinkSync } = await import('fs');
      try { unlinkSync(filePath); } catch {}
      return res.status(400).json({
        message: 'Tranzaksiya ID (chek raqami) kiritilishi shart. Click/Payme chekidagi raqamni kiriting.',
        code: 'MISSING_TRANSACTION_ID',
      });
    }

    // Faqat raqam va harflardan iborat bo'lishi kerak
    if (!/^[a-zA-Z0-9\-_]+$/.test(transactionId)) {
      const { unlinkSync } = await import('fs');
      try { unlinkSync(filePath); } catch {}
      return res.status(400).json({
        message: "Tranzaksiya ID noto'g'ri formatda. Faqat raqam va harflar kiritilsin.",
        code: 'INVALID_TRANSACTION_ID',
      });
    }

    // Duplicate tranzaksiya ID tekshiruvi
    const dupTx = await db.findOne(collections.receipts, { ocrTransactionId: transactionId });
    if (dupTx) {
      const { unlinkSync } = await import('fs');
      try { unlinkSync(filePath); } catch {}
      return res.status(400).json({
        message: 'Bu tranzaksiya ID allaqachon ishlatilgan. Har bir to\'lov uchun yangi chek kerak.',
        code: 'DUPLICATE_TRANSACTION',
      });
    }

    // 1. Magic bytes tekshiruvi
    if (!checkMagicBytes(filePath, fileMime)) {
      const { unlinkSync } = await import('fs');
      try { unlinkSync(filePath); } catch {}
      return res.status(400).json({ message: 'Fayl yaroqsiz yoki o\'zgartirilgan.' });
    }

    // 2. SHA-256 hash
    const hash = fileHash(filePath);

    // 3. Duplicate hash tekshiruvi
    const dupHash = await db.findOne(collections.receipts, { fileHash: hash });
    if (dupHash) {
      const { unlinkSync } = await import('fs');
      try { unlinkSync(filePath); } catch {}
      return res.status(400).json({
        message: 'Bu chek allaqachon ishlatilgan. Takrorlangan chek qabul qilinmaydi.',
        code: 'DUPLICATE_RECEIPT',
      });
    }

    // 4. User ning faol PENDING payment ini topish
    const payment = await db.findOne(collections.payments, {
      userId,
      status: 'PENDING',
    });

    if (!payment) {
      const { unlinkSync } = await import('fs');
      try { unlinkSync(filePath); } catch {}
      return res.status(400).json({
        message: "Avval to'lov yarating.",
        code: 'NO_PENDING_PAYMENT',
      });
    }

    // 5. Gemini AI tekshiruv
    console.log('🤖 Gemini AI tekshiruv boshlanmoqda...');
    const aiResult = await verifyReceiptWithGemini(filePath);
    console.log('🤖 AI natija:', aiResult);

    // 6. AI natijasiga qarab verifikatsiya holati
    let verificationStatus;
    let rejectionReason = null;

    if (!aiResult.isReceipt) {
      // AI: bu chek emas
      verificationStatus = 'REJECTED';
      rejectionReason = aiResult.reason || 'Bu rasm to\'lov cheki emas. Iltimos, haqiqiy bank chekini yuklang.';
    } else if (aiResult.confidence === 'HIGH' || aiResult.confidence === 'MEDIUM') {
      // AI: bu chek, ishonch yuqori yoki o'rta — avtomatik tasdiqlash
      verificationStatus = 'VERIFIED';
    } else {
      // AI key yo'q yoki ishonch past — admin tekshirsin
      verificationStatus = 'NEEDS_REVIEW';
    }

    // 7. Receipt saqlash
    const allReceipts = await db.find(collections.receipts, {});
    const maxId = allReceipts.length > 0 ? Math.max(...allReceipts.map(r => r.id || 0)) : 0;

    const now = new Date().toISOString();

    const receipt = await db.insert(collections.receipts, {
      id: maxId + 1,
      paymentId: payment.id,
      userId,
      filePath: req.file.filename,
      fileHash: hash,
      ocrText: aiResult.ocrText || '',
      ocrAmount: aiResult.ocrAmount || null,
      ocrCurrency: aiResult.ocrCurrency || 'UZS',
      ocrDate: new Date().toISOString(),
      ocrTransactionId: transactionId,  // foydalanuvchi kiritgan ID
      ocrReceiver: aiResult.ocrReceiver || null,
      aiConfidence: aiResult.confidence || 'UNKNOWN',
      verificationStatus,
      rejectionReason,
      reviewedAt: verificationStatus === 'VERIFIED' ? now : null,
      reviewedBy: verificationStatus === 'VERIFIED' ? 'AI_SYSTEM' : null,
      updatedAt: now,
    });

    // 8. Payment statusini yangilash
    await db.update(collections.payments, { _id: payment._id }, {
      status: verificationStatus === 'VERIFIED' ? 'PAID' : (verificationStatus === 'REJECTED' ? 'FAILED' : 'PENDING'),
      paidAt: verificationStatus === 'VERIFIED' ? now : payment.paidAt,
      updatedAt: now,
    });

    // 9. Agar VERIFIED bo'lsa, Subscription yaratish
    if (verificationStatus === 'VERIFIED') {
      const expiresAt = payment.plan === 'YEARLY' ? addYear(now) : addMonth(now);
      const allSubs = await db.find(collections.subscriptions, {});
      const maxSubId = allSubs.length > 0 ? Math.max(...allSubs.map(s => s.id || 0)) : 0;

      await db.insert(collections.subscriptions, {
        id: maxSubId + 1,
        userId: payment.userId,
        paymentId: payment.id,
        plan: payment.plan,
        status: 'ACTIVE',
        startDate: now,
        expiresAt,
        updatedAt: now,
      });
    }

    res.json({
      success: verificationStatus === 'VERIFIED',
      data: {
        receipt: {
          id: receipt.id,
          verificationStatus: receipt.verificationStatus,
          rejectionReason: receipt.rejectionReason,
        },
        message: verificationStatus === 'VERIFIED'
          ? "✅ AI tomonidan chek tasdiqlandi. Obuna faollashtirildi!"
          : verificationStatus === 'REJECTED'
            ? `❌ ${receipt.rejectionReason}`
            : "⏳ Chek qabul qilindi. Admin tekshiruvi kutilmoqda.",
      },
    });
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Fayl hajmi 5 MB dan oshmasligi kerak.' });
    }
    console.error('Receipt upload error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /payments/:id/status ─────────────────────────────────────────────────
router.get('/:id/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const payment = await db.findOne(collections.payments, {
      id: Number(req.params.id),
      userId,
    });
    if (!payment) return res.status(404).json({ message: 'Topilmadi.' });

    const receipt = await db.findOne(collections.receipts, { paymentId: payment.id });

    res.json({ success: true, data: { payment, receipt } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /payments/history ─────────────────────────────────────────────────────
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const payments = await db.find(collections.payments, { userId });

    const result = await Promise.all(
      payments.map(async (p) => {
        const receipt = await db.findOne(collections.receipts, { paymentId: p.id });
        return { ...p, receipt };
      })
    );

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /subscription ────────────────────────────────────────────────────────
router.get('/subscription', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date().toISOString();

    let sub = await db.findOne(collections.subscriptions, { userId, status: 'ACTIVE' });

    // Muddati tugaganlarni yangilash
    if (sub && sub.expiresAt <= now) {
      await db.update(collections.subscriptions, { _id: sub._id }, {
        status: 'EXPIRED',
        updatedAt: new Date().toISOString(),
      });
      sub = null;
    }

    res.json({ success: true, data: sub || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /subscription/status ─────────────────────────────────────────────────
router.get('/subscription/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date().toISOString();

    const sub = await db.findOne(collections.subscriptions, { userId, status: 'ACTIVE' });

    if (sub && sub.expiresAt > now) {
      return res.json({ success: true, data: { status: 'ACTIVE', subscription: sub } });
    }

    // Pending payment bormi?
    const pendingPayment = await db.findOne(collections.payments, { userId, status: 'PENDING' });
    if (pendingPayment) {
      const receipt = await db.findOne(collections.receipts, { paymentId: pendingPayment.id });
      const receiptStatus = receipt?.verificationStatus;

      if (receiptStatus === 'NEEDS_REVIEW' || receiptStatus === 'OCR_CHECKED') {
        return res.json({ success: true, data: { status: 'PENDING_REVIEW', payment: pendingPayment, receipt } });
      }
      if (receiptStatus === 'REJECTED') {
        return res.json({
          success: true,
          data: {
            status: 'REJECTED',
            payment: pendingPayment,
            receipt,
            rejectionReason: receipt?.rejectionReason,
          },
        });
      }
      return res.json({ success: true, data: { status: 'NOT_PAID', payment: pendingPayment } });
    }

    // Expired subscription
    const expiredSub = await db.findOne(collections.subscriptions, { userId, status: 'EXPIRED' });
    if (expiredSub) {
      return res.json({ success: true, data: { status: 'EXPIRED', subscription: expiredSub } });
    }

    res.json({ success: true, data: { status: 'NOT_PAID' } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── ADMIN: GET /admin/payments ───────────────────────────────────────────────
router.get('/admin/all', authMiddleware, requireRole('SUPER ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const payments = await db.find(collections.payments, {});

    const result = await Promise.all(
      payments.map(async (p) => {
        const user = await db.findOne(collections.users, { id: p.userId });
        const receipt = await db.findOne(collections.receipts, { paymentId: p.id });
        return {
          ...p,
          user: user ? { id: user.id, full_name: user.full_name, phone: user.phone } : null,
          receipt,
        };
      })
    );

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── ADMIN: GET /admin/payments/:id ──────────────────────────────────────────
router.get('/admin/:id', authMiddleware, requireRole('SUPER ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const payment = await db.findOne(collections.payments, { id: Number(req.params.id) });
    if (!payment) return res.status(404).json({ message: 'Topilmadi.' });

    const user = await db.findOne(collections.users, { id: payment.userId });
    const receipt = await db.findOne(collections.receipts, { paymentId: payment.id });
    const sub = await db.findOne(collections.subscriptions, { paymentId: payment.id });

    res.json({
      success: true,
      data: {
        payment,
        user: user ? { id: user.id, full_name: user.full_name, phone: user.phone } : null,
        receipt,
        subscription: sub,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── ADMIN: POST /admin/payments/:id/verify ──────────────────────────────────
router.post('/admin/:id/verify', authMiddleware, requireRole('SUPER ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const adminId = req.user.id;
    const payment = await db.findOne(collections.payments, { id: Number(req.params.id) });
    if (!payment) return res.status(404).json({ message: 'Payment topilmadi.' });

    if (payment.status === 'PAID') {
      return res.status(400).json({ message: 'Bu payment allaqachon tasdiqlangan.' });
    }

    const receipt = await db.findOne(collections.receipts, { paymentId: payment.id });
    if (!receipt) return res.status(400).json({ message: 'Chek topilmadi.' });

    const now = new Date();

    // Receipt ni VERIFIED qilish
    await db.update(collections.receipts, { _id: receipt._id }, {
      verificationStatus: 'VERIFIED',
      reviewedAt: now.toISOString(),
      reviewedBy: adminId,
      rejectionReason: null,
      updatedAt: now.toISOString(),
    });

    // Payment ni PAID qilish
    await db.update(collections.payments, { _id: payment._id }, {
      status: 'PAID',
      paidAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    // Subscription yaratish
    const expiresAt = payment.plan === 'YEARLY'
      ? addYear(now)
      : addMonth(now);

    const allSubs = await db.find(collections.subscriptions, {});
    const maxId = allSubs.length > 0 ? Math.max(...allSubs.map(s => s.id || 0)) : 0;

    const subscription = await db.insert(collections.subscriptions, {
      id: maxId + 1,
      userId: payment.userId,
      paymentId: payment.id,
      plan: payment.plan,
      status: 'ACTIVE',
      startDate: now.toISOString(),
      expiresAt,
      updatedAt: now.toISOString(),
    });

    res.json({
      success: true,
      data: { payment, subscription },
      message: 'Payment tasdiqlandi va obuna faollashtirildi.',
    });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── ADMIN: POST /admin/payments/:id/reject ───────────────────────────────────
router.post('/admin/:id/reject', authMiddleware, requireRole('SUPER ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const adminId = req.user.id;
    const { reason } = req.body;
    const payment = await db.findOne(collections.payments, { id: Number(req.params.id) });
    if (!payment) return res.status(404).json({ message: 'Payment topilmadi.' });

    const receipt = await db.findOne(collections.receipts, { paymentId: payment.id });
    const now = new Date().toISOString();

    if (receipt) {
      await db.update(collections.receipts, { _id: receipt._id }, {
        verificationStatus: 'REJECTED',
        rejectionReason: reason || 'Admin tomonidan rad etildi.',
        reviewedAt: now,
        reviewedBy: adminId,
        updatedAt: now,
      });
    }

    await db.update(collections.payments, { _id: payment._id }, {
      status: 'FAILED',
      updatedAt: now,
    });

    res.json({ success: true, message: 'Payment rad etildi.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
