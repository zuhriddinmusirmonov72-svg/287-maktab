import { Router } from 'express';
import { db, collections, nextId } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

async function buildGroup(g) {
  if (!g) return null;
  const courses  = await db.find(collections.courses, {});
  const teachers = await db.find(collections.teachers, {});
  const rooms    = await db.find(collections.rooms, {});
  const sgs      = await db.find(collections.studentGroup, { group_id: g.id });
  return {
    ...g,
    course_name:   courses.find(c => c.id === g.course_id)?.name,
    teacher_name:  teachers.find(t => t.id === g.teacher_id)?.full_name,
    teacher_photo: teachers.find(t => t.id === g.teacher_id)?.photo,
    room_name:     rooms.find(r => r.id === g.room_id)?.name,
    student_count: sgs.length,
  };
}

// GET /groups/all
router.get('/all', async (req, res) => {
  try {
    const { groupName } = req.query;
    let groups = await db.find(collections.groups, { is_archived: false });
    if (groupName) groups = groups.filter(g => g.name.toLowerCase().includes(groupName.toLowerCase()));
    const result = await Promise.all(groups.map(buildGroup));
    res.json({ success: true, data: result });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /groups/archive
router.get('/archive', async (req, res) => {
  const groups = await db.find(collections.groups, { is_archived: true });
  res.json({ success: true, data: groups });
});

// GET /groups/one/students/:groupId  — IMPORTANT: bu one/:id dan OLDIN bo'lishi kerak
router.get('/one/students/:groupId', async (req, res) => {
  try {
    const sgs = await db.find(collections.studentGroup, { group_id: +req.params.groupId });
    const studentIds = sgs.map(sg => sg.student_id);
    const students = await db.find(collections.students, { id: { $in: studentIds }, is_archived: false });
    res.json({ success: true, data: students });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /groups/one/:id
router.get('/one/:id', async (req, res) => {
  const g = await db.findOne(collections.groups, { id: +req.params.id });
  if (!g) return res.status(404).json({ message: 'Guruh topilmadi' });
  res.json({ success: true, data: await buildGroup(g) });
});

// GET /groups/:groupId/schedules
router.get('/:groupId/schedules', async (req, res) => {
  const g = await db.findOne(collections.groups, { id: +req.params.groupId });
  if (!g) return res.status(404).json({ message: 'Guruh topilmadi' });
  res.json({
    success: true,
    data: {
      days:       g.days       || 'odd',
      start_time: g.start_time || '09:00',
      end_time:   g.end_time   || '11:00',
      start_date: g.start_date || null,
    }
  });
});

// GET /groups/:groupId/lessons  (oddiy ro'yxat)
router.get('/:groupId/lessons', async (req, res) => {
  const lessons = await db.find(collections.lessons, { group_id: +req.params.groupId });
  const sorted = lessons.sort((a, b) => (a.lesson_date || '').localeCompare(b.lesson_date || ''));
  res.json({ success: true, data: sorted });
});

// GET /groups/:groupId/lessons/all  — status bilan
router.get('/:groupId/lessons/all', async (req, res) => {
  try {
    const groupId = +req.params.groupId;
    const userId = req.user.id;
    const role = req.user.role;

    const lessons = await db.find(collections.lessons, { group_id: groupId });
    const sorted = lessons.sort((a, b) => (a.lesson_date || '').localeCompare(b.lesson_date || ''));

    let student = null;
    if (role === 'student') {
      student = await db.findOne(collections.students, { user_id: userId });
    }

    const result = await Promise.all(sorted.map(async lesson => {
      const files = await db.find(collections.files, { lesson_id: lesson.id });
      // videoCount: faqat shu darsga tegishli fayllar
      const videoCount = files.filter(f => f.lesson_id === lesson.id).length;
      const hw = await db.findOne(collections.homeworks, { lesson_id: lesson.id });

      let homeworkStatus = 'Berilmagan';
      if (hw && student) {
        const answer = await db.findOne(collections.homeworkAnswers, { homework_id: hw.id, student_id: student.id });
        if (answer) {
          if (answer.status === 'ACCEPTED') homeworkStatus = 'Qabul qilingan';
          else if (answer.status === 'REJECTED') homeworkStatus = 'Qaytarilgan';
          else homeworkStatus = 'Kutilmoqda';
        } else {
          homeworkStatus = 'Bajarilmagan';
        }
      } else if (hw) {
        homeworkStatus = 'Berilgan';
      }

      return {
        ...lesson,
        videoCount: videoCount,
        status: homeworkStatus,
        homework: hw ? { id: hw.id, title: hw.title } : null,
      };
    }));

    res.json({ success: true, data: result });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /groups/:groupId/lessons/:lessonId/homeworks
router.get('/:groupId/lessons/:lessonId/homeworks', async (req, res) => {
  try {
    const { groupId, lessonId } = req.params;
    const hw = await db.findOne(collections.homeworks, { lesson_id: +lessonId, group_id: +groupId });
    if (!hw) return res.json({ success: true, data: null });

    const student = await db.findOne(collections.students, { user_id: req.user.id });
    let answer = null;
    if (student) {
      answer = await db.findOne(collections.homeworkAnswers, { homework_id: hw.id, student_id: student.id });
    }
    res.json({ success: true, data: { homework: hw, answer: answer || null, result: null } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /groups/:groupId/lessons/:lessonId/videos
router.get('/:groupId/lessons/:lessonId/videos', async (req, res) => {
  const videos = await db.find(collections.files, { group_id: +req.params.groupId, lesson_id: +req.params.lessonId });
  res.json({ success: true, data: videos });
});

// GET /groups/:groupId/lesson?date=
router.get('/:groupId/lesson', async (req, res) => {
  const lesson = await db.findOne(collections.lessons, { group_id: +req.params.groupId, lesson_date: req.query.date });
  res.json({ success: true, data: lesson || null });
});

// POST /groups/:groupId/lesson
router.post('/:groupId/lesson', async (req, res) => {
  try {
    const { topic, description, lesson_date, attendances } = req.body;
    if (!topic) return res.status(400).json({ message: 'Mavzu kiritilishi shart' });
    const id = await nextId(collections.lessons);
    const lesson = await db.insert(collections.lessons, { id, group_id: +req.params.groupId, topic, description, lesson_date });

    if (Array.isArray(attendances)) {
      for (const a of attendances) {
        const aid = await nextId(collections.attendance);
        await db.insert(collections.attendance, { id: aid, lesson_id: id, group_id: +req.params.groupId, student_id: a.student_id, is_present: !!a.isPresent });
      }
    }
    res.status(201).json({ success: true, data: lesson });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /groups/:groupId
router.get('/:groupId', async (req, res) => {
  const g = await db.findOne(collections.groups, { id: +req.params.groupId });
  if (!g) return res.status(404).json({ message: 'Guruh topilmadi' });
  res.json({ success: true, data: await buildGroup(g) });
});

// POST /groups
router.post('/', async (req, res) => {
  try {
    const { name, course_id, room_id, max_student = 20, days = 'odd', start_time = '09:00', end_time = '11:00', start_date, end_date } = req.body;
    if (!name) return res.status(400).json({ message: 'Guruh nomi kiritilishi shart' });

    // teacher_id: to'g'ridan yoki teachers array'dan birinchisini olish
    const teacher_id = req.body.teacher_id ||
      (Array.isArray(req.body.teachers) && req.body.teachers.length > 0 ? +req.body.teachers[0] : null);

    // week_day yoki days
    const daysVal = req.body.week_day?.join?.(',') || req.body.days || days;

    const id = await nextId(collections.groups);
    const g = await db.insert(collections.groups, {
      id, name, course_id: +course_id, teacher_id, room_id: +room_id,
      max_student: +max_student, days: daysVal, start_time, end_time, start_date, end_date,
      is_archived: false
    });
    res.status(201).json({ success: true, data: await buildGroup(g) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /groups/:id
router.patch('/:id', async (req, res) => {
  try {
    const g = await db.findOne(collections.groups, { id: +req.params.id });
    if (!g) return res.status(404).json({ message: 'Guruh topilmadi' });
    const fields = ['name','course_id','teacher_id','room_id','max_student','days','start_time','end_time','start_date','end_date','status'];
    const upd = {};
    fields.forEach(k => { if (req.body[k] !== undefined) upd[k] = req.body[k]; });
    await db.update(collections.groups, { id: +req.params.id }, upd);
    const updated = await db.findOne(collections.groups, { id: +req.params.id });
    res.json({ success: true, data: await buildGroup(updated) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /groups/:id
router.delete('/:id', async (req, res) => {
  await db.update(collections.groups, { id: +req.params.id }, { is_archived: true });
  res.json({ success: true, message: 'Guruh arxivlandi' });
});

export default router;
