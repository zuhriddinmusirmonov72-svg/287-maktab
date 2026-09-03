import { Router } from 'express';
import { query } from '../db-postgres.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// =============================================
// GET MY NOTIFICATIONS
// =============================================
router.get('/my', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all notifications for this user
    const result = await query(`
      SELECT 
        n.*,
        u.full_name as sender_name,
        u.role as sender_role
      FROM notifications n
      LEFT JOIN users u ON n.created_by = u.id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
    `, [userId]);
    
    // Count unread notifications
    const unreadCount = result.rows.filter(n => !n.is_read).length;
    
    res.json({
      success: true,
      data: {
        notifications: result.rows,
        unreadCount
      }
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// =============================================
// MARK AS READ
// =============================================
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Bildirishnoma topilmadi' });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Mark as read error:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// =============================================
// MARK ALL AS READ
// =============================================
router.patch('/read-all', async (req, res) => {
  try {
    const userId = req.user.id;
    
    await query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [userId]
    );
    
    res.json({
      success: true,
      message: 'Barcha bildirishnomalar o\'qilgan deb belgilandi'
    });
  } catch (err) {
    console.error('Mark all as read error:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// =============================================
// DELETE NOTIFICATION
// =============================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Bildirishnoma topilmadi' });
    }
    
    res.json({
      success: true,
      message: 'Bildirishnoma o\'chirildi'
    });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// =============================================
// REGISTER DEVICE TOKEN (for push notifications)
// =============================================
router.post('/device-token', async (req, res) => {
  try {
    const { token, device_type = 'mobile' } = req.body;
    const userId = req.user.id;
    
    if (!token) {
      return res.status(400).json({ message: 'Token kiritilishi shart' });
    }
    
    // Check if token already exists for this user
    const existingToken = await query(
      'SELECT * FROM device_tokens WHERE user_id = $1 AND token = $2',
      [userId, token]
    );
    
    if (existingToken.rows.length > 0) {
      // Update last_used timestamp
      await query(
        'UPDATE device_tokens SET last_used = CURRENT_TIMESTAMP WHERE id = $1',
        [existingToken.rows[0].id]
      );
      
      return res.json({
        success: true,
        message: 'Device token yangilandi'
      });
    }
    
    // Insert new token
    await query(
      `INSERT INTO device_tokens (user_id, token, device_type, is_active)
       VALUES ($1, $2, $3, $4)`,
      [userId, token, device_type, true]
    );
    
    res.json({
      success: true,
      message: 'Device token saqlandi'
    });
  } catch (err) {
    console.error('Register device token error:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// =============================================
// REMOVE DEVICE TOKEN (on logout)
// =============================================
router.delete('/device-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.user.id;
    
    await query(
      'UPDATE device_tokens SET is_active = false WHERE user_id = $1 AND token = $2',
      [userId, token]
    );
    
    res.json({
      success: true,
      message: 'Device token o\'chirildi'
    });
  } catch (err) {
    console.error('Remove device token error:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

export default router;
