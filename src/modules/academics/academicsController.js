// src/modules/academics/academicsController.js
const db = require('../../config/db');

// 1. Get Classes for the logged-in school
const getClasses = async (req, res) => {
  try {
    const { school_id, role } = req.user;
    
    let query = 'SELECT id FROM classes';
    const params = [];

    if (role !== 'super_admin') {
      query += ' WHERE school_id = $1';
      params.push(school_id);
    }
    query += ' ORDER BY id ASC';

    const result = await db.query(query, params);
    res.status(200).json({ success: true, classes: result.rows });
  } catch (error) {
    console.error('🔴 Get Classes Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get Exams / Terms for the logged-in school
const getExams = async (req, res) => {
  try {
    const { school_id, role } = req.user;
    
    let query = 'SELECT id, name, term, year FROM exams';
    const params = [];

    if (role !== 'super_admin') {
      query += ' WHERE school_id = $1';
      params.push(school_id);
    }
    query += ' ORDER BY year DESC, term ASC';

    const result = await db.query(query, params);
    res.status(200).json({ success: true, exams: result.rows });
  } catch (error) {
    console.error('🔴 Get Exams Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get Class Comparison Data (Aggregated Marks)
const getClassComparison = async (req, res) => {
  try {
    const { class_id, exam_id } = req.query;
    const { school_id } = req.user;

    if (!class_id || !exam_id) {
      return res.status(400).json({ success: false, message: 'class_id and exam_id are required.' });
    }

    const result = await db.query(`
      SELECT 
        s.name AS subject_name,
        AVG(m.score) AS average_score,
        COUNT(m.id) AS total_students
      FROM marks m
      JOIN subjects s ON m.subject_id = s.id
      JOIN students st ON m.student_id = st.id
      WHERE st.class_id = $1 
        AND m.exam_id = $2 
        AND st.school_id = $3
      GROUP BY s.name
      ORDER BY average_score DESC
    `, [class_id, exam_id, school_id]);

    res.status(200).json({ success: true, comparison: result.rows });
  } catch (error) {
    console.error('🔴 Get Comparison Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getClasses, getExams, getClassComparison };