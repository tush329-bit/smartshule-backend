// src/modules/superadmin/superAdminController.js
const db = require('../../config/db');
const bcrypt = require('bcryptjs');

// 1. Get all schools with summary stats
const getAllSchools = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        s.id, s.name, s.logo_url, s.primary_color, s.secondary_color, s.is_active, s.created_at,
        COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'principal') as admin_count,
        COUNT(DISTINCT st.id) as student_count
      FROM schools s
      LEFT JOIN users u ON u.school_id = s.id
      LEFT JOIN students st ON st.school_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `);
    res.status(200).json({ success: true, schools: result.rows });
  } catch (error) {
    console.error('🔴 Get Schools Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get admins for a specific school
const getSchoolAdmins = async (req, res) => {
  try {
    const { school_id } = req.params;
    const result = await db.query(
      `SELECT id, first_name, last_name, phone_number, created_at 
       FROM users 
       WHERE school_id = $1 AND role = 'principal'
       ORDER BY created_at DESC`,
      [school_id]
    );
    res.status(200).json({ success: true, admins: result.rows });
  } catch (error) {
    console.error('🔴 Get School Admins Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Reset an admin's password (Super Admin privilege)
const resetAdminPassword = async (req, res) => {
  try {
    const { admin_id } = req.params;
    const { new_password } = req.body;
    
    const passwordToSet = new_password || 'Password123';
    const hashed = await bcrypt.hash(passwordToSet, 10);

    const result = await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2 AND role = $3 RETURNING id',
      [hashed, admin_id, 'principal']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Admin not found or cannot reset super admin passwords.' });
    }

    res.status(200).json({ 
      success: true, 
      message: `Password successfully reset to: ${passwordToSet}` 
    });
  } catch (error) {
    console.error('🔴 Reset Password Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Update a school's subscription status
const updateSubscription = async (req, res) => {
  try {
    const { school_id, service_name, is_active } = req.body;

    const validServices = ['sms', 'report_cards', 'analytics', 'offline_sync'];
    if (!validServices.includes(service_name)) {
      return res.status(400).json({ success: false, message: 'Invalid service name.' });
    }

    await db.query(
      `INSERT INTO school_subscriptions (school_id, service_name, is_active)
       VALUES ($1, $2, $3)
       ON CONFLICT (school_id, service_name) 
       DO UPDATE SET is_active = $3`,
      [school_id, service_name, is_active]
    );

    res.status(200).json({ success: true, message: `Subscription for '${service_name}' updated.` });
  } catch (error) {
    console.error('🔴 Update Subscription Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Get subscriptions for a specific school
const getSchoolSubscriptions = async (req, res) => {
  try {
    const { school_id } = req.params;
    const result = await db.query(
      'SELECT service_name, is_active FROM school_subscriptions WHERE school_id = $1',
      [school_id]
    );
    res.status(200).json({ success: true, subscriptions: result.rows });
  } catch (error) {
    console.error('🔴 Get Subscriptions Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Create a new school and its first admin (Onboarding)
const createSchoolAndAdmin = async (req, res) => {
  try {
    const { school_name, admin_first_name, admin_last_name, admin_phone, admin_password } = req.body;

    // 1. Create the new School
    const schoolResult = await db.query(
      `INSERT INTO schools (name, primary_color, secondary_color, is_active) 
       VALUES ($1, '#3b82f6', '#10b981', true) 
       RETURNING id`,
      [school_name]
    );
    const newSchoolId = schoolResult.rows[0].id;

    // 2. Hash the admin's password
    const hashedPassword = await bcrypt.hash(admin_password, 10);

    // 3. Create the Principal/Admin and link them to the new school
    await db.query(
      `INSERT INTO users (first_name, last_name, phone_number, password_hash, role, school_id) 
       VALUES ($1, $2, $3, $4, 'principal', $5)`,
      [admin_first_name, admin_last_name, admin_phone, hashedPassword, newSchoolId]
    );

    // 4. Grant default premium subscriptions to the new school
    await db.query(
      `INSERT INTO school_subscriptions (school_id, service_name, is_active) 
       VALUES ($1, 'sms', true), ($1, 'report_cards', true), ($1, 'analytics', true), ($1, 'offline_sync', true)`,
      [newSchoolId]
    );

    res.status(201).json({ 
      success: true, 
      message: `School "${school_name}" and Admin created successfully!` 
    });

  } catch (error) {
    console.error('🔴 Create School Error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'This admin phone number is already registered.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ CRITICAL: Export ALL functions cleanly
module.exports = { 
  getAllSchools, 
  getSchoolAdmins, 
  resetAdminPassword, 
  updateSubscription,
  getSchoolSubscriptions,
  createSchoolAndAdmin
};