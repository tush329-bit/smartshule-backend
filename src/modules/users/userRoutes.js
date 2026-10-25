// src/modules/users/userRoutes.js
const express = require('express');
const router = express.Router();
const { getTeachers, deleteTeacher, resetPassword } = require('./userController');
const { protect } = require('../../middleware/authMiddleware');

router.use(protect);
router.get('/teachers', getTeachers);
router.delete('/teachers/:id', deleteTeacher);
router.post('/teachers/:id/reset-password', resetPassword);

module.exports = router;