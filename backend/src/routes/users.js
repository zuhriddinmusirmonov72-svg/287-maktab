import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, collections, nextId } from '../database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/admin/all', requireRole('superadmin', 'admin'), async (req, res) => {
  const admins = await db.find(collections.users, { role: { $in: ['admin', 'superadmin'] } });
  res.json({ success: true, data: admins.map(u => ({ id: u.id, phone: u.phone, role: u.role, createdAt: u.createdAt })) });
});

router.post('/admin', requireRole('superadmin', 'admin'), async (req, res) => {
  const { phone, password, role = 'admin' } = req.body;
  if (!phone || !password) return res.status(400).json({ message: 'Telefon va parol kiritilishi shart' });
  const existing = await db.findOne(collections.users, { phone });
  if (existing) return res.status(400).json({ message: 'Bu telefon raqam allaqachon mavjud' });
  const id = await nextId(collections.users);
  const user = await db.insert(collections.users, { id, phone, password: bcrypt.hashSync(password, 10), role });
  res.status(201).json({ success: true, data: { id: user.id, phone, role } });
});

export default router;
