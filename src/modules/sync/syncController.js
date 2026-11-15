// src/modules/sync/syncController.js
const db = require('../../config/db');

const syncBatch = async (req, res) => {
  try {
    const { operations } = req.body;
    const { school_id } = req.user;
    
    if (!operations || !Array.isArray(operations)) {
      return res.status(400).json({ success: false, message: 'Invalid operations format.' });
    }

    let processedCount = 0;

    // Process each operation in the batch
    for (const op of operations) {
      if (op.type === 'mark') {
        const { studentId, subjectId, examId, score } = op.data;
        // Insert mark, ensuring it belongs to the user's school
        await db.query(
          `INSERT INTO marks (student_id, subject_id, exam_id, score, school_id) 
           VALUES ($1, $2, $3, $4, $5) 
           ON CONFLICT DO NOTHING`, // Prevents duplicates if somehow sent twice
          [studentId, subjectId, examId, score, school_id]
        );
        processedCount++;
      } 
      // You can add more types here: 'attendance', 'note', etc.
    }

    res.status(200).json({ 
      success: true, 
      message: `Successfully processed ${processedCount} operations.`,
      processedCount 
    });
  } catch (error) {
    console.error('🔴 Batch Sync Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { syncBatch };