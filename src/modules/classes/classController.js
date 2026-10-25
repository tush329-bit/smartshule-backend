// src/modules/classes/classController.js
const db = require('../../config/db');

const getClasses = async (req, res) => {
  try {
    const result = await db.query('SELECT id, created_at FROM classes ORDER BY id ASC');
    res.status(200).json({ success: true, classes: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createClass = async (req, res) => {
  try {
    const { grade, stream } = req.body;
    const classId = `${grade}-${stream}`.replace(/\s+/g, ''); // e.g., Grade8-East

    await db.query('INSERT INTO classes (id) VALUES ($1)', [classId]);
    res.status(201).json({ success: true, message: `Class ${classId} created.` });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ success: false, message: 'Class already exists.' });
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    // Check if students exist in this class before deleting
    const studentsCheck = await db.query('SELECT id FROM students WHERE class_id = $1 LIMIT 1', [id]);
    if (studentsCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete class. It has students assigned to it.' });
    }
    
    await db.query('DELETE FROM classes WHERE id = $1', [id]);
    res.status(200).json({ success: true, message: 'Class deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getClasses, createClass, deleteClass };