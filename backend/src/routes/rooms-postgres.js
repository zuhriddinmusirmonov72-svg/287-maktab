import { Router } from 'express';
import { pool } from '../db-postgres.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// GET /rooms - Barcha xonalar
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM rooms WHERE is_archived = false ORDER BY created_at DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /rooms/arxive - Arxivlangan xonalar (typo kept for compatibility)
router.get('/arxive', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM rooms WHERE is_archived = true ORDER BY created_at DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /rooms/one/:id - Bitta xona
router.get('/one/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM rooms WHERE id = $1',
      [parseInt(req.params.id)]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Xona topilmadi' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /rooms - Yangi xona qo'shish
router.post('/', async (req, res) => {
  try {
    const { name, capacity } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Xona nomi kiritilishi shart' });
    }

    const result = await pool.query(
      `INSERT INTO rooms (name, capacity, is_archived) 
       VALUES ($1, $2, $3) RETURNING *`,
      [name, capacity || null, false]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /rooms/:id - Xonani tahrirlash
router.patch('/:id', async (req, res) => {
  try {
    const roomId = parseInt(req.params.id);
    const { name, capacity } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (capacity !== undefined) {
      updates.push(`capacity = $${paramCount++}`);
      values.push(capacity);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'Hech qanday o\'zgartirish yo\'q' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(roomId);

    const result = await pool.query(
      `UPDATE rooms SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Xona topilmadi' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /rooms/:id - Xonani arxivlash
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(
      'UPDATE rooms SET is_archived = true WHERE id = $1',
      [parseInt(req.params.id)]
    );
    res.json({ success: true, message: 'Xona arxivlandi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
