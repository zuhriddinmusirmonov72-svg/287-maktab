import { Router } from 'express';
import { db, collections, nextId } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

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
        homework_answer_id: answer?.id || null,
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
          if (status === 'PENDING')  return r.status === 'PENDING';
          if (status === 'ACCEPTED') return r.status === 'ACCEPTED';
          if (status === 'REJECTED') return r.status === 'REJECTED';
          if (status === 'NOT_SENT') return r.status === 'NOT_SENT';
          return true;
        })
      : result;

    res.json({
      success: true,
      data: filtered,
      summary: {
        total:    allStudents.length,
        pending:  result.filter(r => r.status === 'PENDING').length,
        accepted: result.filter(r => r.status === 'ACCEPTED').length,
        rejected: result.filter(r => r.status === 'REJECTED').length,
        not_sent: result.filter(r => r.status === 'NOT_SENT').length,
      }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /group/:groupId/homework/:homeworkId/result/:studentId
router.get('/group/:groupId/homework/:homeworkId/result/:studentId', async (req, res) => {
  try {
    const { homeworkId, studentId } = req.params;
    const answer = await db.findOne(collections.homeworkAnswers, {
      homework_id: +homeworkId,
      student_id: +studentId
    });
    if (!answer) return res.status(404).json({ message: 'Talaba uyga vazifani topshirmagan' });
    const student = await db.findOne(collections.students, { id: +studentId });
    res.json({ success: true, data: { ...answer, full_name: student?.full_name, photo: student?.photo } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /group/:groupId/homework/:homeworkId/check
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
      return res.status(400).json({ message: ["grade 0 dan 100 gacha bo'lishi kerak"] });

    // homework_answer_id yoki student_id + homeworkId orqali topish
    let answer = null;
    if (homework_answer_id) {
      answer = await db.findOne(collections.homeworkAnswers, { id: +homework_answer_id });
    }
    if (!answer) {
      answer = await db.findOne(collections.homeworkAnswers, {
        homework_id: +homeworkId,
        student_id: +student_id
      });
    }

    if (!answer) return res.status(404).json({ message: 'Talaba uyga vazifani topshirmagan' });

    const newStatus = gradeNum >= 60 ? 'ACCEPTED' : 'REJECTED';
    await db.update(collections.homeworkAnswers, { _id: answer._id }, {
      grade: gradeNum,
      status: newStatus,
      teacher_comment: title || '',
      checked_at: new Date().toISOString()
    });

    // 🔔 Bildirishnoma yaratish
    const notifId = await nextId(collections.notifications);
    const notifTitle = newStatus === 'ACCEPTED' 
      ? '✅ Uyga vazifa qabul qilindi!' 
      : '❌ Uyga vazifa qaytarildi';
    
    const notifMessage = newStatus === 'ACCEPTED'
      ? `Tabriklaymiz! Sizning uyga vazifangiz qabul qilindi. Ball: ${gradeNum}`
      : `Uyga vazifa qaytarildi. Ball: ${gradeNum}. Iltimos, qaytadan topshiring.`;
    
    await db.insert(collections.notifications, {
      id: notifId,
      student_id: answer.student_id,
      title: notifTitle,
      message: notifMessage,
      type: newStatus === 'ACCEPTED' ? 'HOMEWORK_ACCEPTED' : 'HOMEWORK_REJECTED',
      is_read: false,
      created_at: new Date().toISOString()
    });

    // Agar qabul qilingan bo'lsa, 10 kumush tanga bonus qo'shish
    if (newStatus === 'ACCEPTED') {
      const student = await db.findOne(collections.students, { id: answer.student_id });
      if (student) {
        const currentCoins = student.coins || 0;
        const currentXP = student.xp || 0;
        
        await db.update(collections.students, { _id: student._id }, {
          coins: currentCoins + 10,
          xp: currentXP + 10
        });
        
        // Kumush tanga bildirishnomasi
        const coinNotifId = await nextId(collections.notifications);
        await db.insert(collections.notifications, {
          id: coinNotifId,
          student_id: answer.student_id,
          title: '+10 💎 Kumush tanga',
          message: 'Uyga vazifa qabul qilingani uchun 10 kumush tanga oldingiz!',
          type: 'COINS',
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
    }

    res.json({
      success: true,
      message: newStatus === 'ACCEPTED' ? 'Vazifa qabul qilindi' : 'Vazifa qaytarildi',
      data: { id: answer.id, grade: gradeNum, status: newStatus }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
