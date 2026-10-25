// src/modules/students/studentRoutes.js
const express = require('express');
const router = express.Router();

// ✅ FIX: Import ALL functions in a SINGLE require statement!
const { getStudents, getMyChildren } = require('./studentController');
const { protect } = require('../../middleware/authMiddleware');

// Apply 'protect' to ALL routes in this file
router.use(protect);

// Route 1: Get all students (Admin/Teacher)
router.get('/', getStudents);

// Route 2: Get my children (Parent)
router.get('/my-children', getMyChildren); 

// If you have a batch upload route, add it here:
// router.post('/batch', createStudents);

module.exports = router;