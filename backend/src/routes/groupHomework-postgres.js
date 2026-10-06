import { Router } from 'express';
import { pool } from '../db-postgres.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// GET /group/:groupId/homework/:homeworkId/results?status=
router.get('/group/:groupId/homework/:homeworkId/results', async (req, res) => {
  try {
    const { groupId, homeworkId } = req.params;
    const { status } = req.query;

    // Guruh talabalarini olish
    const studentsResult = await pool.query(`
      SELECT s.*
      FROM students s
      INNER JOIN student_group sg ON s.id = sg.student_id
      WHERE sg.group_id = $1 AND s.is_archived = false
      ORDER BY s.full_name
    `, [parseInt(groupId)]);

    const allStudents = studentsResult.rows;

    // Uy vazifa javoblarini olish
    const answersResult = await pool.query(
      'SELECT * FROM homework_answers WHERE homework_id = $1',
      [parseInt(homeworkId)]
    );

    const answers = answersResult.rows;

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
        submitted_at: answer?.submitted_at || null,
        grade: answer?.score || null,
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
  } catch (err) { 
    console.error('Homework results xato:', err);
    res.status(500).json({ message: err.message }); 
  }
});

// GET /group/:groupId/homework/:homeworkId/result/:studentId
router.get('/group/:groupId/homework/:homeworkId/result/:studentId', async (req, res) => {
  try {
    const { homeworkId, studentId } = req.params;
    
    const answerResult = await pool.query(
      'SELECT * FROM homework_answers WHERE homework_id = $1 AND student_id = $2',
      [parseInt(homeworkId), parseInt(studentId)]
    );

    if (answerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Talaba uyga vazifani topshirmagan' });
    }

    const answer = answerResult.rows[0];

    const studentResult = await pool.query(
      'SELECT full_name, photo FROM students WHERE id = $1',
      [parseInt(studentId)]
    );

    const student = studentResult.rows[0];

    res.json({ 
      success: true, 
      data: { 
        ...answer, 
        full_name: student?.full_name, 
        photo: student?.photo 
      } 
    });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

// POST /group/:groupId/homework/:homeworkId/check
router.post('/group/:groupId/homework/:homeworkId/check', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { homeworkId } = req.params;
    const { grade, title, student_id, homework_answer_id } = req.body;

    if (grade === undefined || grade === null) {
      return res.status(400).json({ message: ['grade is required'] });
    }
    if (!student_id) {
      return res.status(400).json({ message: ['student_id is required'] });
    }

    const gradeNum = Number(grade);
    if (gradeNum < 0 || gradeNum > 100) {
      return res.status(400).json({ message: ["grade 0 dan 100 gacha bo'lishi kerak"] });
    }

    // Javobni topish
    let answerResult;
    if (homework_answer_id) {
      answerResult = await client.query(
        'SELECT * FROM homework_answers WHERE id = $1',
        [parseInt(homework_answer_id)]
      );
    }
    
    if (!answerResult || answerResult.rows.length === 0) {
      answerResult = await client.query(
        'SELECT * FROM homework_answers WHERE homework_id = $1 AND student_id = $2',
        [parseInt(homeworkId), parseInt(student_id)]
      );
    }

    if (answerResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Talaba uyga vazifani topshirmagan' });
    }

    const answer = answerResult.rows[0];
    const newStatus = gradeNum >= 60 ? 'ACCEPTED' : 'REJECTED';

    // Javobni yangilash
    await client.query(
      `UPDATE homework_answers 
       SET score = $1, status = $2, teacher_comment = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4`,
      [gradeNum, newStatus, title || '', answer.id]
    );

    // 🔔 Bildirishnoma yaratish
    const notifTitle = newStatus === 'ACCEPTED' 
      ? '✅ Uyga vazifa qabul qilindi!' 
      : '❌ Uyga vazifa qaytarildi';
    
    const notifMessage = newStatus === 'ACCEPTED'
      ? `Tabriklaymiz! Sizning uyga vazifangiz qabul qilindi. Ball: ${gradeNum}`
      : `Uyga vazifa qaytarildi. Ball: ${gradeNum}. Iltimos, qaytadan topshiring.`;

    // User ID ni topish
    const studentResult = await client.query(
      'SELECT user_id FROM students WHERE id = $1',
      [answer.student_id]
    );
    
    if (studentResult.rows.length > 0) {
      const userId = studentResult.rows[0].user_id;
      
      await client.query(
        `INSERT INTO notifications (user_id, title, message, notification_type, is_read) 
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, notifTitle, notifMessage, newStatus === 'ACCEPTED' ? 'HOMEWORK_ACCEPTED' : 'HOMEWORK_REJECTED', false]
      );

      // Agar qabul qilingan bo'lsa, 10 kumush tanga bonus
      if (newStatus === 'ACCEPTED') {
        await client.query(
          `UPDATE students 
           SET coins = COALESCE(coins, 0) + 10, xp = COALESCE(xp, 0) + 10 
           WHERE id = $1`,
          [answer.student_id]
        );

        await client.query(
          `INSERT INTO notifications (user_id, title, message, notification_type, is_read) 
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, '+10 💎 Kumush tanga', 'Uyga vazifa qabul qilingani uchun 10 kumush tanga oldingiz!', 'COINS', false]
        );
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: newStatus === 'ACCEPTED' ? 'Vazifa qabul qilindi' : 'Vazifa qaytarildi',
      data: { id: answer.id, grade: gradeNum, status: newStatus }
    });
  } catch (err) { 
    await client.query('ROLLBACK');
    console.error('Homework check xato:', err);
    res.status(500).json({ message: err.message }); 
  } finally {
    client.release();
  }
});

export default router;
