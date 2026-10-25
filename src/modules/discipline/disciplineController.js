// src/modules/discipline/disciplineController.js
const db = require('../../config/db');

const addDisciplineRecord = async (req, res) => {
  try {
    const { student_id, incident_type, description, action_taken } = req.body;
    const recorded_by = req.user.id; // Comes from our Auth middleware

    const result = await db.query(
      `INSERT INTO discipline_records (student_id, incident_type, description, action_taken, recorded_by, parent_notified) 
       VALUES ($1, $2, $3, $4, $5, FALSE) 
       RETURNING *`,
      [student_id, incident_type, description, action_taken, recorded_by]
    );

    res.status(201).json({ success: true, message: 'Incident recorded.', record: result.rows[0] });
  } catch (error) {
    console.error('Discipline Error:', error);
    res.status(500).json({ success: false, message: 'Server error recording incident.' });
  }
};

const getStudentDiscipline = async (req, res) => {
  try {
    const { student_id } = req.params;
    const result = await db.query(
      `SELECT d.incident_type, d.description, d.action_taken, d.incident_date, d.parent_notified, 
              u.first_name || ' ' || u.last_name as recorded_by_name
       FROM discipline_records d
       JOIN users u ON d.recorded_by = u.id
       WHERE d.student_id = $1
       ORDER BY d.incident_date DESC`,
      [student_id]
    );

    res.status(200).json({ success: true, records: result.rows });
  } catch (error) {
    console.error('Get Discipline Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching records.' });
  }
};

module.exports = { addDisciplineRecord, getStudentDiscipline };