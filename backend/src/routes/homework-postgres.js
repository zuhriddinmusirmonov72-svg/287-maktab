import { Router } from 'express';
import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db-postgres.js';
import { authMiddleware } from '../middleware/auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const upload = multer({ dest: join(__dirname, '../../uploads/homeworks/') });
const router = Router();
router.use(authMiddleware);

// GET /homework/all - Barcha uy vazifalari
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        h.*,
        l.topic as lesson_topic,
        g.name as group_name,
        COUNT(DISTINCT ha.id) FILTER (WHERE ha.status = 'PENDING') as pending_count,
        COUNT(DISTINCT ha.id) FILTER (WHERE ha.status = 'ACCEPTED') as accepted_count,
        COUNT(DISTINCT ha.id) FILTER (WHERE ha.status = 'REJECTED') as rejected_count,
        COUNT(DISTINCT ha.id) as submitted_count,
        COUNT(DISTINCT sg.student_id) as students_count
      FROM homeworks h
      LEFT JOIN lessons l ON h.lesson_id = l.id
      LEFT JOIN groups g ON h.group_id = g.id
      LEFT JOIN homework_answers ha ON h.id = ha.homework_id
      LEFT JOIN student_group sg ON h.group_id = sg.group_id
      GROUP BY h.id, l.topic, g.name
      ORDER BY h.created_at DESC
    `);
    
    const data = result.rows.map(row => ({
      ...row,
      not_sent_count: parseInt(row.students_count || 0) - parseInt(row.submitted_count || 0)
    }));
    
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /homework/own/:lessonId - Student uchun o'z vazifasi
router.get('/own/:lessonId', async (req, res) => {
  try {
    const hwRes = await pool.query(
      'SELECT * FROM homeworks WHERE lesson_id = $1',
      [parseInt(req.params.lessonId)]
    );
    
    if (hwRes.rows.length === 0) {
      return res.json({ success: true, data: null });
    }
    
    const hw = hwRes.rows[0];
    
    const studentRes = await pool.query(
      'SELECT * FROM students WHERE user_id = $1',
      [req.user.id]
    );
    
    let answer = null;
    if (studentRes.rows.length > 0) {
      const answerRes = await pool.query(
        'SELECT * FROM homework_answers WHERE homework_id = $1 AND student_id = $2',
        [hw.id, studentRes.rows[0].id]
      );
      answer = answerRes.rows[0] || null;
    }
    
    res.json({ success: true, data: { ...hw, answer } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /homework/:groupId - Guruh uy vazifalari
router.get('/:groupId', async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    
    const result = await pool.query(`
      SELECT 
        h.*,
        l.topic as lesson_topic,
        l.lesson_date,
        COUNT(DISTINCT ha.id) FILTER (WHERE ha.status = 'PENDING') as pending_count,
        COUNT(DISTINCT ha.id) FILTER (WHERE ha.status = 'ACCEPTED') as accepted_count,
        COUNT(DISTINCT ha.id) FILTER (WHERE ha.status = 'REJECTED') as rejected_count,
        COUNT(DISTINCT ha.id) as submitted_count,
        COUNT(DISTINCT sg.student_id) as students_count
      FROM homeworks h
      LEFT JOIN lessons l ON h.lesson_id = l.id
      LEFT JOIN homework_answers ha ON h.id = ha.homework_id
      LEFT JOIN student_group sg ON h.group_id = sg.group_id
      WHERE h.group_id = $1
      GROUP BY h.id, l.topic, l.lesson_date
      ORDER BY h.created_at DESC
    `, [groupId]);
    
    const data = result.rows.map(row => {
      const studentsCount = parseInt(row.students_count || 0);
      const submittedCount = parseInt(row.submitted_count || 0);
      const pendingCount = parseInt(row.pending_count || 0);
      const acceptedCount = parseInt(row.accepted_count || 0);
      const rejectedCount = parseInt(row.rejected_count || 0);
      const notSentCount = studentsCount - submittedCount;
      
      return {
        ...row,
        students_count: studentsCount,
        submitted_count: submittedCount,
        pending_count: pendingCount,
        accepted_count: acceptedCount,
        rejected_count: rejectedCount,
        not_sent_count: notSentCount
      };
    });
    
    res.json({ success: true, data });
  } catch (err) {
    console.error('Homework list xato:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /homework - Yangi uy vazifa yaratish
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { group_id, lesson_id, title, description } = req.body;
    
    if (!group_id || !lesson_id || !title) {
      return res.status(400).json({ message: 'group_id, lesson_id va title kiritilishi shart' });
    }

    const file = req.file ? `/uploads/homeworks/${req.file.filename}` : null;

    const result = await pool.query(
      `INSERT INTO homeworks (group_id, lesson_id, title, description, file) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [parseInt(group_id), parseInt(lesson_id), title, description || null, file]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /homework/:id - Uy vazifani tahrirlash
router.patch('/:id', upload.single('file'), async (req, res) => {
  try {
    const homeworkId = parseInt(req.params.id);
    const { title, description } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (req.file) {
      updates.push(`file = $${paramCount++}`);
      values.push(`/uploads/homeworks/${req.file.filename}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'Hech qanday o\'zgartirish yo\'q' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(homeworkId);

    const result = await pool.query(
      `UPDATE homeworks SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Uy vazifa topilmadi' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /homework/:id - Uy vazifani o'chirish
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM homeworks WHERE id = $1 RETURNING *',
      [parseInt(req.params.id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Uy vazifa topilmadi' });
    }

    res.json({ success: true, message: 'Uy vazifa o\'chirildi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /homework/answer - Student javobini yuborish
router.post('/answer', upload.single('file'), async (req, res) => {
  try {
    const { homework_id, comment } = req.body;
    
    if (!homework_id) {
      return res.status(400).json({ message: 'homework_id kiritilishi shart' });
    }

    const studentRes = await pool.query(
      'SELECT * FROM students WHERE user_id = $1',
      [req.user.id]
    );

    if (studentRes.rows.length === 0) {
      return res.status(404).json({ message: 'Talaba topilmadi' });
    }

    const student = studentRes.rows[0];
    const file = req.file ? `/uploads/homeworks/${req.file.filename}` : null;

    // Mavjud javobni tekshirish
    const existing = await pool.query(
      'SELECT * FROM homework_answers WHERE homework_id = $1 AND student_id = $2',
      [parseInt(homework_id), student.id]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update
      result = await pool.query(
        `UPDATE homework_answers 
         SET file = $1, comment = $2, status = 'PENDING', submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3 
         RETURNING *`,
        [file, comment || null, existing.rows[0].id]
      );
    } else {
      // Insert
      result = await pool.query(
        `INSERT INTO homework_answers (homework_id, student_id, file, comment, status, submitted_at) 
         VALUES ($1, $2, $3, $4, 'PENDING', CURRENT_TIMESTAMP) RETURNING *`,
        [parseInt(homework_id), student.id, file, comment || null]
      );
    }

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /homework/answer/:answerId/check - O'qituvchi tekshirishi
router.patch('/answer/:answerId/check', async (req, res) => {
  try {
    const { status, teacher_comment, score } = req.body;
    
    if (!status || !['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Status ACCEPTED yoki REJECTED bo\'lishi kerak' });
    }

    const result = await pool.query(
      `UPDATE homework_answers 
       SET status = $1, teacher_comment = $2, score = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING *`,
      [status, teacher_comment || null, score || null, parseInt(req.params.answerId)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Javob topilmadi' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
