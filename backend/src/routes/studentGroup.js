import { Router } from 'express';
import { db, collections, nextId } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/all', async (req, res) => {
  const rows = await db.find(collections.studentGroup, {});
  res.json({ success: true, data: rows });
});

router.post('/', async (req, res) => {
  try {
    const { student_id, group_id } = req.body;
    if (!student_id || !group_id) return res.status(400).json({ message: 'student_id va group_id kiritilishi shart' });
    const existing = await db.findOne(collections.studentGroup, { student_id: +student_id, group_id: +group_id });
    if (existing) return res.status(400).json({ message: 'Talaba bu guruhda allaqachon mavjud' });
    const id = await nextId(collections.studentGroup);
    const row = await db.insert(collections.studentGroup, { id, student_id: +student_id, group_id: +group_id });
    res.status(201).json({ success: true, data: row });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  await db.remove(collections.studentGroup, { id: +req.params.id });
  res.json({ success: true, message: 'O\'quvchi guruhdan chiqarildi' });
});

export default router;
