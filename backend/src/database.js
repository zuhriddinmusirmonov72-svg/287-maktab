import Datastore from '@seald-io/nedb';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_DIR = join(__dirname, '..', 'data');
mkdirSync(DB_DIR, { recursive: true });

const make = (name) => new Datastore({ filename: join(DB_DIR, `${name}.db`), autoload: true });

export const collections = {
  users:           make('users'),
  rooms:           make('rooms'),
  courses:         make('courses'),
  teachers:        make('teachers'),
  students:        make('students'),
  groups:          make('groups'),
  studentGroup:    make('student_group'),
  lessons:         make('lessons'),
  attendance:      make('attendance'),
  homeworks:       make('homeworks'),
  homeworkAnswers: make('homework_answers'),
  files:           make('files'),
  notifications:   make('notifications'),
  otpCodes:        make('otp_codes'),
  // 💳 Payment tizimi
  payments:        make('payments'),
  receipts:        make('receipts'),
  subscriptions:   make('subscriptions'),
};

// Promisify helpers
export const db = {
  find:    (col, query = {}) => new Promise((res, rej) => col.find(query).sort({ createdAt: -1 }).exec((e, d) => e ? rej(e) : res(d))),
  findOne: (col, query)       => new Promise((res, rej) => col.findOne(query, (e, d) => e ? rej(e) : res(d))),
  insert:  (col, doc)         => new Promise((res, rej) => col.insert({ ...doc, createdAt: new Date().toISOString() }, (e, d) => e ? rej(e) : res(d))),
  update:  (col, query, upd)  => new Promise((res, rej) => col.update(query, { $set: upd }, { returnUpdatedDocs: true }, (e, _, d) => e ? rej(e) : res(d))),
  remove:  (col, query)       => new Promise((res, rej) => col.remove(query, { multi: true }, (e, n) => e ? rej(e) : res(n))),
  count:   (col, query = {})  => new Promise((res, rej) => col.count(query, (e, n) => e ? rej(e) : res(n))),
};

// Auto-increment helper
export async function nextId(col) {
  const all = await db.find(col, {});
  if (all.length === 0) return 1;
  const max = Math.max(...all.map(x => x.id || 0));
  return max + 1;
}

export async function initDB() {
  // SUPER ADMIN - har doim tekshir, yo'q bo'lsa qo'sh
  const superAdminExists = await db.findOne(collections.users, { phone: '975661099' });
  if (!superAdminExists) {
    const allUsers = await db.find(collections.users, {});
    const maxId = allUsers.length > 0 ? Math.max(...allUsers.map(u => u.id || 0)) : 0;
    await db.insert(collections.users, {
      id: maxId + 1,
      phone: '975661099',
      password: bcrypt.hashSync('Mohidil', 10),
      role: 'SUPER ADMIN',
      full_name: 'Super Admin'
    });
    console.log('✅ SUPER ADMIN yaratildi: 975661099 / Mohidil');
  }

  const count = await db.count(collections.users);
  // Faqat bitta user bo'lsa (SUPER ADMIN), seed data yukla
  if (count > 1) return;

  console.log('📦 Seed ma\'lumotlar yuklanmoqda...');

  // Users
  // 🔐 MAXSUS SUPER ADMIN - Mohidil
  const superAdmin = await db.insert(collections.users, { 
    id: 1, 
    phone: '998975661099', 
    password: bcrypt.hashSync('Mohidil', 10), 
    role: 'SUPER ADMIN',
    full_name: 'Mohidil (Super Admin)'
  });
  
  // Default users (test uchun)
  const u1 = await db.insert(collections.users, { id: 2, phone: '998901234567', password: bcrypt.hashSync('admin123', 10), role: 'ADMIN', full_name: 'Admin Test' });
  const u2 = await db.insert(collections.users, { id: 3, phone: '998901234568', password: bcrypt.hashSync('teacher123', 10), role: 'TEACHER', full_name: 'O\'qituvchi Test' });
  const u3 = await db.insert(collections.users, { id: 4, phone: '998901234569', password: bcrypt.hashSync('student123', 10), role: 'STUDENT', full_name: 'O\'quvchi Test' });

  // Rooms
  await db.insert(collections.rooms, { id: 1, name: '1-xona', capacity: 25, is_archived: false });
  await db.insert(collections.rooms, { id: 2, name: '2-xona', capacity: 20, is_archived: false });

  // Courses
  await db.insert(collections.courses, { id: 1, name: 'Frontend', description: 'React, JavaScript', duration: 6, price: 1200000, is_archived: false });
  await db.insert(collections.courses, { id: 2, name: 'Backend', description: 'Node.js, NestJS', duration: 6, price: 1200000, is_archived: false });

  // Teachers
  await db.insert(collections.teachers, { id: 1, user_id: 3, full_name: 'Sardor Usmonov', phone: '998901234568', subject: 'Frontend', photo: null, is_archived: false });

  // Students
  await db.insert(collections.students, { id: 1, user_id: 4, full_name: 'Jahongir Karimov', phone: '998901234569', photo: null, is_archived: false, coins: 0, xp: 0 });

  // Groups
  await db.insert(collections.groups, { id: 1, name: 'Frontend-1', course_id: 1, teacher_id: 1, room_id: 1, max_student: 20, days: 'odd', start_time: '09:00', end_time: '11:00', start_date: '2026-01-01', is_archived: false });

  // Student → Group
  await db.insert(collections.studentGroup, { id: 1, student_id: 1, group_id: 1 });

  // Lessons
  await db.insert(collections.lessons, { id: 1, group_id: 1, topic: 'HTML & CSS asoslari', lesson_date: '2026-07-01' });
  await db.insert(collections.lessons, { id: 2, group_id: 1, topic: 'JavaScript kirish', lesson_date: '2026-07-03' });

  // Homework
  await db.insert(collections.homeworks, { id: 1, lesson_id: 1, group_id: 1, title: 'HTML jadval yaratish', description: 'table, tr, td elementlaridan foydalaning' });

  console.log('✅ Seed ma\'lumotlar yuklandi!');
  console.log('');
  console.log('� ═══════════════════════════════════════════');
  console.log('👑 SUPER ADMIN: 975661099 / Mohidil');
  console.log('🔐 ═══════════════════════════════════════════');
  console.log('');
  console.log('📝 Test login ma\'lumotlari:');
  console.log('👤 ADMIN:    998901234567 / admin123');
  console.log('👤 TEACHER:  998901234568 / teacher123');
  console.log('👤 STUDENT:  998901234569 / student123');
  console.log('');
}
