import { Router } from 'express';
import Datastore from '@seald-io/nedb';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const reelsDB = new Datastore({ filename: './data/reels.db', autoload: true });

// ═══════════════════════════════════════════════════════
// 🎬 REELS API - Instagram videolari
// ═══════════════════════════════════════════════════════

/**
 * GET /api/v1/reels
 * Barcha reelslarni olish (Student va Teacher ko'radi)
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    reelsDB.find({})
      .sort({ created_at: -1 })
      .exec((err, reels) => {
        if (err) {
          console.error('Reels yuklashda xato:', err);
          return res.status(500).json({ message: 'Reels yuklashda xato' });
        }
        res.json({ data: reels });
      });
  } catch (error) {
    console.error('Reels API xato:', error);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

/**
 * POST /api/v1/reels
 * Yangi reel qo'shish (Faqat Admin va Teacher)
 * Body: { instagram_url, title, description }
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { role } = req.user;
    
    // Faqat SUPER ADMIN va TEACHER ruxsat
    if (!['SUPER ADMIN', 'TEACHER', 'ADMIN'].includes(role)) {
      return res.status(403).json({ message: 'Ruxsat yo\'q' });
    }

    const { instagram_url, title, description } = req.body;

    if (!instagram_url) {
      return res.status(400).json({ message: 'Instagram URL majburiy' });
    }

    // Instagram URL validatsiya
    const instagramPattern = /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(p|reel|reels|tv)\/[a-zA-Z0-9_-]+/;
    if (!instagramPattern.test(instagram_url)) {
      return res.status(400).json({ 
        message: 'Noto\'g\'ri Instagram URL. Masalan: https://www.instagram.com/reel/ABC123/' 
      });
    }

    const newReel = {
      instagram_url,
      title: title || 'Video',
      description: description || '',
      created_by: req.user.id,
      created_at: new Date().toISOString(),
      views: 0,
      likes: 0,
    };

    reelsDB.insert(newReel, (err, doc) => {
      if (err) {
        console.error('Reel qo\'shishda xato:', err);
        return res.status(500).json({ message: 'Reel qo\'shishda xato' });
      }
      res.status(201).json({ 
        message: 'Reel muvaffaqiyatli qo\'shildi', 
        data: doc 
      });
    });
  } catch (error) {
    console.error('Reel qo\'shish xato:', error);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

/**
 * DELETE /api/v1/reels/:id
 * Reelni o'chirish (Faqat Admin va Teacher)
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { role } = req.user;
    
    if (!['SUPER ADMIN', 'TEACHER', 'ADMIN'].includes(role)) {
      return res.status(403).json({ message: 'Ruxsat yo\'q' });
    }

    const { id } = req.params;

    reelsDB.remove({ _id: id }, {}, (err, numRemoved) => {
      if (err) {
        console.error('Reel o\'chirishda xato:', err);
        return res.status(500).json({ message: 'Reel o\'chirishda xato' });
      }
      
      if (numRemoved === 0) {
        return res.status(404).json({ message: 'Reel topilmadi' });
      }

      res.json({ message: 'Reel o\'chirildi' });
    });
  } catch (error) {
    console.error('Reel o\'chirish xato:', error);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

/**
 * POST /api/v1/reels/:id/view
 * Reel ko'rilganini belgilash
 */
router.post('/:id/view', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    reelsDB.update(
      { _id: id },
      { $inc: { views: 1 } },
      {},
      (err) => {
        if (err) {
          console.error('View count yangilashda xato:', err);
          return res.status(500).json({ message: 'Xato' });
        }
        res.json({ message: 'View counted' });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi' });
  }
});

export default router;
