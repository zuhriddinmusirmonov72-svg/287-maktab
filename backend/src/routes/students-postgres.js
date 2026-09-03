import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import { query } from '../db-postgres.js';
import { authMiddleware } from '../middleware/auth.js';
import { notifyHomeworkSubmission } from '../utils/pushNotification.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = join(__dirname, '..', '..', 'uploads', 'photos');
mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(7)}${file.originalname.substring(file.originalname.lastIndexOf('.'))}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const router = Router();
router.use(authMiddleware);

// =============================================
// GET ALL STUDENTS
// =============================================
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        s.*,
        u.phone as user_phone,
        u.role
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.is_archived = false
      ORDER BY s.id DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get students error:', err);
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// GET ARCHIVED STUDENTS
// =============================================
router.get('/archive', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        s.*,
        u.phone as user_phone
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.is_archived = true
      ORDER BY s.id DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// GET MY GROUPS (for logged-in student)
// =============================================
router.get('/my/groups', async (req, res) => {
  try {
    const studentResult = await query(
      'SELECT * FROM students WHERE user_id = $1',
      [req.user.id]
    );
    
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Talaba topilmadi' });
    }
    
    const student = studentResult.rows[0];
    
    // Get groups for this student
    const groupsResult = await query(`
      SELECT 
        g.*,
        c.name as course_name,
        t.full_name as teacher_name,
        t.photo as teacher_photo,
        r.name as room_name,
        COUNT(DISTINCT sg.student_id) as student_count
      FROM student_group sg
      JOIN groups g ON sg.group_id = g.id
      LEFT JOIN courses c ON g.course_id = c.id
      LEFT JOIN teachers t ON g.teacher_id = t.id
      LEFT JOIN rooms r ON g.room_id = r.id
      WHERE sg.student_id = $1 AND g.is_archived = false
      GROUP BY g.id, c.name, t.full_name, t.photo, r.name
      ORDER BY g.id DESC
    `, [student.id]);
    
    res.json({ success: true, data: groupsResult.rows });
  } catch (err) {
    console.error('Get my groups error:', err);
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// GET ONE STUDENT
// =============================================
router.get('/one/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM students WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Talaba topilmadi' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// CREATE STUDENT (with photo upload)
// =============================================
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const { full_name, phone, password = 'student123' } = req.body;
    
    if (!full_name || !phone) {
      return res.status(400).json({ message: 'Ism va telefon kiritilishi shart' });
    }
    
    // Check if phone already exists
    const existingUser = await query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Bu telefon raqam allaqachon mavjud' });
    }
    
    // ✅ PAROLNI HASH QILISH - Bu eng muhim!
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    // Create user
    const userResult = await query(
      `INSERT INTO users (phone, password, role, full_name) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id`,
      [phone, hashedPassword, 'STUDENT', full_name]
    );
    
    const userId = userResult.rows[0].id;
    
    // Handle photo
    const photoPath = req.file ? `/uploads/photos/${req.file.filename}` : null;
    
    // Create student profile
    const studentResult = await query(
      `INSERT INTO students (user_id, full_name, phone, photo, coins, xp, is_archived) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [userId, full_name, phone, photoPath, 0, 0, false]
    );
    
    console.log('✅ Student yaratildi:', { phone, hasPasswordHash: hashedPassword.substring(0, 10) + '...' });
    
    res.status(201).json({ 
      success: true, 
      data: studentResult.rows[0],
      message: `Student yaratildi. Login: ${phone} / Parol: ${password}`
    });
  } catch (err) {
    console.error('Create student error:', err);
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// UPDATE STUDENT (with photo upload)
// =============================================
router.patch('/:id', upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone } = req.body;
    
    // Check if student exists
    const studentCheck = await query('SELECT * FROM students WHERE id = $1', [id]);
    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Talaba topilmadi' });
    }
    
    const currentStudent = studentCheck.rows[0];
    
    // Handle photo
    const photoPath = req.file 
      ? `/uploads/photos/${req.file.filename}` 
      : currentStudent.photo;
    
    // Update student
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (full_name) {
      updates.push(`full_name = $${paramIndex}`);
      values.push(full_name);
      paramIndex++;
    }
    
    if (phone) {
      updates.push(`phone = $${paramIndex}`);
      values.push(phone);
      paramIndex++;
    }
    
    updates.push(`photo = $${paramIndex}`);
    values.push(photoPath);
    paramIndex++;
    
    values.push(id);
    
    const result = await query(
      `UPDATE students SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    // Update user phone if provided
    if (phone) {
      await query(
        'UPDATE users SET phone = $1 WHERE id = $2',
        [phone, currentStudent.user_id]
      );
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Update student error:', err);
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// DELETE STUDENT (soft delete)
// =============================================
router.delete('/:id', async (req, res) => {
  try {
    await query(
      'UPDATE students SET is_archived = true WHERE id = $1',
      [req.params.id]
    );
    
    res.json({ success: true, message: 'Talaba arxivlandi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// RESTORE STUDENT
// =============================================
router.patch('/:id/restore', async (req, res) => {
  try {
    await query(
      'UPDATE students SET is_archived = false WHERE id = $1',
      [req.params.id]
    );
    
    res.json({ success: true, message: 'Talaba tiklandi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// SUBMIT HOMEWORK (student)
// =============================================
router.post('/homeworkAnswer/:homeworkId', upload.single('file'), async (req, res) => {
  try {
    const { homeworkId } = req.params;
    const { title, comment } = req.body;
    
    // Get student by user_id
    const studentResult = await query(
      'SELECT * FROM students WHERE user_id = $1',
      [req.user.id]
    );
    
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Talaba topilmadi' });
    }
    
    const student = studentResult.rows[0];
    
    // Get homework details
    const homeworkResult = await query(
      'SELECT * FROM homeworks WHERE id = $1',
      [homeworkId]
    );
    
    if (homeworkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Uyga vazifa topilmadi' });
    }
    
    const homework = homeworkResult.rows[0];
    
    // Handle file
    const filePath = req.file ? `/uploads/homeworks/${req.file.filename}` : null;
    
    // Check if already submitted
    const existingAnswer = await query(
      'SELECT * FROM homework_answers WHERE homework_id = $1 AND student_id = $2',
      [homeworkId, student.id]
    );
    
    let result;
    
    if (existingAnswer.rows.length > 0) {
      // Update existing answer
      result = await query(
        `UPDATE homework_answers 
         SET file = $1, comment = $2, status = 'PENDING', submitted_at = CURRENT_TIMESTAMP
         WHERE homework_id = $3 AND student_id = $4
         RETURNING *`,
        [filePath, comment, homeworkId, student.id]
      );
    } else {
      // Create new answer
      result = await query(
        `INSERT INTO homework_answers (homework_id, student_id, file, comment, status)
         VALUES ($1, $2, $3, $4, 'PENDING')
         RETURNING *`,
        [homeworkId, student.id, filePath, comment]
      );
    }
    
    // ========================================
    // 📱 SEND PUSH NOTIFICATION TO ADMINS AND TEACHERS
    // ========================================
    try {
      const studentName = student.full_name || 'O\'quvchi';
      const homeworkTitle = homework.title || 'Uyga vazifa';
      
      await notifyHomeworkSubmission(studentName, homeworkTitle, homeworkId);
      console.log(`✅ Push notification sent: ${studentName} submitted homework`);
    } catch (notifError) {
      console.error('⚠️ Failed to send push notification:', notifError);
      // Don't fail the request if notification fails
    }
    
    res.json({ 
      success: true, 
      data: result.rows[0],
      message: 'Uyga vazifa yuborildi'
    });
  } catch (err) {
    console.error('Submit homework error:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
