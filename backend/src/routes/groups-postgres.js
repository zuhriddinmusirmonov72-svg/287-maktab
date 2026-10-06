import { Router } from 'express';
import { pool } from '../db-postgres.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Helper function to build group with related data
async function buildGroup(group) {
  if (!group) return null;
  
  const client = await pool.connect();
  try {
    // Course name
    let courseName = null;
    if (group.course_id) {
      const courseRes = await client.query('SELECT name FROM courses WHERE id = $1', [group.course_id]);
      courseName = courseRes.rows[0]?.name || null;
    }

    // Teacher info
    let teacherName = null;
    let teacherPhoto = null;
    if (group.teacher_id) {
      const teacherRes = await client.query('SELECT full_name, photo FROM teachers WHERE id = $1', [group.teacher_id]);
      teacherName = teacherRes.rows[0]?.full_name || null;
      teacherPhoto = teacherRes.rows[0]?.photo || null;
    }

    // Room name
    let roomName = null;
    if (group.room_id) {
      const roomRes = await client.query('SELECT name FROM rooms WHERE id = $1', [group.room_id]);
      roomName = roomRes.rows[0]?.name || null;
    }

    // Student count
    const countRes = await client.query(
      'SELECT COUNT(*) FROM student_group WHERE group_id = $1',
      [group.id]
    );
    const studentCount = parseInt(countRes.rows[0]?.count || 0);

    return {
      ...group,
      course_name: courseName,
      teacher_name: teacherName,
      teacher_photo: teacherPhoto,
      room_name: roomName,
      student_count: studentCount,
    };
  } finally {
    client.release();
  }
}

