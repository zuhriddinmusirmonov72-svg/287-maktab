import { Router } from 'express';
import { pool } from '../db-postgres.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// GET /attendance/all - Barcha davomat ma'lumotlari
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*,
             s.full_name as student_name,
             g.name as group_name,
             l.topic as lesson_topic
      FROM attendance a
      LEFT JOIN students s ON a.student_id = s.id
      LEFT JOIN groups g ON a.group_id = g.id
      LEFT JOIN lessons l ON a.lesson_id = l.id
      ORDER BY a.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /attendance/lesson/:lessonId - Bitta dars uchun davomat
router.get('/lesson/:lessonId', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*,
             s.full_name as student_name
      FROM attendance a
      LEFT JOIN students s ON a.student_id = s.id
      WHERE a.lesson_id = $1
      ORDER BY s.full_name
    `, [parseInt(req.params.lessonId)]);
    
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /attendance/:groupId - Guruh uchun davomat
router.get('/:groupId', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*,
             s.full_name as student_name,
             l.topic as lesson_topic,
             l.lesson_date
      FROM attendance a
      LEFT JOIN students s ON a.student_id = s.id
      LEFT JOIN lessons l ON a.lesson_id = l.id
      WHERE a.group_id = $1
      ORDER BY a.date DESC, l.lesson_date DESC, s.full_name
    `, [parseInt(req.params.groupId)]);
    
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /attendance - Davomat qo'shish
router.post('/', async (req, res) => {
  try {
    const { group_id, student_id, isPresent, lesson_id, date } = req.body;
    
    if (!group_id || !student_id) {
      return res.status(400).json({ message: 'group_id va student_id kiritilishi shart' });
    }

    // Mavjudligini tekshirish
    const existing = await pool.query(
      'SELECT * FROM attendance WHERE lesson_id = $1 AND student_id = $2',
      [lesson_id ? parseInt(lesson_id) : null, parseInt(student_id)]
    );

    if (existing.rows.length > 0) {
      // Update qilish
      const updated = await pool.query(
        `UPDATE attendance 
         SET is_present = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING *`,
        [!!isPresent, existing.rows[0].id]
      );
      return res.json({ success: true, data: updated.rows[0] });
    }

    // Yangi qo'shish
    const result = await pool.query(
      `INSERT INTO attendance (lesson_id, group_id, student_id, is_present, date) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        lesson_id ? parseInt(lesson_id) : null, 
        parseInt(group_id), 
        parseInt(student_id), 
        !!isPresent,
        date || null
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /attendance/:id - Davomatni tahrirlash
router.patch('/:id', async (req, res) => {
  try {
    const { isPresent } = req.body;
    
    const result = await pool.query(
      `UPDATE attendance 
       SET is_present = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [!!isPresent, parseInt(req.params.id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Davomat topilmadi' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /attendance/:id - Davomatni o'chirish
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM attendance WHERE id = $1 RETURNING *',
      [parseInt(req.params.id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Davomat topilmadi' });
    }

    res.json({ success: true, message: 'Davomat o\'chirildi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
