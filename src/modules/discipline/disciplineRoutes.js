// src/modules/discipline/disciplineRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware'); // <-- Import the auth guard
const { addDisciplineRecord, getStudentDiscipline } = require('./disciplineController');

// Apply the 'protect' middleware to ALL routes in this file
// This ensures req.user is available for the controllers
router.use(protect);

router.post('/record', addDisciplineRecord);
router.get('/student/:student_id', getStudentDiscipline);

module.exports = router;