// GET /groups/all - Barcha guruhlar
router.get('/all', async (req, res) => {
  try {
    const { groupName } = req.query;
    
    let query = 'SELECT * FROM groups WHERE is_archived = false';
    let params = [];
    
    if (groupName) {
      query += ' AND name ILIKE $1';
      params.push(`%${groupName}%`);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    const groups = await Promise.all(result.rows.map(g => buildGroup(g)));
    
    res.json({ success: true, data: groups });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /groups/archive - Arxivlangan guruhlar
router.get('/archive', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM groups WHERE is_archived = true ORDER BY created_at DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /groups/one/students/:groupId - Guruh talabalari
router.get('/one/students/:groupId', async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    
    const result = await pool.query(`
      SELECT s.* 
      FROM students s
      INNER JOIN student_group sg ON s.id = sg.student_id
      WHERE sg.group_id = $1 AND s.is_archived = false
      ORDER BY s.full_name
    `, [groupId]);
    
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /groups/one/:id - Bitta guruh
router.get('/one/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM groups WHERE id = $1',
      [parseInt(req.params.id)]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Guruh topilmadi' });
    }
    
    const group = await buildGroup(result.rows[0]);
    res.json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /groups/:groupId/schedules - Guruh jadvali
router.get('/:groupId/schedules', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT days, start_time, end_time, start_date FROM groups WHERE id = $1',
      [parseInt(req.params.groupId)]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Guruh topilmadi' });
    }
    
    const g = result.rows[0];
    res.json({
      success: true,
      data: {
        days: g.days || 'odd',
        start_time: g.start_time || '09:00',
        end_time: g.end_time || '11:00',
        start_date: g.start_date || null,
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /groups/:groupId/lessons - Guruh darslari
router.get('/:groupId/lessons', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM lessons WHERE group_id = $1 ORDER BY lesson_date',
      [parseInt(req.params.groupId)]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /groups/:groupId/lessons/all - Guruh darslari (status bilan)
router.get('/:groupId/lessons/all', async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user.id;
    const role = req.user.role;

    const lessonsRes = await pool.query(
      'SELECT * FROM lessons WHERE group_id = $1 ORDER BY lesson_date',
      [groupId]
    );

    let student = null;
    if (role === 'STUDENT') {
      const studentRes = await pool.query(
        'SELECT * FROM students WHERE user_id = $1',
        [userId]
      );
      student = studentRes.rows[0] || null;
    }

    const result = await Promise.all(lessonsRes.rows.map(async lesson => {
      // Video count
      const filesRes = await pool.query(
        'SELECT COUNT(*) FROM files WHERE lesson_id = $1',
        [lesson.id]
      );
      const videoCount = parseInt(filesRes.rows[0]?.count || 0);

      // Homework
      const hwRes = await pool.query(
        'SELECT * FROM homeworks WHERE lesson_id = $1',
        [lesson.id]
      );
      const hw = hwRes.rows[0] || null;

      let homeworkStatus = 'Berilmagan';
      if (hw && student) {
        const answerRes = await pool.query(
          'SELECT status FROM homework_answers WHERE homework_id = $1 AND student_id = $2',
          [hw.id, student.id]
        );
        const answer = answerRes.rows[0];
        
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
        videoCount,
        status: homeworkStatus,
        homework: hw ? { id: hw.id, title: hw.title } : null,
      };
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /groups/:groupId/lessons/:lessonId/homeworks
router.get('/:groupId/lessons/:lessonId/homeworks', async (req, res) => {
  try {
    const { lessonId } = req.params;
    
    const hwRes = await pool.query(
      'SELECT * FROM homeworks WHERE lesson_id = $1',
      [parseInt(lessonId)]
    );
    
    if (hwRes.rows.length === 0) {
      return res.json({ success: true, data: null });
    }
    
    const hw = hwRes.rows[0];
    
    const studentRes = await pool.query(
      'SELECT * FROM students WHERE user_id = $1',
      [req.user.id]
    );
    const student = studentRes.rows[0] || null;
    
    let answer = null;
    if (student) {
      const answerRes = await pool.query(
        'SELECT * FROM homework_answers WHERE homework_id = $1 AND student_id = $2',
        [hw.id, student.id]
      );
      answer = answerRes.rows[0] || null;
    }
    
    res.json({ success: true, data: { homework: hw, answer, result: null } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /groups/:groupId/lessons/:lessonId/videos
router.get('/:groupId/lessons/:lessonId/videos', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM files WHERE group_id = $1 AND lesson_id = $2',
      [parseInt(req.params.groupId), parseInt(req.params.lessonId)]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /groups/:groupId/lesson?date=
router.get('/:groupId/lesson', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM lessons WHERE group_id = $1 AND lesson_date = $2',
      [parseInt(req.params.groupId), req.query.date]
    );
    res.json({ success: true, data: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /groups/:groupId/lesson - Yangi dars yaratish
router.post('/:groupId/lesson', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { topic, description, lesson_date, attendances } = req.body;
    const groupId = parseInt(req.params.groupId);
    
    if (!topic) {
      return res.status(400).json({ message: 'Mavzu kiritilishi shart' });
    }

    // Lesson yaratish
    const lessonRes = await client.query(
      `INSERT INTO lessons (group_id, topic, description, lesson_date) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [groupId, topic, description || null, lesson_date || null]
    );
    
    const lesson = lessonRes.rows[0];

    // Davomat qo'shish (agar mavjud bo'lsa)
    if (Array.isArray(attendances)) {
      for (const a of attendances) {
        await client.query(
          `INSERT INTO attendance (lesson_id, group_id, student_id, is_present, date) 
           VALUES ($1, $2, $3, $4, $5)`,
          [lesson.id, groupId, a.student_id, !!a.isPresent, lesson_date || null]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: lesson });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
});

// GET /groups/:groupId - Guruh ma'lumotlari
router.get('/:groupId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM groups WHERE id = $1',
      [parseInt(req.params.groupId)]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Guruh topilmadi' });
    }
    
    const group = await buildGroup(result.rows[0]);
    res.json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /groups - Yangi guruh yaratish
router.post('/', async (req, res) => {
  try {
    const { 
      name, course_id, room_id, max_student = 20, 
      days = 'odd', start_time = '09:00', end_time = '11:00', 
      start_date, end_date 
    } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Guruh nomi kiritilishi shart' });
    }

    // Teacher ID
    const teacher_id = req.body.teacher_id ||
      (Array.isArray(req.body.teachers) && req.body.teachers.length > 0 ? parseInt(req.body.teachers[0]) : null);

    // Days
    const daysVal = req.body.week_day?.join?.(',') || req.body.days || days;

    const result = await pool.query(
      `INSERT INTO groups (name, course_id, teacher_id, room_id, max_student, days, start_time, end_time, start_date, is_archived) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        name, 
        course_id ? parseInt(course_id) : null, 
        teacher_id, 
        room_id ? parseInt(room_id) : null, 
        parseInt(max_student), 
        daysVal, 
        start_time, 
        end_time, 
        start_date || null, 
        false
      ]
    );

    const group = await buildGroup(result.rows[0]);
    res.status(201).json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /groups/:id - Guruhni tahrirlash
router.patch('/:id', async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const { name, course_id, teacher_id, room_id, max_student, days, start_time, end_time, start_date, end_date, status } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (course_id !== undefined) {
      updates.push(`course_id = $${paramCount++}`);
      values.push(course_id ? parseInt(course_id) : null);
    }
    if (teacher_id !== undefined) {
      updates.push(`teacher_id = $${paramCount++}`);
      values.push(teacher_id ? parseInt(teacher_id) : null);
    }
    if (room_id !== undefined) {
      updates.push(`room_id = $${paramCount++}`);
      values.push(room_id ? parseInt(room_id) : null);
    }
    if (max_student !== undefined) {
      updates.push(`max_student = $${paramCount++}`);
      values.push(parseInt(max_student));
    }
    if (days) {
      updates.push(`days = $${paramCount++}`);
      values.push(days);
    }
    if (start_time) {
      updates.push(`start_time = $${paramCount++}`);
      values.push(start_time);
    }
    if (end_time) {
      updates.push(`end_time = $${paramCount++}`);
      values.push(end_time);
    }
    if (start_date !== undefined) {
      updates.push(`start_date = $${paramCount++}`);
      values.push(start_date || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'Hech qanday o\'zgartirish yo\'q' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(groupId);

    const result = await pool.query(
      `UPDATE groups SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Guruh topilmadi' });
    }

    const group = await buildGroup(result.rows[0]);
    res.json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /groups/:id - Guruhni arxivlash
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(
      'UPDATE groups SET is_archived = true WHERE id = $1',
      [parseInt(req.params.id)]
    );
    res.json({ success: true, message: 'Guruh arxivlandi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
