import { Router } from 'express';
import { pool } from '../db-postgres.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// GET /student-group/all - Barcha talaba-guruh bog'lanishlari
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sg.*, 
             s.full_name as student_name,
             g.name as group_name
      FROM student_group sg
      LEFT JOIN students s ON sg.student_id = s.id
      LEFT JOIN groups g ON sg.group_id = g.id
      ORDER BY sg.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /student-group - Talabani guruhga qo'shish
router.post('/', async (req, res) => {
  try {
    const { student_id, group_id } = req.body;
    
    if (!student_id || !group_id) {
      return res.status(400).json({ message: 'student_id va group_id kiritilishi shart' });
    }

    // Mavjudligini tekshirish
    const existing = await pool.query(
      'SELECT * FROM student_group WHERE student_id = $1 AND group_id = $2',
      [parseInt(student_id), parseInt(group_id)]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Talaba bu guruhda allaqachon mavjud' });
    }

    // Qo'shish
    const result = await pool.query(
      `INSERT INTO student_group (student_id, group_id) 
       VALUES ($1, $2) RETURNING *`,
      [parseInt(student_id), parseInt(group_id)]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    // Unique constraint error
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Talaba bu guruhda allaqachon mavjud' });
    }
    res.status(500).json({ message: err.message });
  }
});

// DELETE /student-group/:id - Talabani guruhdan chiqarish
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM student_group WHERE id = $1 RETURNING *',
      [parseInt(req.params.id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Bog\'lanish topilmadi' });
    }

    res.json({ success: true, message: 'O\'quvchi guruhdan chiqarildi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
