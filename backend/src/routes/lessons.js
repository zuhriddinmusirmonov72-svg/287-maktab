import { Router } from 'express';
import { db, collections, nextId } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const lessons = await db.find(collections.lessons, {});
  res.json({ success: true, data: lessons });
});

router.get('/my/group/:groupId', async (req, res) => {
  const lessons = await db.find(collections.lessons, { group_id: +req.params.groupId });
  const sorted = lessons.sort((a, b) => (a.lesson_date || '').localeCompare(b.lesson_date || ''));
  res.json({ success: true, data: sorted });
});

router.get('/:id', async (req, res) => {
  const lesson = await db.findOne(collections.lessons, { id: +req.params.id });
  if (!lesson) return res.status(404).json({ message: 'Dars topilmadi' });
  res.json({ success: true, data: lesson });
});

router.post('/', async (req, res) => {
  try {
    const { group_id, topic, description, lesson_date } = req.body;
    if (!group_id || !topic) return res.status(400).json({ message: 'group_id va mavzu kiritilishi shart' });
    const id = await nextId(collections.lessons);
    const lesson = await db.insert(collections.lessons, { id, group_id: +group_id, topic, description, lesson_date });
    res.status(201).json({ success: true, data: lesson });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/:id', async (req, res) => {
  const lesson = await db.findOne(collections.lessons, { id: +req.params.id });
  if (!lesson) return res.status(404).json({ message: 'Dars topilmadi' });
  const upd = {};
  ['topic','description','lesson_date'].forEach(k => { if (req.body[k] !== undefined) upd[k] = req.body[k]; });
  const updated = await db.update(collections.lessons, { id: +req.params.id }, upd);
  res.json({ success: true, data: updated });
});

router.delete('/:id', async (req, res) => {
  await db.remove(collections.lessons, { id: +req.params.id });
  res.json({ success: true, message: 'Dars o\'chirildi' });
});

export default router;
