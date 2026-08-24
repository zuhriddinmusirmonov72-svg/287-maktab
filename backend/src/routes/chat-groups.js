import { Router } from 'express';
import { query } from '../db-postgres.js';
import { authMiddleware } from '../middleware/auth.js';
import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = join(__dirname, '..', '..', 'uploads', 'chat');
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
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

const router = Router();

// =============================================
// 📋 GET ALL GROUPS (for current user)
// =============================================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get groups where user is a member
    const result = await query(`
      SELECT 
        cg.id,
        cg.name,
        cg.avatar,
        cg.description,
        cg.type,
        cg.created_at,
        cgm.role,
        (SELECT COUNT(*) FROM chat_group_members WHERE chat_group_id = cg.id) as member_count,
        (SELECT COUNT(*) FROM chat_group_members WHERE chat_group_id = cg.id AND is_online = true) as online_count,
        (SELECT content FROM chat_messages WHERE chat_group_id = cg.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM chat_messages WHERE chat_group_id = cg.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
        COALESCE(um.unread_count, 0) as unread_count
      FROM chat_groups cg
      JOIN chat_group_members cgm ON cg.id = cgm.chat_group_id
      LEFT JOIN unread_messages um ON cg.id = um.chat_group_id AND um.user_id = $1
      WHERE cgm.user_id = $1 AND cg.is_active = true
      ORDER BY last_message_time DESC NULLS LAST
    `, [userId]);
    
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get groups error:', err);
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 🔍 SEARCH GROUPS
// =============================================
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query required' });
    }
    
    const result = await query(`
      SELECT 
        cg.id,
        cg.name,
        cg.avatar,
        cg.description,
        cgm.role
      FROM chat_groups cg
      JOIN chat_group_members cgm ON cg.id = cgm.chat_group_id
      WHERE cgm.user_id = $1 
        AND cg.is_active = true
        AND (
          cg.name ILIKE $2 
          OR cg.description ILIKE $2
        )
      ORDER BY cg.name
    `, [userId, `%${q}%`]);
    
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Search groups error:', err);
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 📖 GET GROUP DETAILS
// =============================================
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if user is member
    const memberCheck = await query(
      'SELECT * FROM chat_group_members WHERE chat_group_id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get group details
    const groupResult = await query(`
      SELECT 
        cg.*,
        (SELECT COUNT(*) FROM chat_group_members WHERE chat_group_id = cg.id) as member_count,
        (SELECT COUNT(*) FROM chat_group_members WHERE chat_group_id = cg.id AND is_online = true) as online_count
      FROM chat_groups cg
      WHERE cg.id = $1
    `, [id]);
    
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    const group = groupResult.rows[0];
    group.user_role = memberCheck.rows[0].role;
    
    res.json({ success: true, data: group });
  } catch (err) {
    console.error('Get group details error:', err);
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// ✅ CREATE GROUP (Admin/Teacher only)
// =============================================
router.post('/', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const { name, description, type, member_ids } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Only SUPER ADMIN, ADMIN, TEACHER can create groups
    if (!['SUPER ADMIN', 'ADMIN', 'TEACHER'].includes(userRole)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (!name) {
      return res.status(400).json({ message: 'Group name required' });
    }
    
    const avatarPath = req.file ? `/uploads/chat/${req.file.filename}` : null;
    
    // Create group
    const groupResult = await query(`
      INSERT INTO chat_groups (name, avatar, description, type, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, avatarPath, description || null, type || 'group', userId]);
    
    const group = groupResult.rows[0];
    
    // Add creator as admin
    await query(`
      INSERT INTO chat_group_members (chat_group_id, user_id, role)
      VALUES ($1, $2, $3)
    `, [group.id, userId, 'admin']);
    
    // Add other members
    if (member_ids && Array.isArray(JSON.parse(member_ids))) {
      const memberIds = JSON.parse(member_ids);
      for (const memberId of memberIds) {
        if (memberId !== userId) {
          await query(`
            INSERT INTO chat_group_members (chat_group_id, user_id, role)
            VALUES ($1, $2, $3)
            ON CONFLICT (chat_group_id, user_id) DO NOTHING
          `, [group.id, memberId, 'member']);
        }
      }
    }
    
    res.json({ success: true, data: group });
  } catch (err) {
    console.error('Create group error:', err);
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 📝 UPDATE GROUP
// =============================================
router.patch('/:id', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user.id;
    
    // Check if user is admin
    const memberResult = await query(
      'SELECT role FROM chat_group_members WHERE chat_group_id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (memberResult.rows.length === 0 || memberResult.rows[0].role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const avatarPath = req.file ? `/uploads/chat/${req.file.filename}` : undefined;
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    
    if (avatarPath) {
      updates.push(`avatar = $${paramCount++}`);
      values.push(avatarPath);
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const result = await query(`
      UPDATE chat_groups 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Update group error:', err);
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 👥 GET GROUP MEMBERS
// =============================================
router.get('/:id/members', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if user is member
    const memberCheck = await query(
      'SELECT * FROM chat_group_members WHERE chat_group_id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get members
    const result = await query(`
      SELECT 
        cgm.id,
        cgm.role,
        cgm.joined_at,
        cgm.is_online,
        cgm.last_seen,
        u.id as user_id,
        u.full_name,
        u.phone,
        u.role as user_role,
        COALESCE(s.photo, t.photo) as photo
      FROM chat_group_members cgm
      JOIN users u ON cgm.user_id = u.id
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN teachers t ON u.id = t.user_id
      WHERE cgm.chat_group_id = $1
      ORDER BY 
        CASE cgm.role 
          WHEN 'admin' THEN 1 
          WHEN 'teacher' THEN 2 
          ELSE 3 
        END,
        u.full_name
    `, [id]);
    
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get members error:', err);
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// ➕ ADD MEMBER (Admin only)
// =============================================
router.post('/:id/members', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, role } = req.body;
    const userId = req.user.id;
    
    // Check if current user is admin
    const adminCheck = await query(
      'SELECT role FROM chat_group_members WHERE chat_group_id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    // Add member
    const result = await query(`
      INSERT INTO chat_group_members (chat_group_id, user_id, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (chat_group_id, user_id) DO UPDATE 
      SET role = $3
      RETURNING *
    `, [id, user_id, role || 'member']);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// ❌ REMOVE MEMBER (Admin only)
// =============================================
router.delete('/:id/members/:user_id', authMiddleware, async (req, res) => {
  try {
    const { id, user_id } = req.params;
    const userId = req.user.id;
    
    // Check if current user is admin
    const adminCheck = await query(
      'SELECT role FROM chat_group_members WHERE chat_group_id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    // Remove member
    await query(
      'DELETE FROM chat_group_members WHERE chat_group_id = $1 AND user_id = $2',
      [id, user_id]
    );
    
    res.json({ success: true, message: 'Member removed' });
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
