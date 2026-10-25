// src/modules/analytics/analyticsController.js
const db = require('../../config/db');

const getSchoolAnalytics = async (req, res) => {
  try {
    const { school_id, role } = req.user;

    // 1. Average Marks by Class (for Bar Chart)
    const classPerformance = await db.query(`
      SELECT 
        st.class_id,
        ROUND(AVG(m.score)::numeric, 1) as average_score,
        COUNT(m.id) as total_marks_recorded
      FROM marks m
      JOIN students st ON m.student_id = st.id
      WHERE st.school_id = $1
      GROUP BY st.class_id
      ORDER BY average_score DESC
    `, [school_id]);

    // 2. Gender Performance Gap in Core Subjects (for Radar/Bar Chart)
    const genderPerformance = await db.query(`
      SELECT 
        s.name as subject_name,
        st.gender,
        ROUND(AVG(m.score)::numeric, 1) as average_score
      FROM marks m
      JOIN students st ON m.student_id = st.id
      JOIN subjects s ON m.subject_id = s.id
      WHERE st.school_id = $1 AND s.name IN ('Mathematics', 'English', 'Kiswahili')
      GROUP BY s.name, st.gender
      ORDER BY s.name, st.gender
    `, [school_id]);

    // 3. Overall Subject Averages (for identifying weak areas)
    const subjectMastery = await db.query(`
      SELECT 
        s.name as subject_name,
        ROUND(AVG(m.score)::numeric, 1) as average_score
      FROM marks m
      JOIN subjects s ON m.subject_id = s.id
      JOIN students st ON m.student_id = st.id
      WHERE st.school_id = $1
      GROUP BY s.name
      ORDER BY average_score ASC
    `, [school_id]);

    res.status(200).json({
      success: true,
      analytics: {
        classPerformance: classPerformance.rows,
        genderPerformance: genderPerformance.rows,
        subjectMastery: subjectMastery.rows
      }
    });
  } catch (error) {
    console.error('🔴 Get Analytics Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getSchoolAnalytics };