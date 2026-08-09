import { Router } from 'express';
import { db, collections, nextId } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const courses = await db.find(collections.courses, { is_archived: false });
  res.json({ success: true, data: courses });
});

router.get('/archive', async (req, res) => {
  const courses = await db.find(collections.courses, { is_archived: true });
  res.json({ success: true, data: courses });
});

router.get('/one/:id', async (req, res) => {
  const course = await db.findOne(collections.courses, { id: +req.params.id });
  if (!course) return res.status(404).json({ message: 'Kurs topilmadi' });
  res.json({ success: true, data: course });
});

router.post('/', async (req, res) => {
  const { name, description, duration = 3, price = 0 } = req.body;
  if (!name) return res.status(400).json({ message: 'Kurs nomi kiritilishi shart' });
  const id = await nextId(collections.courses);
  const course = await db.insert(collections.courses, { id, name, description, duration, price, is_archived: false });
  res.status(201).json({ success: true, data: course });
});

router.patch('/:id', async (req, res) => {
  const course = await db.findOne(collections.courses, { id: +req.params.id });
  if (!course) return res.status(404).json({ message: 'Kurs topilmadi' });
  const upd = {};
  ['name','description','duration','price'].forEach(k => { if (req.body[k] !== undefined) upd[k] = req.body[k]; });
  const updated = await db.update(collections.courses, { id: +req.params.id }, upd);
  res.json({ success: true, data: updated });
});

router.delete('/:id', async (req, res) => {
  await db.update(collections.courses, { id: +req.params.id }, { is_archived: true });
  res.json({ success: true, message: 'Kurs o\'chirildi' });
});

export default router;
