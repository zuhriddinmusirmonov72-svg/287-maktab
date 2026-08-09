import express from 'express';
import { db, collections } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// GET /api/v1/notifications/my - O'quvchining barcha bildirish nomalari
router.get('/my', async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await db.findOne(collections.students, { user_id: userId });
    
    if (!student) {
      return res.status(404).json({ message: 'O\'quvchi topilmadi' });
    }

    const allNotifications = await db.find(collections.notifications, { student_id: student.id });
    
    // Yangilarini birinchi qilish
    const myNotifications = allNotifications.sort((a, b) => 
      new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt)
    );

    // O'qilmagan bildirishnomalar soni
    const unreadCount = myNotifications.filter(n => !n.is_read).length;

    res.json({
      success: true,
      data: {
        notifications: myNotifications,
        unreadCount
      }
    });
  } catch (err) {
    console.error('Bildirishnomalarni olishda xato:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// PATCH /api/v1/notifications/:id/read - Bildirishnomani o'qilgan deb belgilash
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const student = await db.findOne(collections.students, { user_id: userId });
    
    if (!student) {
      return res.status(404).json({ message: 'O\'quvchi topilmadi' });
    }

    const notification = await db.findOne(collections.notifications, { 
      id: Number(id), 
      student_id: student.id 
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Bildirishnoma topilmadi' });
    }

    await db.update(collections.notifications, { _id: notification._id }, { is_read: true });

    res.json({
      success: true,
      data: { ...notification, is_read: true }
    });
  } catch (err) {
    console.error('Bildirishnomani o\'qish belgilashda xato:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// PATCH /api/v1/notifications/read-all - Barcha bildirishnomalarni o'qilgan deb belgilash
router.patch('/read-all', async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await db.findOne(collections.students, { user_id: userId });
    
    if (!student) {
      return res.status(404).json({ message: 'O\'quvchi topilmadi' });
    }

    const allNotifications = await db.find(collections.notifications, { student_id: student.id });
    
    // Har birini o'qilgan qilish
    for (const notif of allNotifications) {
      if (!notif.is_read) {
        await db.update(collections.notifications, { _id: notif._id }, { is_read: true });
      }
    }

    res.json({
      success: true,
      message: 'Barcha bildirishnomalar o\'qilgan deb belgilandi'
    });
  } catch (err) {
    console.error('Barcha bildirishnomalarni o\'qish belgilashda xato:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// DELETE /api/v1/notifications/:id - Bildirishnomani o'chirish
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const student = await db.findOne(collections.students, { user_id: userId });
    
    if (!student) {
      return res.status(404).json({ message: 'O\'quvchi topilmadi' });
    }

    const notification = await db.findOne(collections.notifications, { 
      id: Number(id), 
      student_id: student.id 
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Bildirishnoma topilmadi' });
    }

    await db.remove(collections.notifications, { _id: notification._id });

    res.json({
      success: true,
      message: 'Bildirishnoma o\'chirildi'
    });
  } catch (err) {
    console.error('Bildirishnomani o\'chirishda xato:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

export default router;
