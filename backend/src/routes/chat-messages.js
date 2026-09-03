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
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    // Allow images, videos, documents, audio
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/x-m4a',
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

const router = Router();

// =============================================
// 📋 GET MESSAGES (Paginated)
// =============================================
router.get('/:groupId', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 50, before_id } = req.query;
    const userId = req.user.id;
    
    // Check if user is member
    const memberCheck = await query(
      'SELECT * FROM chat_group_members WHERE chat_group_id = $1 AND user_id = $2',
      [groupId, userId]
    );
    
    if (memberCheck.rows.length === 0) {
      // Auto-join
      await query(
        'INSERT INTO chat_group_members (chat_group_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (chat_group_id, user_id) DO NOTHING',
        [groupId, userId, 'member']
      );
    }
    
    // Get messages
    let messagesQuery = `
      SELECT 
        cm.*,
        u.full_name as sender_name,
        u.role as sender_role,
        COALESCE(s.photo, t.photo) as sender_photo,
        (
          SELECT json_build_object(
            'id', rm.id,
            'content', rm.content,
            'sender_name', ru.full_name
          )
          FROM chat_messages rm
          JOIN users ru ON rm.sender_id = ru.id
          WHERE rm.id = cm.reply_to_id
        ) as reply_to,
        (
          SELECT json_agg(
            json_build_object(
              'emoji', mr.emoji,
              'count', (SELECT COUNT(*) FROM message_reactions WHERE message_id = cm.id AND emoji = mr.emoji),
              'users', (SELECT json_agg(u2.full_name) FROM message_reactions mr2 JOIN users u2 ON mr2.user_id = u2.id WHERE mr2.message_id = cm.id AND mr2.emoji = mr.emoji)
            )
          )
          FROM (
            SELECT DISTINCT emoji FROM message_reactions WHERE message_id = cm.id
          ) mr
        ) as reactions
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN teachers t ON u.id = t.user_id
      WHERE cm.chat_group_id = $1 AND cm.is_deleted = false
    `;
    
    const params = [groupId];
    
    if (before_id) {
      messagesQuery += ` AND cm.id < $2`;
      params.push(before_id);
    }
    
    messagesQuery += ` ORDER BY cm.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const result = await query(messagesQuery, params);
    
    // Update last read
    if (result.rows.length > 0) {
      const latestMessageId = result.rows[0].id;
      await query(`
        INSERT INTO unread_messages (chat_group_id, user_id, last_read_message_id, unread_count)
        VALUES ($1, $2, $3, 0)
        ON CONFLICT (chat_group_id, user_id) 
        DO UPDATE SET 
          last_read_message_id = $3,
          unread_count = 0,
          updated_at = CURRENT_TIMESTAMP
      `, [groupId, userId, latestMessageId]);
    }
    
    res.json({ 
      success: true, 
      data: result.rows.reverse(), // Reverse to show oldest first
      hasMore: result.rows.length === parseInt(limit)
    });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// ✉️ SEND MESSAGE
// =============================================
router.post('/:groupId', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content, message_type, reply_to_id } = req.body;
    const userId = req.user.id;
    
    // Check if user is member
    const memberCheck = await query(
      'SELECT * FROM chat_group_members WHERE chat_group_id = $1 AND user_id = $2',
      [groupId, userId]
    );
    
    if (memberCheck.rows.length === 0) {
      // Auto-join
      await query(
        'INSERT INTO chat_group_members (chat_group_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (chat_group_id, user_id) DO NOTHING',
        [groupId, userId, 'member']
      );
    }
    
    let fileUrl = null;
    let fileName = null;
    let fileSize = null;
    
    if (req.file) {
      fileUrl = `/uploads/chat/${req.file.filename}`;
      fileName = req.file.originalname;
      fileSize = req.file.size;
    }
    
    // Insert message
    const result = await query(`
      INSERT INTO chat_messages (
        chat_group_id, 
        sender_id, 
        content, 
        message_type, 
        file_url, 
        file_name, 
        file_size,
        reply_to_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      groupId, 
      userId, 
      content || null, 
      message_type || 'text', 
      fileUrl, 
      fileName, 
      fileSize,
      reply_to_id || null
    ]);
    
    const message = result.rows[0];
    
    // Get sender info
    const senderResult = await query(`
      SELECT 
        u.full_name,
        u.role,
        COALESCE(s.photo, t.photo) as photo
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN teachers t ON u.id = t.user_id
      WHERE u.id = $1
    `, [userId]);
    
    message.sender_name = senderResult.rows[0]?.full_name;
    message.sender_role = senderResult.rows[0]?.role;
    message.sender_photo = senderResult.rows[0]?.photo;
    
    // Increment unread count for other members
    await query(`
      UPDATE unread_messages
      SET unread_count = unread_count + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE chat_group_id = $1 AND user_id != $2
    `, [groupId, userId]);
    
    // TODO: Emit WebSocket event here
    // io.to(`group_${groupId}`).emit('new_message', message);
    
    res.json({ success: true, data: message });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// ✏️ EDIT MESSAGE
