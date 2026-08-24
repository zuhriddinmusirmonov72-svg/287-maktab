import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

// Environment variables
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/maktab287';

// PostgreSQL connection pool
export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL error:', err);
});

// =============================================
// 🔧 DATABASE INITIALIZATION
// =============================================
export async function initPostgres() {
  const client = await pool.connect();
  
  try {
    console.log('📦 Creating PostgreSQL tables...');

    // ═══ USERS TABLE ═══
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        full_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ═══ ROOMS TABLE ═══
    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        capacity INTEGER,
        is_archived BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ═══ COURSES TABLE ═══
    await client.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        duration INTEGER,
        price DECIMAL(10, 2),
        is_archived BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ═══ TEACHERS TABLE ═══
    await client.query(`
      CREATE TABLE IF NOT EXISTS teachers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        subject VARCHAR(255),
        photo TEXT,
        is_archived BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ═══ STUDENTS TABLE ═══
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        photo TEXT,
        coins INTEGER DEFAULT 0,
        xp INTEGER DEFAULT 0,
        is_archived BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ═══ GROUPS TABLE ═══
    await client.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
        teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
        room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
        max_student INTEGER,
        days VARCHAR(50),
        start_time VARCHAR(10),
        end_time VARCHAR(10),
        start_date DATE,
        is_archived BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ═══ STUDENT_GROUP (many-to-many) ═══
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_group (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, group_id)
      )
    `);

    // ═══ LESSONS TABLE ═══
    await client.query(`
      CREATE TABLE IF NOT EXISTS lessons (
        id SERIAL PRIMARY KEY,
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        topic VARCHAR(255) NOT NULL,
        description TEXT,
        lesson_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ═══ ATTENDANCE TABLE ═══
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
        is_present BOOLEAN DEFAULT FALSE,
        date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ═══ HOMEWORKS TABLE ═══
    await client.query(`
      CREATE TABLE IF NOT EXISTS homeworks (
        id SERIAL PRIMARY KEY,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ═══ HOMEWORK_ANSWERS TABLE ═══
    await client.query(`
      CREATE TABLE IF NOT EXISTS homework_answers (
        id SERIAL PRIMARY KEY,
        homework_id INTEGER REFERENCES homeworks(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        file TEXT,
        comment TEXT,
        status VARCHAR(50) DEFAULT 'PENDING',
        score INTEGER,
        teacher_comment TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ═══ FILES TABLE ═══
    await client.query(`
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255),
        path TEXT,
        mimetype VARCHAR(100),
        size INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ═══ NOTIFICATIONS TABLE ═══
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255),
        message TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ═══ OTP_CODES TABLE ═══
    await client.query(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ═══ PAYMENTS TABLE ═══
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2),
        plan_type VARCHAR(50),
        transaction_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ═══ RECEIPTS TABLE ═══
    await client.query(`
      CREATE TABLE IF NOT EXISTS receipts (
        id SERIAL PRIMARY KEY,
        payment_id INTEGER REFERENCES payments(id) ON DELETE CASCADE,
        file_path TEXT,
        file_hash VARCHAR(255),
        ai_verification VARCHAR(50),
        ai_confidence VARCHAR(50),
        ai_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ═══ SUBSCRIPTIONS TABLE ═══
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        plan_type VARCHAR(50),
        start_date DATE,
        end_date DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ═══ REELS TABLE ═══
    await client.query(`
      CREATE TABLE IF NOT EXISTS reels (
        id SERIAL PRIMARY KEY,
        uploader_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        uploader_role VARCHAR(50),
        title VARCHAR(255),
        video_path TEXT NOT NULL,
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ═══ REEL_LIKES TABLE ═══
    await client.query(`
      CREATE TABLE IF NOT EXISTS reel_likes (
        id SERIAL PRIMARY KEY,
        reel_id INTEGER REFERENCES reels(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(reel_id, user_id)
      )
    `);

    // ═══ TELEGRAM-STYLE GROUPS CHAT TABLES ═══
    
    // Chat Groups (different from regular groups)
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        avatar TEXT,
        description TEXT,
        type VARCHAR(50) DEFAULT 'group',
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Chat Group Members
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_group_members (
        id SERIAL PRIMARY KEY,
        chat_group_id INTEGER REFERENCES chat_groups(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_online BOOLEAN DEFAULT FALSE,
        last_seen TIMESTAMP,
        UNIQUE(chat_group_id, user_id)
      )
    `);

    // Chat Messages
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        chat_group_id INTEGER REFERENCES chat_groups(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT,
        message_type VARCHAR(50) DEFAULT 'text',
        file_url TEXT,
        file_name VARCHAR(255),
        file_size INTEGER,
        reply_to_id INTEGER REFERENCES chat_messages(id) ON DELETE SET NULL,
        is_edited BOOLEAN DEFAULT FALSE,
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        edited_at TIMESTAMP,
        deleted_at TIMESTAMP
      )
    `);

    // Message Reactions
    await client.query(`
      CREATE TABLE IF NOT EXISTS message_reactions (
        id SERIAL PRIMARY KEY,
        message_id INTEGER REFERENCES chat_messages(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        emoji VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(message_id, user_id, emoji)
      )
    `);

    // Pinned Messages
    await client.query(`
      CREATE TABLE IF NOT EXISTS pinned_messages (
        id SERIAL PRIMARY KEY,
        chat_group_id INTEGER REFERENCES chat_groups(id) ON DELETE CASCADE,
        message_id INTEGER REFERENCES chat_messages(id) ON DELETE CASCADE,
        pinned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(chat_group_id, message_id)
      )
    `);

    // Unread Messages Tracking
    await client.query(`
      CREATE TABLE IF NOT EXISTS unread_messages (
        id SERIAL PRIMARY KEY,
        chat_group_id INTEGER REFERENCES chat_groups(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        last_read_message_id INTEGER REFERENCES chat_messages(id) ON DELETE CASCADE,
        unread_count INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(chat_group_id, user_id)
      )
    `);

    // Typing Indicators (for real-time)
    await client.query(`
      CREATE TABLE IF NOT EXISTS typing_indicators (
        id SERIAL PRIMARY KEY,
        chat_group_id INTEGER REFERENCES chat_groups(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        is_typing BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(chat_group_id, user_id)
      )
    `);

    console.log('✅ PostgreSQL tables created!');

    // ═══ SUPER ADMIN SEED ═══
    const superAdminCheck = await client.query(
      'SELECT * FROM users WHERE phone = $1',
      ['975661099']
    );

    if (superAdminCheck.rows.length === 0) {
      const hashedPassword = bcrypt.hashSync('Mohidil', 10);
      await client.query(
        `INSERT INTO users (phone, password, role, full_name) 
         VALUES ($1, $2, $3, $4)`,
        ['975661099', hashedPassword, 'SUPER ADMIN', 'Super Admin']
      );
      console.log('✅ SUPER ADMIN created: 975661099 / Mohidil');
    }

    // ═══ DEFAULT CHAT GROUP SEED ═══
    const defaultChatCheck = await client.query(
      'SELECT * FROM chat_groups WHERE id = $1',
      [1]
    );

    if (defaultChatCheck.rows.length === 0) {
      await client.query(
        `INSERT INTO chat_groups (id, name, description, type, is_active) 
         VALUES ($1, $2, $3, $4, $5)`,
        [1, '287-Maktab Umumiy Chat', 'Barcha o\'quvchi va o\'qituvchilar uchun umumiy chat', 'group', true]
      );
      console.log('✅ Default chat group created: 287-Maktab Umumiy Chat');
      
      // Reset sequence to avoid ID conflicts
      await client.query(`SELECT setval('chat_groups_id_seq', (SELECT MAX(id) FROM chat_groups))`);
    }

    console.log('');
    console.log('🔐 ═══════════════════════════════════════════');
    console.log('👑 SUPER ADMIN: 975661099 / Mohidil');
    console.log('💬 DEFAULT CHAT: ID=1 (287-Maktab Umumiy Chat)');
    console.log('🔐 ═══════════════════════════════════════════');
    console.log('');

  } catch (error) {
    console.error('❌ Error initializing PostgreSQL:', error);
    throw error;
  } finally {
    client.release();
  }
}

// =============================================
// 🔧 QUERY HELPERS
// =============================================
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

export const getClient = async () => {
  return await pool.connect();
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n📊 Closing PostgreSQL connections...');
  await pool.end();
  console.log('✅ PostgreSQL connections closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n📊 Closing PostgreSQL connections...');
  await pool.end();
  console.log('✅ PostgreSQL connections closed');
  process.exit(0);
});
