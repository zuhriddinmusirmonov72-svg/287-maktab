import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:12345@localhost:5432/maktab287'
});

async function resetAccounts() {
  try {
    await client.connect();
    console.log('✅ PostgreSQL ga ulandi');
    console.log('');

    // 1. Eski accountlarni o'chirish
    console.log('🗑️  Eski test accountlarni o\'chirish...');
    await client.query(`
      DELETE FROM students WHERE user_id IN (
        SELECT id FROM users WHERE phone IN ('998901234568', '998901234569')
      )
    `);
    await client.query(`
      DELETE FROM teachers WHERE user_id IN (
        SELECT id FROM users WHERE phone IN ('998901234568', '998901234569')
      )
    `);
    await client.query(`
      DELETE FROM users WHERE phone IN ('998901234568', '998901234569')
    `);
    console.log('✅ Eski accountlar o\'chirildi');
    console.log('');

    // 2. Teacher yaratish
    console.log('➕ Teacher yaratilmoqda...');
    const teacherHash = bcrypt.hashSync('teacher123', 10);
    const teacherUserResult = await client.query(
      'INSERT INTO users (phone, password, role, full_name) VALUES ($1, $2, $3, $4) RETURNING id',
      ['998901234568', teacherHash, 'TEACHER', 'Test Teacher']
    );
    const teacherUserId = teacherUserResult.rows[0].id;
    
    await client.query(
      'INSERT INTO teachers (user_id, full_name, phone, subject) VALUES ($1, $2, $3, $4)',
      [teacherUserId, 'Test Teacher', '998901234568', 'Programming']
    );
    console.log('✅ Teacher yaratildi:');
    console.log('   📞 Telefon: 998901234568');
    console.log('   🔑 Parol: teacher123');
    console.log('');

    // 3. Student yaratish
    console.log('➕ Student yaratilmoqda...');
    const studentHash = bcrypt.hashSync('student123', 10);
    const studentUserResult = await client.query(
      'INSERT INTO users (phone, password, role, full_name) VALUES ($1, $2, $3, $4) RETURNING id',
      ['998901234569', studentHash, 'STUDENT', 'Test Student']
    );
    const studentUserId = studentUserResult.rows[0].id;
    
    await client.query(
      'INSERT INTO students (user_id, full_name, phone, coins, xp) VALUES ($1, $2, $3, $4, $5)',
      [studentUserId, 'Test Student', '998901234569', 100, 50]
    );
    console.log('✅ Student yaratildi:');
    console.log('   📞 Telefon: 998901234569');
    console.log('   🔑 Parol: student123');
    console.log('');

    // 4. Parollarni test qilish
    console.log('🔐 Parollarni test qilish...');
    const teacherCheck = await client.query('SELECT * FROM users WHERE phone = $1', ['998901234568']);
    const teacherPasswordOk = bcrypt.compareSync('teacher123', teacherCheck.rows[0].password);
    console.log('   Teacher parol:', teacherPasswordOk ? '✅ To\'g\'ri' : '❌ Noto\'g\'ri');
    
    const studentCheck = await client.query('SELECT * FROM users WHERE phone = $1', ['998901234569']);
    const studentPasswordOk = bcrypt.compareSync('student123', studentCheck.rows[0].password);
    console.log('   Student parol:', studentPasswordOk ? '✅ To\'g\'ri' : '❌ Noto\'g\'ri');
    console.log('');

    // 5. Barcha accountlarni ko'rsatish
    console.log('📋 Barcha accountlar:');
    const allUsers = await client.query('SELECT phone, role, full_name FROM users ORDER BY id');
    allUsers.rows.forEach(u => {
      console.log(`   ${u.phone.padEnd(15)} | ${u.role.padEnd(12)} | ${u.full_name}`);
    });
    console.log('');

    console.log('✅✅✅ TAYYOR! Endi login qiling: ✅✅✅');
    console.log('');
    console.log('👑 SUPER ADMIN:');
    console.log('   Telefon: 975661099');
    console.log('   Parol: Mohidil');
    console.log('');
    console.log('👨‍🏫 TEACHER:');
    console.log('   Telefon: 998901234568');
    console.log('   Parol: teacher123');
    console.log('');
    console.log('👨‍🎓 STUDENT:');
    console.log('   Telefon: 998901234569');
    console.log('   Parol: student123');
    console.log('');

  } catch (err) {
    console.error('❌ Xato:', err.message);
  } finally {
    await client.end();
  }
}

resetAccounts();
