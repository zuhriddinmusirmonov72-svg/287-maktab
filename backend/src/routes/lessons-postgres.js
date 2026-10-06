import { Router } from 'express';
import { pool } from '../db-postgres.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// GET /lessons/my-group-lessons/:groupId - Guruh darslari
router.get('/my-group-lessons/:groupId', async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    
    const result = await pool.query(`
      SELECT l.*,
             (SELECT COUNT(*) FROM files WHERE lesson_id = l.id) as video_count,
             (SELECT COUNT(*) FROM homeworks WHERE lesson_id = l.id) as homework_count
      FROM lessons l
      WHERE l.group_id = $1
      ORDER BY l.lesson_date DESC, l.created_at DESC
    `, [groupId]);
    
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /lessons/:id - Bitta dars
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM lessons WHERE id = $1',
      [parseInt(req.params.id)]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Dars topilmadi' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /lessons - Yangi dars yaratish
router.post('/', async (req, res) => {
  try {
    const { group_id, topic, description, lesson_date } = req.body;
    
    if (!group_id || !topic) {
      return res.status(400).json({ message: 'Guruh ID va mavzu kiritilishi shart' });
    }

    const result = await pool.query(
      `INSERT INTO lessons (group_id, topic, description, lesson_date) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [parseInt(group_id), topic, description || null, lesson_date || null]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /lessons/:id - Darsni tahrirlash
router.patch('/:id', async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    const { topic, description, lesson_date } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (topic) {
      updates.push(`topic = $${paramCount++}`);
      values.push(topic);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (lesson_date !== undefined) {
      updates.push(`lesson_date = $${paramCount++}`);
      values.push(lesson_date);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'Hech qanday o\'zgartirish yo\'q' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(lessonId);

    const result = await pool.query(
      `UPDATE lessons SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Dars topilmadi' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /lessons/:id - Darsni o'chirish
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM lessons WHERE id = $1 RETURNING *',
      [parseInt(req.params.id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Dars topilmadi' });
    }

    res.json({ success: true, message: 'Dars o\'chirildi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
