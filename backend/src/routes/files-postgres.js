import { Router } from 'express';
import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db-postgres.js';
import { authMiddleware } from '../middleware/auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const upload = multer({ dest: join(__dirname, '../../uploads/videos/') });
const router = Router();
router.use(authMiddleware);

// GET /files/:groupId - Guruh fayllari
router.get('/:groupId', async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    
    const result = await pool.query(`
      SELECT f.*,
             l.topic as lesson_topic,
             l.lesson_date
      FROM files f
      LEFT JOIN lessons l ON f.lesson_id = l.id
      WHERE f.group_id = $1
      ORDER BY f.created_at DESC
    `, [groupId]);
    
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /files/lesson/:lessonId - Dars fayllari
router.get('/lesson/:lessonId', async (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    
    const result = await pool.query(
      'SELECT * FROM files WHERE lesson_id = $1 ORDER BY created_at DESC',
      [lessonId]
    );
    
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /files/download/:fileId - Faylni yuklab olish
router.get('/download/:fileId', async (req, res) => {
  try {
    const fileId = parseInt(req.params.fileId);
    
    const result = await pool.query(
      'SELECT * FROM files WHERE id = $1',
      [fileId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Fayl topilmadi' });
    }
    
    const file = result.rows[0];
    const filePath = join(__dirname, '../..', file.path);
    
    res.download(filePath, file.original_name || file.filename);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /files/upload - Fayl yuklash
router.post('/upload', upload.array('files', 10), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { group_id, lesson_id } = req.body;
    
    if (!group_id || !lesson_id) {
      return res.status(400).json({ message: 'group_id va lesson_id kiritilishi shart' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Hech qanday fayl yuklanmadi' });
    }

    const uploadedFiles = [];
    
    for (const file of req.files) {
      const result = await client.query(
        `INSERT INTO files (group_id, lesson_id, filename, original_name, path, mimetype, size) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          parseInt(group_id),
          parseInt(lesson_id),
          file.filename,
          file.originalname,
          `/uploads/videos/${file.filename}`,
          file.mimetype,
          file.size
        ]
      );
      
      uploadedFiles.push(result.rows[0]);
    }

    await client.query('COMMIT');
    
    res.status(201).json({ 
      success: true, 
      message: `${uploadedFiles.length} ta fayl yuklandi`,
      data: uploadedFiles 
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
});

// DELETE /files/:fileId - Faylni o'chirish
router.delete('/:fileId', async (req, res) => {
  try {
    const fileId = parseInt(req.params.fileId);
    
    const result = await pool.query(
      'DELETE FROM files WHERE id = $1 RETURNING *',
      [fileId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Fayl topilmadi' });
    }

    // Faylni diskdan o'chirish (optional)
    // const filePath = join(__dirname, '../..', result.rows[0].path);
    // fs.unlinkSync(filePath);

    res.json({ success: true, message: 'Fayl o\'chirildi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
