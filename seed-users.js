// seed-users.js
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'smartshule',
  password: process.env.DB_PASSWORD || 'postgres123',
  port: process.env.DB_PORT || 5432,
});

async function seedUsers() {
  try {
    console.log('🌱 Connecting to database...');
    
    // 1. Generate the hash RIGHT HERE for "Password123"
    const plainPassword = 'Password123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(plainPassword, salt);
    console.log('🔐 Generated fresh, guaranteed hash for "Password123"');

    // Clean up existing test users
    await pool.query("DELETE FROM users WHERE phone_number IN ('0711111111', '0722222222', '0733333333')");

    console.log('📝 Inserting Principal...');
    await pool.query(
      `INSERT INTO users (role, first_name, last_name, phone_number, password_hash) 
       VALUES ('principal', 'John', 'Kamau', '0711111111', $1)`, 
      [passwordHash]
    );

    console.log('📝 Inserting Subject Teacher...');
    await pool.query(
      `INSERT INTO users (role, first_name, last_name, phone_number, password_hash) 
       VALUES ('subject_teacher', 'Mary', 'Wanjiku', '0722222222', $1)`, 
      [passwordHash]
    );

    console.log('📝 Inserting Parent...');
    await pool.query(
      `INSERT INTO users (role, first_name, last_name, phone_number, password_hash) 
       VALUES ('parent', 'Peter', 'Ochieng', '0733333333', $1)`, 
      [passwordHash]
    );

    console.log('✅ Success! Test users created with guaranteed correct passwords.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

seedUsers();