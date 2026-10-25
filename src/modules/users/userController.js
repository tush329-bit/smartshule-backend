// src/modules/users/userController.js
const db = require('../../config/db');
const bcrypt = require('bcryptjs');

// 1. Get Teachers (Multi-Tenant Secure)
const getTeachers = async (req, res) => {
  try {
    const { school_id, role } = req.user;
    
    let query = "SELECT id, first_name, last_name, phone_number FROM users WHERE role = 'teacher'";
    const params = [];

    // ✅ CRITICAL: If not super admin, ONLY fetch teachers for this specific school
    if (role !== 'super_admin') {
      query += " AND school_id = $1";
      params.push(school_id);
    }
    
    query += " ORDER BY first_name ASC";

    const result = await db.query(query, params);
    res.status(200).json({ success: true, teachers: result.rows });
  } catch (error) {
    console.error('🔴 Get Teachers Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Delete Teacher (Multi-Tenant Secure)
const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { school_id, role } = req.user;

    let query = 'DELETE FROM users WHERE id = $1 AND role = $2';
    const params = [id, 'teacher'];

    // ✅ CRITICAL: Prevent principals from deleting teachers in other schools
    if (role !== 'super_admin') {
      query += ' AND school_id = $3';
      params.push(school_id);
    }

    const result = await db.query(query, params);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Teacher not found or permission denied.' });
    }

    res.status(200).json({ success: true, message: 'Teacher deleted successfully.' });
  } catch (error) {
    console.error('🔴 Delete Teacher Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Reset Password (Multi-Tenant Secure)
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { school_id, role } = req.user;
    const defaultPassword = 'Password123';
    const hashed = await bcrypt.hash(defaultPassword, 10);
    
    let query = 'UPDATE users SET password_hash = $1 WHERE id = $2';
    const params = [hashed, id];

    // ✅ CRITICAL: Prevent principals from resetting passwords of users in other schools
    if (role !== 'super_admin') {
      query += ' AND school_id = $3';
      params.push(school_id);
    }

    const result = await db.query(query, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found or permission denied.' });
    }

    res.status(200).json({ success: true, message: `Password reset to ${defaultPassword}` });
  } catch (error) {
    console.error('🔴 Reset Password Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Export all functions
module.exports = { getTeachers, deleteTeacher, resetPassword };