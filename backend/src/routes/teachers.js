import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { db, collections, nextId } from '../database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const upload = multer({ dest: join(__dirname, '../../uploads/photos/') });
const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const teachers = await db.find(collections.teachers, { is_archived: false });
  const users = await db.find(collections.users, {});
  const result = teachers.map(t => ({ ...t, phone: t.phone || users.find(u => u.id === t.user_id)?.phone }));
  res.json({ success: true, data: result });
});

router.get('/archive', async (req, res) => {
  const teachers = await db.find(collections.teachers, { is_archived: true });
  res.json({ success: true, data: teachers });
});

router.get('/my/profile', requireRole('teacher'), async (req, res) => {
  const teacher = await db.findOne(collections.teachers, { user_id: req.user.id });
  if (!teacher) return res.status(404).json({ message: 'O\'qituvchi topilmadi' });
  res.json({ success: true, data: teacher });
});

router.get('/my/groups', async (req, res) => {
  try {
    let teacherId;
    if (req.user.role === 'teacher') {
      const t = await db.findOne(collections.teachers, { user_id: req.user.id });
      if (!t) return res.status(404).json({ message: 'O\'qituvchi topilmadi' });
      teacherId = t.id;
    } else {
      teacherId = +req.query.teacher_id;
    }

    const groups = await db.find(collections.groups, { teacher_id: teacherId, is_archived: false });
    const courses = await db.find(collections.courses, {});
    const rooms = await db.find(collections.rooms, {});
    const allSgs = await db.find(collections.studentGroup, {});
    const allStudents = await db.find(collections.students, { is_archived: false });

    const result = groups.map(g => {
      const students = allStudents.filter(s => allSgs.some(sg => sg.group_id === g.id && sg.student_id === s.id));
      return {
        ...g,
        course_name: courses.find(c => c.id === g.course_id)?.name,
        room_name: rooms.find(r => r.id === g.room_id)?.name,
        student_count: students.length,
        students,
      };
    });
    res.json({ success: true, data: result });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/one/:id', async (req, res) => {
  const teacher = await db.findOne(collections.teachers, { id: +req.params.id });
  if (!teacher) return res.status(404).json({ message: 'O\'qituvchi topilmadi' });
  res.json({ success: true, data: teacher });
});

router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const { full_name, phone, subject, password = 'teacher123' } = req.body;
    if (!full_name || !phone) return res.status(400).json({ message: 'Ism va telefon kiritilishi shart' });
    const existing = await db.findOne(collections.users, { phone });
    if (existing) return res.status(400).json({ message: 'Bu telefon raqam allaqachon mavjud' });

    const userId = await nextId(collections.users);
    await db.insert(collections.users, { id: userId, phone, password: bcrypt.hashSync(password, 10), role: 'teacher' });

    const photo = req.file ? `/uploads/photos/${req.file.filename}` : null;
    const id = await nextId(collections.teachers);
    const teacher = await db.insert(collections.teachers, { id, user_id: userId, full_name, phone, subject, photo, is_archived: false });
    res.status(201).json({ success: true, data: teacher });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/:id', upload.single('photo'), async (req, res) => {
  try {
    const teacher = await db.findOne(collections.teachers, { id: +req.params.id });
    if (!teacher) return res.status(404).json({ message: 'O\'qituvchi topilmadi' });
    const { full_name, phone, subject } = req.body;
    const photo = req.file ? `/uploads/photos/${req.file.filename}` : teacher.photo;
    const upd = { photo };
    if (full_name) upd.full_name = full_name;
    if (phone) upd.phone = phone;
    if (subject) upd.subject = subject;
    const updated = await db.update(collections.teachers, { id: +req.params.id }, upd);
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  await db.update(collections.teachers, { id: +req.params.id }, { is_archived: true });
  res.json({ success: true, message: 'O\'qituvchi arxivlandi' });
});

export default router;
