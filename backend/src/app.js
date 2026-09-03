import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import swaggerUi from 'swagger-ui-express';
import 'dotenv/config';

// =============================================
// 🗄️ DATABASE - PostgreSQL yoki NeDB
// =============================================
const USE_POSTGRES = process.env.DATABASE_URL ? true : false;

if (USE_POSTGRES) {
  console.log('📊 Using PostgreSQL database');
  const { initPostgres } = await import('./db-postgres.js');
  await initPostgres();
} else {
  console.log('📦 Using NeDB (file-based) database');
  const { initDB } = await import('./database.js');
  await initDB();
}

import { swaggerDoc } from './swagger.js';

// =============================================
// 📡 ROUTES - PostgreSQL yoki NeDB
// =============================================
let authRoutes, usersRoutes, studentsRoutes, teachersRoutes, coursesRoutes;
let roomsRoutes, groupsRoutes, studentGroupRoutes, lessonsRoutes, attendanceRoutes;
let homeworkRoutes, filesRoutes, coinsRoutes, notificationsRoutes, reelsRoutes, paymentsRoutes;

if (USE_POSTGRES) {
  // PostgreSQL routes
  authRoutes = (await import('./routes/auth-postgres.js')).default;
  studentsRoutes = (await import('./routes/students-postgres.js')).default; // ✅ PostgreSQL students
  notificationsRoutes = (await import('./routes/notifications-postgres.js')).default; // ✅ PostgreSQL notifications
  // Boshqa route'lar hozircha NeDB'dan (keyinchalik migration)
  usersRoutes = (await import('./routes/users.js')).default;
  teachersRoutes = (await import('./routes/teachers.js')).default;
  coursesRoutes = (await import('./routes/courses.js')).default;
  roomsRoutes = (await import('./routes/rooms.js')).default;
  groupsRoutes = (await import('./routes/groups.js')).default;
  studentGroupRoutes = (await import('./routes/studentGroup.js')).default;
  lessonsRoutes = (await import('./routes/lessons.js')).default;
  attendanceRoutes = (await import('./routes/attendance.js')).default;
  homeworkRoutes = (await import('./routes/homework.js')).default;
  filesRoutes = (await import('./routes/files.js')).default;
  coinsRoutes = (await import('./routes/coins.js')).default;
  reelsRoutes = (await import('./routes/reels.js')).default;
  paymentsRoutes = (await import('./routes/payments.js')).default;
} else {
  // NeDB routes
  authRoutes = (await import('./routes/auth.js')).default;
  usersRoutes = (await import('./routes/users.js')).default;
  studentsRoutes = (await import('./routes/students.js')).default;
  teachersRoutes = (await import('./routes/teachers.js')).default;
  coursesRoutes = (await import('./routes/courses.js')).default;
  roomsRoutes = (await import('./routes/rooms.js')).default;
  groupsRoutes = (await import('./routes/groups.js')).default;
  studentGroupRoutes = (await import('./routes/studentGroup.js')).default;
  lessonsRoutes = (await import('./routes/lessons.js')).default;
  attendanceRoutes = (await import('./routes/attendance.js')).default;
  homeworkRoutes = (await import('./routes/homework.js')).default;
  filesRoutes = (await import('./routes/files.js')).default;
  coinsRoutes = (await import('./routes/coins.js')).default;
  notificationsRoutes = (await import('./routes/notifications.js')).default;
  reelsRoutes = (await import('./routes/reels.js')).default;
  paymentsRoutes = (await import('./routes/payments.js')).default;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3002;

// Papkalarni yaratish
['uploads/photos', 'uploads/videos', 'uploads/homeworks', 'uploads/receipts', 'data'].forEach(dir => {
  mkdirSync(join(__dirname, '..', dir), { recursive: true });
});

const app = express();

// CORS configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow all origins in production (you can restrict later)
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://maktab287.netlify.app',
      'https://287-maktab.netlify.app',
      'https://287-maktab-backend.netlify.app',
      'https://two87-maktab-backend.netlify.app',  // Frontend Netlify URL
      /\.netlify\.app$/,  // All Netlify apps
      /\.onrender\.com$/  // All Render apps
    ];
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') return origin === allowed;
      if (allowed instanceof RegExp) return allowed.test(origin);
      return false;
    });
    
    if (isAllowed || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow anyway for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
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
api.use('/reels',         reelsRoutes);
api.use('/payments',      paymentsRoutes);  // ✅ Yangi: Payment tizimi
api.use('/subscription',  paymentsRoutes);  // /subscription ham payments route dan

// Homework ikki prefix bilan:
//   /homework/all, /homework/:groupId, /homework/:id  → prefix: /homework
//   /group/:groupId/homework/:homeworkId/results     → prefix: / (root)
//   /group/:groupId/homework/:homeworkId/check       → prefix: / (root)
api.use('/homework', homeworkRoutes);
// group/ prefiksli endpointlar uchun alohida router
import groupHomeworkRouter from './routes/groupHomework.js';
api.use('/', groupHomeworkRouter);

// ===== TELEGRAM-STYLE CHAT ROUTES (PostgreSQL only) =====
if (USE_POSTGRES) {
  const chatGroupsRoutes = (await import('./routes/chat-groups.js')).default;
  const chatMessagesRoutes = (await import('./routes/chat-messages.js')).default;
  api.use('/chat-groups', chatGroupsRoutes);
  api.use('/chat-messages', chatMessagesRoutes);
  console.log('✅ Chat routes loaded (PostgreSQL)');
}

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
