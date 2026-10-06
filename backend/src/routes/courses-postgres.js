import { Router } from 'express';
import { pool } from '../db-postgres.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// GET /courses - Barcha kurslar
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM courses WHERE is_archived = false ORDER BY created_at DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /courses/archive - Arxivlangan kurslar
router.get('/archive', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM courses WHERE is_archived = true ORDER BY created_at DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /courses/one/:id - Bitta kurs
router.get('/one/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM courses WHERE id = $1',
      [parseInt(req.params.id)]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Kurs topilmadi' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /courses - Yangi kurs qo'shish
router.post('/', async (req, res) => {
  try {
    const { name, description, duration, price } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Kurs nomi kiritilishi shart' });
    }

    const result = await pool.query(
      `INSERT INTO courses (name, description, duration, price, is_archived) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, description || null, duration || null, price || null, false]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /courses/:id - Kursni tahrirlash
router.patch('/:id', async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const { name, description, duration, price } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (duration !== undefined) {
      updates.push(`duration = $${paramCount++}`);
      values.push(duration);
    }
    if (price !== undefined) {
      updates.push(`price = $${paramCount++}`);
      values.push(price);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'Hech qanday o\'zgartirish yo\'q' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(courseId);

    const result = await pool.query(
      `UPDATE courses SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Kurs topilmadi' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /courses/:id - Kursni arxivlash
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(
      'UPDATE courses SET is_archived = true WHERE id = $1',
      [parseInt(req.params.id)]
    );
    res.json({ success: true, message: 'Kurs arxivlandi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
