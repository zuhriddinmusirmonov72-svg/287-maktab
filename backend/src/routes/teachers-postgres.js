import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db-postgres.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const upload = multer({ dest: join(__dirname, '../../uploads/photos/') });
const router = Router();
router.use(authMiddleware);

// GET /teachers - Barcha o'qituvchilar
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, u.phone as user_phone 
      FROM teachers t 
      LEFT JOIN users u ON t.user_id = u.id 
      WHERE t.is_archived = false
      ORDER BY t.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /teachers/archive - Arxivlangan o'qituvchilar
router.get('/archive', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, u.phone as user_phone 
      FROM teachers t 
      LEFT JOIN users u ON t.user_id = u.id 
      WHERE t.is_archived = true
      ORDER BY t.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /teachers/my/profile - O'qituvchining profili
router.get('/my/profile', requireRole('teacher'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM teachers WHERE user_id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'O\'qituvchi topilmadi' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /teachers/my/groups - O'qituvchining guruhlari
router.get('/my/groups', async (req, res) => {
  try {
    let teacherId;
    
    if (req.user.role === 'teacher') {
      const teacherResult = await pool.query(
        'SELECT id FROM teachers WHERE user_id = $1',
        [req.user.id]
      );
      if (teacherResult.rows.length === 0) {
        return res.status(404).json({ message: 'O\'qituvchi topilmadi' });
      }
      teacherId = teacherResult.rows[0].id;
    } else {
      teacherId = parseInt(req.query.teacher_id);
    }

    const groupsResult = await pool.query(`
      SELECT 
        g.*,
        c.name as course_name,
        r.name as room_name,
        COUNT(DISTINCT sg.student_id) as student_count
      FROM groups g
      LEFT JOIN courses c ON g.course_id = c.id
      LEFT JOIN rooms r ON g.room_id = r.id
      LEFT JOIN student_group sg ON g.id = sg.group_id
      WHERE g.teacher_id = $1 AND g.is_archived = false
      GROUP BY g.id, c.name, r.name
      ORDER BY g.created_at DESC
    `, [teacherId]);

    // Har bir guruh uchun studentlarni olish
    const groups = await Promise.all(groupsResult.rows.map(async (group) => {
      const studentsResult = await pool.query(`
        SELECT s.* 
        FROM students s
        INNER JOIN student_group sg ON s.id = sg.student_id
        WHERE sg.group_id = $1 AND s.is_archived = false
      `, [group.id]);
      
      return {
        ...group,
        students: studentsResult.rows
      };
    }));

    res.json({ success: true, data: groups });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /teachers/one/:id - Bitta o'qituvchi
router.get('/one/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM teachers WHERE id = $1',
      [parseInt(req.params.id)]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'O\'qituvchi topilmadi' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /teachers - Yangi o'qituvchi qo'shish
router.post('/', upload.single('photo'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { full_name, phone, subject, email, password = 'teacher123' } = req.body;
    
    if (!full_name || !phone) {
      return res.status(400).json({ message: 'Ism va telefon kiritilishi shart' });
    }

    // Telefon raqam mavjudligini tekshirish
    const existingUser = await client.query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );
    
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Bu telefon raqam allaqachon mavjud' });
    }

    // User yaratish
    const hashedPassword = bcrypt.hashSync(password, 10);
    const userResult = await client.query(
      `INSERT INTO users (phone, password, role, full_name, email) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [phone, hashedPassword, 'TEACHER', full_name, email || null]
    );
    
    const userId = userResult.rows[0].id;
    const photo = req.file ? `/uploads/photos/${req.file.filename}` : null;

    // Teacher yaratish
    const teacherResult = await client.query(
      `INSERT INTO teachers (user_id, full_name, phone, subject, photo, is_archived) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, full_name, phone, subject || null, photo, false]
    );

    await client.query('COMMIT');
    
    res.status(201).json({ 
      success: true, 
      data: teacherResult.rows[0] 
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('O\'qituvchi yaratishda xato:', err);
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
});

// PATCH /teachers/:id - O'qituvchini tahrirlash
router.patch('/:id', upload.single('photo'), async (req, res) => {
  try {
    const teacherId = parseInt(req.params.id);
    
    // Mavjudligini tekshirish
    const existing = await pool.query(
      'SELECT * FROM teachers WHERE id = $1',
      [teacherId]
    );
    
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'O\'qituvchi topilmadi' });
    }

    const { full_name, phone, subject } = req.body;
    const photo = req.file ? `/uploads/photos/${req.file.filename}` : existing.rows[0].photo;

    // Update qilish
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (full_name) {
      updates.push(`full_name = $${paramCount++}`);
      values.push(full_name);
    }
    if (phone) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (subject) {
      updates.push(`subject = $${paramCount++}`);
      values.push(subject);
    }
    if (photo) {
      updates.push(`photo = $${paramCount++}`);
      values.push(photo);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(teacherId);

    const result = await pool.query(
      `UPDATE teachers SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /teachers/:id - O'qituvchini arxivlash
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(
      'UPDATE teachers SET is_archived = true WHERE id = $1',
      [parseInt(req.params.id)]
    );
    res.json({ success: true, message: 'O\'qituvchi arxivlandi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
