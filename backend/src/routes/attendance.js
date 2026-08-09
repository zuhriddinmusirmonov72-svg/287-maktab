import { Router } from 'express';
import { db, collections, nextId } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/all', async (req, res) => {
  const rows = await db.find(collections.attendance, {});
  res.json({ success: true, data: rows });
});

router.get('/lesson/:lessonId', async (req, res) => {
  const rows = await db.find(collections.attendance, { lesson_id: +req.params.lessonId });
  const students = await db.find(collections.students, {});
  const result = rows.map(r => ({ ...r, student_name: students.find(s => s.id === r.student_id)?.full_name }));
  res.json({ success: true, data: result });
});

router.get('/:groupId', async (req, res) => {
  const rows = await db.find(collections.attendance, { group_id: +req.params.groupId });
  res.json({ success: true, data: rows });
});

router.post('/', async (req, res) => {
  try {
    const { group_id, student_id, isPresent, lesson_id } = req.body;
    if (!group_id || !student_id) return res.status(400).json({ message: 'group_id va student_id kiritilishi shart' });

    const existing = await db.findOne(collections.attendance, { lesson_id: +lesson_id, student_id: +student_id });
    if (existing) {
      await db.update(collections.attendance, { _id: existing._id }, { is_present: !!isPresent });
      return res.json({ success: true, data: { id: existing.id } });
    }

    const id = await nextId(collections.attendance);
    const row = await db.insert(collections.attendance, { id, lesson_id: +lesson_id, group_id: +group_id, student_id: +student_id, is_present: !!isPresent });
    res.status(201).json({ success: true, data: row });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/:id', async (req, res) => {
  await db.update(collections.attendance, { id: +req.params.id }, { is_present: !!req.body.isPresent });
  res.json({ success: true });
});

router.delete('/:id', async (req, res) => {
  await db.remove(collections.attendance, { id: +req.params.id });
  res.json({ success: true });
});

export default router;
