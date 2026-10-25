// src/modules/auth/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../../config/db');

// ==========================================
// 1. LOGIN FUNCTION (Unchanged & Working)
// ==========================================
const login = async (req, res) => {
  try {
    const { phone_number, password } = req.body;

    if (!phone_number || !password) {
      return res.status(400).json({ success: false, message: 'Phone number and password are required.' });
    }

    const userResult = await db.query(
      'SELECT id, phone_number, password_hash, role, first_name, last_name, school_id FROM users WHERE phone_number = $1',
      [phone_number]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    let schoolInfo = null;
    if (user.school_id) {
      const schoolResult = await db.query(
        'SELECT id, name, logo_url, primary_color, secondary_color FROM schools WHERE id = $1',
        [user.school_id]
      );
      if (schoolResult.rows.length > 0) {
        schoolInfo = schoolResult.rows[0];
      }
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, school_id: user.school_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role,
        school_id: user.school_id,
        school: schoolInfo
      }
    });
  } catch (error) {
    console.error('🔴 Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// ==========================================
// 2. CREATE USER FUNCTION (NEW & FIXED)
// ==========================================
const createUser = async (req, res) => {
  try {
    const { first_name, last_name, phone_number, password, role } = req.body;
    
    // ✅ CRITICAL: Get the school_id from the logged-in Principal's JWT token
    const { school_id } = req.user;

    if (!school_id && role !== 'super_admin') {
      return res.status(400).json({ success: false, message: 'Principal must belong to a school to create users.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ CRITICAL FIX: Include school_id in the INSERT statement
    const result = await db.query(
      `INSERT INTO users (first_name, last_name, phone_number, password_hash, role, school_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, first_name, last_name, phone_number, role, school_id`,
      [first_name, last_name, phone_number, hashedPassword, role, school_id]
    );

    res.status(201).json({ 
      success: true, 
      message: `${role} created successfully!`,
      user: result.rows[0] 
    });
  } catch (error) {
    console.error('🔴 Create User Error:', error);
    
    // Handle duplicate phone number (PostgreSQL error code 23505)
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'This phone number is already registered.' });
    }
    
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ CRITICAL: Export BOTH functions
module.exports = { login, createUser };