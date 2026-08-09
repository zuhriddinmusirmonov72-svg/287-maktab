import express from 'express';
import { db, collections } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// GET /api/v1/coins/my - O'quvchining kumush tangalari
router.get('/my', async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await db.findOne(collections.students, { user_id: userId });
    
    if (!student) {
      return res.status(404).json({ message: 'O\'quvchi topilmadi' });
    }

    // Kumush va XP ma'lumotlarini qaytarish
    const coins = student.coins || 0;
    const xp = student.xp || 0;
    const level = Math.floor(xp / 750) + 1; // Har 750 XP = 1 level
    const levelProgress = xp % 750; // Joriy leveldagi progress

    res.json({
      success: true,
      data: {
        coins,
        xp,
        level,
        levelProgress,
        maxLevelProgress: 750
      }
    });
  } catch (err) {
    console.error('Kumush olishda xato:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

export default router;