// =============================================
router.patch('/:messageId', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    
    // Check if user is sender
    const messageResult = await query(
      'SELECT * FROM chat_messages WHERE id = $1 AND sender_id = $2',
      [messageId, userId]
    );
    
    if (messageResult.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update message
    const result = await query(`
      UPDATE chat_messages
      SET content = $1, is_edited = true, edited_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [content, messageId]);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Edit message error:', err);
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 🗑️ DELETE MESSAGE
// =============================================
router.delete('/:messageId', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    
    // Check if user is sender or admin
    const messageResult = await query(`
      SELECT 
        cm.*,
        cgm.role
      FROM chat_messages cm
      JOIN chat_group_members cgm ON cm.chat_group_id = cgm.chat_group_id AND cgm.user_id = $2
      WHERE cm.id = $1
    `, [messageId, userId]);
    
    if (messageResult.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const message = messageResult.rows[0];
    const isOwner = message.sender_id === userId;
    const isAdmin = message.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Soft delete
    await query(`
      UPDATE chat_messages
      SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP, content = NULL
      WHERE id = $1
    `, [messageId]);
    
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    console.error('Delete message error:', err);
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 😊 ADD REACTION
// =============================================
router.post('/:messageId/reactions', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;
    
    if (!emoji) {
      return res.status(400).json({ message: 'Emoji required' });
    }
    
    // Check if message exists
    const messageCheck = await query('SELECT * FROM chat_messages WHERE id = $1', [messageId]);
    if (messageCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Add or remove reaction (toggle)
    const existingReaction = await query(
      'SELECT * FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
      [messageId, userId, emoji]
    );
    
    if (existingReaction.rows.length > 0) {
      // Remove reaction
      await query(
        'DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
        [messageId, userId, emoji]
      );
      res.json({ success: true, action: 'removed' });
    } else {
      // Add reaction
      await query(
        'INSERT INTO message_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)',
        [messageId, userId, emoji]
      );
      res.json({ success: true, action: 'added' });
    }
  } catch (err) {
    console.error('Reaction error:', err);
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 📌 PIN MESSAGE (Admin only)
// =============================================
router.post('/:messageId/pin', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    
    // Get message and check admin
    const messageResult = await query(`
      SELECT 
        cm.chat_group_id,
        cgm.role
      FROM chat_messages cm
      JOIN chat_group_members cgm ON cm.chat_group_id = cgm.chat_group_id AND cgm.user_id = $2
      WHERE cm.id = $1
    `, [messageId, userId]);
    
    if (messageResult.rows.length === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    if (messageResult.rows[0].role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const groupId = messageResult.rows[0].chat_group_id;
    
    // Pin message
    await query(`
      INSERT INTO pinned_messages (chat_group_id, message_id, pinned_by)
      VALUES ($1, $2, $3)
      ON CONFLICT (chat_group_id, message_id) DO NOTHING
    `, [groupId, messageId, userId]);
    
    res.json({ success: true, message: 'Message pinned' });
  } catch (err) {
    console.error('Pin message error:', err);
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 📍 GET PINNED MESSAGES
// =============================================
router.get('/:groupId/pinned', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    
    // Check if user is member
    const memberCheck = await query(
      'SELECT * FROM chat_group_members WHERE chat_group_id = $1 AND user_id = $2',
      [groupId, userId]
    );
    
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get pinned messages
    const result = await query(`
      SELECT 
        cm.*,
        u.full_name as sender_name,
        pm.created_at as pinned_at
      FROM pinned_messages pm
      JOIN chat_messages cm ON pm.message_id = cm.id
      JOIN users u ON cm.sender_id = u.id
      WHERE pm.chat_group_id = $1
      ORDER BY pm.created_at DESC
    `, [groupId]);
    
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get pinned messages error:', err);
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 🔍 SEARCH MESSAGES
// =============================================
router.get('/:groupId/search', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { q } = req.query;
    const userId = req.user.id;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query required' });
    }
    
    // Check if user is member
    const memberCheck = await query(
      'SELECT * FROM chat_group_members WHERE chat_group_id = $1 AND user_id = $2',
      [groupId, userId]
    );
    
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Search messages
    const result = await query(`
      SELECT 
        cm.*,
        u.full_name as sender_name
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      WHERE cm.chat_group_id = $1 
        AND cm.is_deleted = false
        AND cm.content ILIKE $2
      ORDER BY cm.created_at DESC
      LIMIT 50
    `, [groupId, `%${q}%`]);
    
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Search messages error:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
