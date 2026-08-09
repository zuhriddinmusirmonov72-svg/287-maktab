import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import swaggerUi from 'swagger-ui-express';

import { initDB } from './database.js';
import { swaggerDoc } from './swagger.js';

import authRoutes       from './routes/auth.js';
import usersRoutes      from './routes/users.js';
import studentsRoutes   from './routes/students.js';
import teachersRoutes   from './routes/teachers.js';
import coursesRoutes    from './routes/courses.js';
import roomsRoutes      from './routes/rooms.js';
import groupsRoutes     from './routes/groups.js';
import studentGroupRoutes from './routes/studentGroup.js';
import lessonsRoutes    from './routes/lessons.js';
import attendanceRoutes from './routes/attendance.js';
import homeworkRoutes   from './routes/homework.js';
import filesRoutes      from './routes/files.js';
import coinsRoutes      from './routes/coins.js';
import notificationsRoutes from './routes/notifications.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

// Papkalarni yaratish
['uploads/photos', 'uploads/videos', 'uploads/homeworks', 'data'].forEach(dir => {
  mkdirSync(join(__dirname, '..', dir), { recursive: true });
});

// DB init
await initDB();

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static: rasmlar va videolar
app.use('/uploads', express.static(join(__dirname, '../uploads')));
app.use('/files/videos', express.static(join(__dirname, '../uploads/videos')));

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, {
  customSiteTitle: 'Najot Ta\'lim API',
  swaggerOptions: { persistAuthorization: true }
}));

// ─── API Router ────────────────────────────────────────────────
const api = express.Router();

api.use('/auth',          authRoutes);
api.use('/users',         usersRoutes);
api.use('/students',      studentsRoutes);
api.use('/teachers',      teachersRoutes);
api.use('/courses',       coursesRoutes);
api.use('/rooms',         roomsRoutes);
api.use('/groups',        groupsRoutes);
api.use('/student-group', studentGroupRoutes);
api.use('/lessons',       lessonsRoutes);
api.use('/attendance',    attendanceRoutes);
api.use('/files',         filesRoutes);
api.use('/coins',         coinsRoutes);
api.use('/notifications', notificationsRoutes);

// Homework ikki prefix bilan:
//   /homework/all, /homework/:groupId, /homework/:id  → prefix: /homework
//   /group/:groupId/homework/:homeworkId/results     → prefix: / (root)
//   /group/:groupId/homework/:homeworkId/check       → prefix: / (root)
api.use('/homework', homeworkRoutes);
// group/ prefiksli endpointlar uchun alohida router
import groupHomeworkRouter from './routes/groupHomework.js';
api.use('/', groupHomeworkRouter);

app.use('/api/v1', api);

// Health check
app.get('/', (req, res) => res.json({
  status: '✅ Ishlayapti',
  docs:   `http://localhost:${PORT}/api/docs`,
  api:    `http://localhost:${PORT}/api/v1`,
  logins: {
    superadmin: '998901234567 / admin123',
    teacher:    '998901234568 / teacher123',
    student:    '998901234569 / student123',
  }
}));

app.use((req, res) => res.status(404).json({ message: `Topilmadi: ${req.method} ${req.originalUrl}` }));
app.use((err, req, res, _next) => {
  console.error('❌', err.message);
  res.status(500).json({ message: err.message || 'Server xatosi' });
});

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 Najot Ta\'lim Backend ishga tushdi!');
  console.log(`📡 Server:  http://localhost:${PORT}`);
  console.log(`📚 Swagger: http://localhost:${PORT}/api/docs`);
  console.log(`🔗 API:     http://localhost:${PORT}/api/v1`);
  console.log('');
  console.log('👤 SUPERADMIN: 998901234567 / admin123');
  console.log('👤 TEACHER:    998901234568 / teacher123');
  console.log('👤 STUDENT:    998901234569 / student123');
  console.log('');
});
