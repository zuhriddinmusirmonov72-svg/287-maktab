import { Router } from 'express';
import { db, collections, nextId } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const rooms = await db.find(collections.rooms, { is_archived: false });
  res.json({ success: true, data: rooms });
});

router.get('/arxive', async (req, res) => {
  const rooms = await db.find(collections.rooms, { is_archived: true });
  res.json({ success: true, data: rooms });
});

router.get('/one/:id', async (req, res) => {
  const room = await db.findOne(collections.rooms, { id: +req.params.id });
  if (!room) return res.status(404).json({ message: 'Xona topilmadi' });
  res.json({ success: true, data: room });
});

router.post('/', async (req, res) => {
  const { name, capacity = 30 } = req.body;
  if (!name) return res.status(400).json({ message: 'Xona nomi kiritilishi shart' });
  const id = await nextId(collections.rooms);
  const room = await db.insert(collections.rooms, { id, name, capacity, is_archived: false });
  res.status(201).json({ success: true, data: room });
});

router.patch('/:id', async (req, res) => {
  const room = await db.findOne(collections.rooms, { id: +req.params.id });
  if (!room) return res.status(404).json({ message: 'Xona topilmadi' });
  const { name, capacity } = req.body;
  const upd = {};
  if (name !== undefined) upd.name = name;
  if (capacity !== undefined) upd.capacity = capacity;
  const updated = await db.update(collections.rooms, { id: +req.params.id }, upd);
  res.json({ success: true, data: updated });
});

router.delete('/:id', async (req, res) => {
  await db.update(collections.rooms, { id: +req.params.id }, { is_archived: true });
  res.json({ success: true, message: 'Xona o\'chirildi' });
});

export default router;
