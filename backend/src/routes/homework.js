import { Router } from 'express';
import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { db, collections, nextId } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const upload = multer({ dest: join(__dirname, '../../uploads/homeworks/') });
const router = Router();
router.use(authMiddleware);

// GET /homework/all
router.get('/all', async (req, res) => {
  try {
    const homeworks = await db.find(collections.homeworks, {});
    const groups = await db.find(collections.groups, {});
    const lessons = await db.find(collections.lessons, {});
    const answers = await db.find(collections.homeworkAnswers, {});
    const sgs = await db.find(collections.studentGroup, {});

    const result = homeworks.map(hw => {
      const hwAnswers = answers.filter(a => a.homework_id === hw.id);
      const studentsCount = sgs.filter(sg => sg.group_id === hw.group_id).length;
      return {
        ...hw,
        lesson_topic: lessons.find(l => l.id === hw.lesson_id)?.topic,
        group_name: groups.find(g => g.id === hw.group_id)?.name,
        pending_count: hwAnswers.filter(a => a.status === 'PENDING').length,
        accepted_count: hwAnswers.filter(a => a.status === 'ACCEPTED').length,
        rejected_count: hwAnswers.filter(a => a.status === 'REJECTED').length,
        submitted_count: hwAnswers.length,
        not_sent_count: studentsCount - hwAnswers.length,
        students_count: studentsCount,
      };
    });
    res.json({ success: true, data: result });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /homework/own/:lessonId  (STUDENT)
router.get('/own/:lessonId', async (req, res) => {
  try {
    const hw = await db.findOne(collections.homeworks, { lesson_id: +req.params.lessonId });
    if (!hw) return res.json({ success: true, data: null });
    const student = await db.findOne(collections.students, { user_id: req.user.id });
    const answer = student ? await db.findOne(collections.homeworkAnswers, { homework_id: hw.id, student_id: student.id }) : null;
    res.json({ success: true, data: { ...hw, answer } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /homework/:groupId
router.get('/:groupId', async (req, res) => {
  try {
    const homeworks = await db.find(collections.homeworks, { group_id: +req.params.groupId });
    const lessons = await db.find(collections.lessons, {});
    const answers = await db.find(collections.homeworkAnswers, {});
    const sgs = await db.find(collections.studentGroup, {});

    const result = homeworks.map(hw => {
      const hwAnswers = answers.filter(a => a.homework_id === hw.id);
      const studentsCount = sgs.filter(sg => sg.group_id === hw.group_id).length;
      return {
        ...hw,
        lesson_topic: lessons.find(l => l.id === hw.lesson_id)?.topic,
        pending_count: hwAnswers.filter(a => a.status === 'PENDING').length,
        accepted_count: hwAnswers.filter(a => a.status === 'ACCEPTED').length,
        rejected_count: hwAnswers.filter(a => a.status === 'REJECTED').length,
        submitted_count: hwAnswers.length,
        not_sent_count: studentsCount - hwAnswers.length,
        students_count: studentsCount,
      };
    });
    res.json({ success: true, data: result });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /group/:groupId/homework/:homeworkId/results?status=
router.get('/group/:groupId/homework/:homeworkId/results', async (req, res) => {
  try {
    const { groupId, homeworkId } = req.params;
    const { status } = req.query;

    const sgs = await db.find(collections.studentGroup, { group_id: +groupId });
    const studentIds = sgs.map(sg => sg.student_id);
    const allStudents = await db.find(collections.students, { id: { $in: studentIds }, is_archived: false });
    const answers = await db.find(collections.homeworkAnswers, { homework_id: +homeworkId });

    const result = allStudents.map(student => {
      const answer = answers.find(a => a.student_id === student.id);
      return {
        id: student.id,
        student_id: student.id,
        homework_answer_id: answer?.id || null,   // ✅ to'g'ri qaytaradi
        full_name: student.full_name,
        name: student.full_name,
        photo: student.photo,
        status: answer ? answer.status : 'NOT_SENT',
        submitted_at: answer?.createdAt || null,
        grade: answer?.grade || null,
        teacher_comment: answer?.teacher_comment || null,
        file: answer?.file || null,
        comment: answer?.comment || null,
        student: student,
      };
    });

    const filtered = status
      ? result.filter(r => {
          if (status === 'PENDING')   return r.status === 'PENDING';
          if (status === 'ACCEPTED')  return r.status === 'ACCEPTED';
          if (status === 'REJECTED')  return r.status === 'REJECTED';
          if (status === 'NOT_SENT')  return r.status === 'NOT_SENT';
          return true;
        })
      : result;

    res.json({
      success: true,
      data: filtered,
      summary: {
        total:     allStudents.length,
        pending:   result.filter(r => r.status === 'PENDING').length,
        accepted:  result.filter(r => r.status === 'ACCEPTED').length,
        rejected:  result.filter(r => r.status === 'REJECTED').length,
        not_sent:  result.filter(r => r.status === 'NOT_SENT').length,
      }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /group/:groupId/homework/:homeworkId/result/:studentId
router.get('/group/:groupId/homework/:homeworkId/result/:studentId', async (req, res) => {
  try {
    const { homeworkId, studentId } = req.params;
    const answer = await db.findOne(collections.homeworkAnswers, { homework_id: +homeworkId, student_id: +studentId });
    if (!answer) return res.status(404).json({ message: 'Talaba uyga vazifani topshirmagan' });
    const student = await db.findOne(collections.students, { id: +studentId });
    res.json({ success: true, data: { ...answer, full_name: student?.full_name, photo: student?.photo } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /homework  (multipart)
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { lesson_id, group_id, title, description, deadline } = req.body;
    if (!lesson_id || !group_id || !title) return res.status(400).json({ message: 'lesson_id, group_id va title kiritilishi shart' });
    const file = req.file ? `/uploads/homeworks/${req.file.filename}` : null;
    const id = await nextId(collections.homeworks);
    const hw = await db.insert(collections.homeworks, { id, lesson_id: +lesson_id, group_id: +group_id, title, description, file, deadline });
    res.status(201).json({ success: true, data: hw });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /homework/:id
router.patch('/:id', upload.single('file'), async (req, res) => {
  try {
    const hw = await db.findOne(collections.homeworks, { id: +req.params.id });
    if (!hw) return res.status(404).json({ message: 'Uyga vazifa topilmadi' });
    const file = req.file ? `/uploads/homeworks/${req.file.filename}` : hw.file;
    const upd = { file };
    ['title','description','deadline'].forEach(k => { if (req.body[k] !== undefined) upd[k] = req.body[k]; });
    const updated = await db.update(collections.homeworks, { id: +req.params.id }, upd);
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /homework/:id
router.delete('/:id', async (req, res) => {
  await db.remove(collections.homeworks, { id: +req.params.id });
  res.json({ success: true, message: 'Uyga vazifa o\'chirildi' });
});

// POST /group/:groupId/homework/:homeworkId/check  ← BAHOLASH
router.post('/group/:groupId/homework/:homeworkId/check', async (req, res) => {
  try {
    const { homeworkId } = req.params;
    const { grade, title, student_id, homework_answer_id } = req.body;

    if (grade === undefined || grade === null)
      return res.status(400).json({ message: ['grade is required'] });
    if (!student_id)
      return res.status(400).json({ message: ['student_id is required'] });

    const gradeNum = Number(grade);
    if (gradeNum < 0 || gradeNum > 100)
      return res.status(400).json({ message: ['grade 0 dan 100 gacha bo\'lishi kerak'] });

    // homework_answer_id yoki student_id orqali topish
    let answer = null;
    if (homework_answer_id) {
      answer = await db.findOne(collections.homeworkAnswers, { id: +homework_answer_id });
    }
    if (!answer) {
      answer = await db.findOne(collections.homeworkAnswers, { homework_id: +homeworkId, student_id: +student_id });
    }

    if (!answer) return res.status(404).json({ message: 'Talaba uyga vazifani topshirmagan' });

    const newStatus = gradeNum >= 60 ? 'ACCEPTED' : 'REJECTED';
    await db.update(collections.homeworkAnswers, { _id: answer._id }, {
      grade: gradeNum,
      status: newStatus,
      teacher_comment: title || '',
      checked_at: new Date().toISOString()
    });

    res.json({
      success: true,
      message: newStatus === 'ACCEPTED' ? 'Vazifa qabul qilindi' : 'Vazifa qaytarildi',
      data: { id: answer.id, grade: gradeNum, status: newStatus }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
