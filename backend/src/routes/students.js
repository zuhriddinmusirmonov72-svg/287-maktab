import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { db, collections, nextId } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const upload = multer({ dest: join(__dirname, '../../uploads/photos/') });
const router = Router();
router.use(authMiddleware);

// GET /students
router.get('/', async (req, res) => {
  const students = await db.find(collections.students, { is_archived: false });
  const users = await db.find(collections.users, {});
  const result = students.map(s => ({ ...s, phone: s.phone || users.find(u => u.id === s.user_id)?.phone }));
  res.json({ success: true, data: result });
});

// GET /students/archive
router.get('/archive', async (req, res) => {
  const students = await db.find(collections.students, { is_archived: true });
  res.json({ success: true, data: students });
});

// GET /students/my/groups
router.get('/my/groups', async (req, res) => {
  try {
    const student = await db.findOne(collections.students, { user_id: req.user.id });
    if (!student) return res.status(404).json({ message: 'Talaba topilmadi' });

    const sgs = await db.find(collections.studentGroup, { student_id: student.id });
    const groupIds = sgs.map(sg => sg.group_id);
    if (groupIds.length === 0) return res.json({ success: true, data: [] });

    const groups = await db.find(collections.groups, { id: { $in: groupIds }, is_archived: false });
    const courses = await db.find(collections.courses, {});
    const teachers = await db.find(collections.teachers, {});
    const rooms = await db.find(collections.rooms, {});
    const allSgs = await db.find(collections.studentGroup, {});

    const result = groups.map(g => ({
      ...g,
      course_name: courses.find(c => c.id === g.course_id)?.name,
      teacher_name: teachers.find(t => t.id === g.teacher_id)?.full_name,
      teacher_photo: teachers.find(t => t.id === g.teacher_id)?.photo,
      room_name: rooms.find(r => r.id === g.room_id)?.name,
      student_count: allSgs.filter(sg => sg.group_id === g.id).length,
    }));

    res.json({ success: true, data: result });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /students/one/:id
router.get('/one/:id', async (req, res) => {
  const student = await db.findOne(collections.students, { id: +req.params.id });
  if (!student) return res.status(404).json({ message: 'Talaba topilmadi' });
  res.json({ success: true, data: student });
});

// POST /students (multipart)
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const { full_name, phone, password = 'student123' } = req.body;
    if (!full_name || !phone) return res.status(400).json({ message: 'Ism va telefon kiritilishi shart' });
    const existing = await db.findOne(collections.users, { phone });
    if (existing) return res.status(400).json({ message: 'Bu telefon raqam allaqachon mavjud' });

    const userId = await nextId(collections.users);
    await db.insert(collections.users, { id: userId, phone, password: bcrypt.hashSync(password, 10), role: 'student' });

    const photo = req.file ? `/uploads/photos/${req.file.filename}` : null;
    const id = await nextId(collections.students);
    const student = await db.insert(collections.students, { id, user_id: userId, full_name, phone, photo, is_archived: false });
    res.status(201).json({ success: true, data: student });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /students/:id (multipart)
router.patch('/:id', upload.single('photo'), async (req, res) => {
  try {
    const student = await db.findOne(collections.students, { id: +req.params.id });
    if (!student) return res.status(404).json({ message: 'Talaba topilmadi' });
    const { full_name, phone } = req.body;
    const photo = req.file ? `/uploads/photos/${req.file.filename}` : student.photo;
    const upd = {};
    if (full_name) upd.full_name = full_name;
    if (phone) upd.phone = phone;
    upd.photo = photo;
    const updated = await db.update(collections.students, { id: +req.params.id }, upd);
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /students/:id
router.delete('/:id', async (req, res) => {
  await db.update(collections.students, { id: +req.params.id }, { is_archived: true });
  res.json({ success: true, message: 'Talaba arxivlandi' });
});

// POST /students/homeworkAnswer/:homeworkId
router.post('/homeworkAnswer/:homeworkId', upload.single('file'), async (req, res) => {
  try {
    const student = await db.findOne(collections.students, { user_id: req.user.id });
    if (!student) return res.status(404).json({ message: 'Talaba topilmadi' });

    const homeworkId = +req.params.homeworkId;
    const homework = await db.findOne(collections.homeworks, { id: homeworkId });
    if (!homework) return res.status(404).json({ message: 'Uyga vazifa topilmadi' });

    const { title, comment } = req.body;
    if (!title) return res.status(400).json({ message: ['title must be a string'] });

    const file = req.file ? `/uploads/homeworks/${req.file.filename}` : null;
    const existing = await db.findOne(collections.homeworkAnswers, { homework_id: homeworkId, student_id: student.id });

    if (existing) {
      await db.update(collections.homeworkAnswers, { _id: existing._id }, { title, comment, file: file || existing.file, status: 'PENDING' });
      return res.json({ success: true, message: 'Homework answer updated', data: { id: existing.id } });
    }

    const id = await nextId(collections.homeworkAnswers);
    const answer = await db.insert(collections.homeworkAnswers, {
      id, homework_id: homeworkId, student_id: student.id, group_id: homework.group_id,
      title, comment, file, status: 'PENDING', grade: null, teacher_comment: null
    });

    // 💎 KUMUSH TANGA TIZIMI
    let coinsEarned = 60; // Default: 24 soat ichida
    let reason = 'Uyga vazifa yuklandi';
    
    if (homework.deadline) {
      const deadlineDate = new Date(homework.deadline);
      const now = new Date();
      const hoursDiff = (deadlineDate - now) / (1000 * 60 * 60);
      
      // 1 soat ichida yuklagan bo'lsa - 200 kumush
      if (hoursDiff >= 23) {
        coinsEarned = 200;
        reason = 'Uyga vazifa 1 soat ichida yuklandi! 🎉';
      }
    }
    
    // Kumush va XP qo'shish
    const currentCoins = student.coins || 0;
    const currentXP = student.xp || 0;
    
    await db.update(collections.students, { _id: student._id }, {
      coins: currentCoins + coinsEarned,
      xp: currentXP + coinsEarned
    });
    
    // Bildirishnoma yaratish
    const notifId = await nextId(collections.notifications);
    await db.insert(collections.notifications, {
      id: notifId,
      student_id: student.id,
      title: `+${coinsEarned} 💎 Kumush tanga`,
      message: reason,
      type: 'COINS',
      is_read: false,
      created_at: new Date().toISOString()
    });

    res.status(201).json({ 
      success: true, 
      message: 'Homework answer created', 
      data: { 
        id: answer.id,
        coinsEarned,
        totalCoins: currentCoins + coinsEarned
      } 
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
