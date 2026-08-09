import { Router } from 'express';
import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { db, collections, nextId } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VIDEOS_DIR = join(__dirname, '../../uploads/videos/');

const storage = multer.diskStorage({
  destination: VIDEOS_DIR,
  filename: (req, file, cb) => {
    const ext = file.originalname.slice(file.originalname.lastIndexOf('.'));
    cb(null, `${Date.now()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

const router = Router();
router.use(authMiddleware);

// GET /files/:groupId
router.get('/:groupId', async (req, res) => {
  const files = await db.find(collections.files, { group_id: +req.params.groupId });
  const lessons = await db.find(collections.lessons, {});
  const result = files.map(f => ({
    ...f,
    video_url: f.filename,                        // faqat fayl nomi
    url: `/files/videos/${f.filename}`,           // to'liq URL path
    lesson_topic: lessons.find(l => l.id === f.lesson_id)?.topic,
  }));
  res.json({ success: true, data: result });
});

// POST /files/group/:grupId/upload?lessonId=
router.post('/group/:grupId/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Fayl tanlanmagan' });
    const { lessonId } = req.query;
    if (!lessonId) return res.status(400).json({ message: 'lessonId kiritilishi shart' });

    const id = await nextId(collections.files);
    const fileDoc = await db.insert(collections.files, {
      id,
      group_id: +req.params.grupId,
      lesson_id: +lessonId,
      originalname: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    res.status(201).json({
      success: true,
      data: {
        id: fileDoc.id,
        originalname: req.file.originalname,
        filename: req.file.filename,
        video_url: req.file.filename,
        url: `/files/videos/${req.file.filename}`,
      }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /files/:id
router.delete('/:id', async (req, res) => {
  await db.remove(collections.files, { id: +req.params.id });
  res.json({ success: true, message: 'Fayl o\'chirildi' });
});

export default router;
