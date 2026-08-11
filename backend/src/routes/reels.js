import { Router } from 'express';
import Datastore from '@seald-io/nedb';
import { authMiddleware } from '../middleware/auth.js';
import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const router = Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Reels DB ───────────────────────────────────────────
const reelsDB = new Datastore({ filename: join(__dirname, '../../data/reels.db'), autoload: true });
const reelLikesDB = new Datastore({ filename: join(__dirname, '../../data/reel_likes.db'), autoload: true });

// ─── Upload sozlash ─────────────────────────────────────
const uploadsDir = join(__dirname, '../../uploads/reels');
mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    cb(null, `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowed = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Faqat video fayllar qabul qilinadi (mp4, webm, mov, avi)'));
    }
  },
});

// ─── Helper: DB query promisify ──────────────────────────
const dbFind = (db, query, sort = {}) =>
  new Promise((resolve, reject) => {
    let cursor = db.find(query);
    if (Object.keys(sort).length) cursor = cursor.sort(sort);
    cursor.exec((err, docs) => (err ? reject(err) : resolve(docs)));
  });

const dbFindOne = (db, query) =>
  new Promise((resolve, reject) =>
    db.findOne(query, (err, doc) => (err ? reject(err) : resolve(doc)))
  );

const dbInsert = (db, doc) =>
  new Promise((resolve, reject) =>
    db.insert(doc, (err, newDoc) => (err ? reject(err) : resolve(newDoc)))
  );

const dbUpdate = (db, query, update, options = {}) =>
  new Promise((resolve, reject) =>
    db.update(query, update, options, (err, n) => (err ? reject(err) : resolve(n)))
  );

const dbRemove = (db, query, options = {}) =>
  new Promise((resolve, reject) =>
    db.remove(query, options, (err, n) => (err ? reject(err) : resolve(n)))
  );

// ═══════════════════════════════════════════════════════════
// GET /api/v1/reels
// Barcha reelslar (pagination bilan)
// ═══════════════════════════════════════════════════════════
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const userId = req.user.id;

    const allReels = await dbFind(reelsDB, {}, { created_at: -1 });
    const total = allReels.length;
    const paged = allReels.slice((page - 1) * limit, page * limit);

    // Har bir reel uchun like holatini tekshirish
    const reelsWithLikes = await Promise.all(
      paged.map(async (reel) => {
        const liked = await dbFindOne(reelLikesDB, { reel_id: reel._id, user_id: userId });
        return { ...reel, is_liked: !!liked };
      })
    );

    res.json({
      success: true,
      data: reelsWithLikes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
      },
    });
  } catch (err) {
    console.error('Reels olishda xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/v1/reels
// Yangi reel yuklash (video file + title)
// ═══════════════════════════════════════════════════════════
router.post('/', authMiddleware, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Video fayl majburiy' });
    }

    const { title = '', description = '' } = req.body;
    const user = req.user;

    // Yuklagan odamning to'liq ismini olish
    const uploaderName = user.full_name || user.name || user.phone || 'Foydalanuvchi';

    const newReel = {
      title: title.trim() || 'Video',
      description: description.trim(),
      video_filename: req.file.filename,
      video_url: `/uploads/reels/${req.file.filename}`,
      video_size: req.file.size,
      uploader_id: user.id,
      uploader_name: uploaderName,
      uploader_role: user.role,
      likes: 0,
      views: 0,
      created_at: Date.now(),
    };

    const saved = await dbInsert(reelsDB, newReel);

    res.status(201).json({
      success: true,
      message: 'Reel muvaffaqiyatli yuklandi!',
      data: { ...saved, is_liked: false },
    });
  } catch (err) {
    console.error('Reel yuklashda xato:', err);
    res.status(500).json({ success: false, message: err.message || 'Server xatosi' });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/v1/reels/:id/like
// Like / Unlike toggle
// ═══════════════════════════════════════════════════════════
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const reelId = req.params.id;
    const userId = req.user.id;

    const reel = await dbFindOne(reelsDB, { _id: reelId });
    if (!reel) return res.status(404).json({ success: false, message: 'Reel topilmadi' });

    const existing = await dbFindOne(reelLikesDB, { reel_id: reelId, user_id: userId });

    if (existing) {
      // Unlike
      await dbRemove(reelLikesDB, { reel_id: reelId, user_id: userId });
      await dbUpdate(reelsDB, { _id: reelId }, { $inc: { likes: -1 } });
      const updated = await dbFindOne(reelsDB, { _id: reelId });
      res.json({ success: true, liked: false, likes: Math.max(0, updated.likes) });
    } else {
      // Like
      await dbInsert(reelLikesDB, { reel_id: reelId, user_id: userId, created_at: Date.now() });
      await dbUpdate(reelsDB, { _id: reelId }, { $inc: { likes: 1 } });
      const updated = await dbFindOne(reelsDB, { _id: reelId });
      res.json({ success: true, liked: true, likes: updated.likes });
    }
  } catch (err) {
    console.error('Like xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/v1/reels/:id/view
// Ko'rishlar sonini oshirish
// ═══════════════════════════════════════════════════════════
router.post('/:id/view', authMiddleware, async (req, res) => {
  try {
    await dbUpdate(reelsDB, { _id: req.params.id }, { $inc: { views: 1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ═══════════════════════════════════════════════════════════
// DELETE /api/v1/reels/:id
// O'z reelini o'chirish
// ═══════════════════════════════════════════════════════════
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const reel = await dbFindOne(reelsDB, { _id: req.params.id });
    if (!reel) return res.status(404).json({ success: false, message: 'Topilmadi' });

    // Faqat o'zi yoki admin o'chira oladi
    if (reel.uploader_id !== req.user.id && !['SUPER ADMIN', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Ruxsat yo\'q' });
    }

    await dbRemove(reelsDB, { _id: req.params.id });
    await dbRemove(reelLikesDB, { reel_id: req.params.id }, { multi: true });

    res.json({ success: true, message: 'Reel o\'chirildi' });
  } catch (err) {
    console.error('Reel o\'chirishda xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

export default router;
