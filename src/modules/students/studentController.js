// src/modules/students/studentController.js
const db = require('../../config/db');

// 1. Get all students (Multi-Tenant Secure)
const getStudents = async (req, res) => {
  try {
    const { class_id, search } = req.query;
    const { school_id, role } = req.user; // ✅ Extract school_id from JWT

    let query = `SELECT id, admission_number, gender, class_id FROM students WHERE 1=1`;
    const params = [];

    // ✅ CRITICAL: If not super admin, ONLY fetch students for this specific school
    if (role !== 'super_admin') {
      query += ` AND school_id = $${params.length + 1}`;
      params.push(school_id);
    }

    if (class_id) {
      query += ` AND class_id = $${params.length + 1}`;
      params.push(class_id);
    }
    
    if (search) {
      query += ` AND admission_number ILIKE $${params.length + 1}`;
      params.push(`%${search}%`);
    }
    
    query += ` ORDER BY admission_number ASC`;

    const result = await db.query(query, params);
    res.status(200).json({ success: true, count: result.rows.length, students: result.rows });
  } catch (error) {
    console.error('🔴 Get Students Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching students.' });
  }
};

// 2. Get students linked to the logged-in parent (Multi-Tenant Secure)
const getMyChildren = async (req, res) => {
  try {
    const parentId = req.user.id; // From the JWT token
    const { school_id } = req.user; // ✅ Extract school_id

    const result = await db.query(`
      SELECT s.id, s.admission_number, s.class_id, s.gender, ps.relationship
      FROM students s
      JOIN parent_students ps ON s.id = ps.student_id
      WHERE ps.parent_id = $1 AND s.school_id = $2
      ORDER BY s.admission_number ASC
    `, [parentId, school_id]);

    res.status(200).json({ success: true, children: result.rows });
  } catch (error) {
    console.error('🔴 Get My Children Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching children.' });
  }
};

// ✅ CRITICAL: Export ALL functions so the routes file can use them
module.exports = { getStudents, getMyChildren };