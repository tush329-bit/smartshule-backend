// src/modules/allocations/allocationController.js
const db = require('../../config/db');

// Get all allocations for the school
const getAllocations = async (req, res) => {
  try {
    const { school_id, role } = req.user;
    
    let query = `
      SELECT ta.id, ta.class_id, ta.subject_id, ta.term, 
             u.id as teacher_id, u.first_name, u.last_name,
             s.name as subject_name
      FROM teacher_allocations ta
      JOIN users u ON ta.teacher_id = u.id
      JOIN subjects s ON ta.subject_id = s.id
    `;
    const queryParams = [];

    // Super admins see all, principals see only their school
    if (role !== 'super_admin') {
      query += ` WHERE ta.school_id = $1`;
      queryParams.push(school_id);
    }
    
    query += ` ORDER BY u.first_name ASC, ta.class_id ASC`;

    const result = await db.query(query, queryParams);
    res.status(200).json({ success: true, allocations: result.rows });
  } catch (error) {
    console.error('🔴 Get Allocations Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add a new allocation
const createAllocation = async (req, res) => {
  try {
    const { teacher_id, class_id, subject_id, term } = req.body;
    const { school_id } = req.user;

    // Prevent duplicate allocations
    const existing = await db.query(
      'SELECT id FROM teacher_allocations WHERE teacher_id = $1 AND class_id = $2 AND subject_id = $3 AND term = $4 AND school_id = $5',
      [teacher_id, class_id, subject_id, term, school_id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'This teacher is already allocated to this class and subject for this term.' });
    }

    await db.query(
      `INSERT INTO teacher_allocations (teacher_id, class_id, subject_id, term, school_id) 
       VALUES ($1, $2, $3, $4, $5)`,
      [teacher_id, class_id, subject_id, term, school_id]
    );

    res.status(201).json({ success: true, message: 'Allocation created successfully.' });
  } catch (error) {
    console.error('🔴 Create Allocation Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove an allocation
const deleteAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { school_id, role } = req.user;

    let query = 'DELETE FROM teacher_allocations WHERE id = $1';
    const queryParams = [id];

    if (role !== 'super_admin') {
      query += ' AND school_id = $2';
      queryParams.push(school_id);
    }

    const result = await db.query(query, queryParams);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Allocation not found or permission denied.' });
    }

    res.status(200).json({ success: true, message: 'Allocation removed successfully.' });
  } catch (error) {
    console.error('🔴 Delete Allocation Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Replace the getAllocationOptions function in allocationController.js

const getAllocationOptions = async (req, res) => {
  try {
    const { school_id, role } = req.user;

    // 1. Fetch Teachers (Safe parameterized query)
    let teacherQuery = `SELECT id, first_name, last_name FROM users WHERE role = 'teacher'`;
    const teacherParams = [];
    if (role !== 'super_admin') {
      teacherQuery += ` AND school_id = $1`;
      teacherParams.push(school_id);
    }
    teacherQuery += ` ORDER BY first_name ASC`;
    const teachers = await db.query(teacherQuery, teacherParams);

    // 2. Fetch Classes (Safe parameterized query)
    let classQuery = `SELECT id FROM classes`;
    const classParams = [];
    if (role !== 'super_admin') {
      classQuery += ` WHERE school_id = $1`;
      classParams.push(school_id);
    }
    classQuery += ` ORDER BY id ASC`;
    const classes = await db.query(classQuery, classParams);

    // 3. Fetch Subjects (Subjects are usually global across the platform)
    const subjects = await db.query(`SELECT id, name FROM subjects ORDER BY name ASC`);

    res.status(200).json({ 
      success: true, 
      teachers: teachers.rows, 
      classes: classes.rows, 
      subjects: subjects.rows 
    });
  } catch (error) {
    console.error('🔴 Get Options Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Add this function to src/modules/allocations/allocationController.js

const getMyClasses = async (req, res) => {
  try {
    const { id: teacher_id, school_id } = req.user;

    // Fetch only the allocations for THIS specific teacher in THEIR school
    const query = `
      SELECT ta.id, ta.class_id, ta.subject_id, ta.term, 
             s.name as subject_name
      FROM teacher_allocations ta
      JOIN subjects s ON ta.subject_id = s.id
      WHERE ta.teacher_id = $1 AND ta.school_id = $2
      ORDER BY ta.class_id ASC, ta.term ASC
    `;
    
    const result = await db.query(query, [teacher_id, school_id]);
    res.status(200).json({ success: true, allocations: result.rows });
  } catch (error) {
    console.error('🔴 Get My Classes Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update the exports at the bottom to include this new function:
module.exports = { 
  getAllocations, 
  createAllocation, 
  deleteAllocation, 
  getAllocationOptions,
  getMyClasses // <-- ADD THIS
};