// src/modules/academics/academicsRoutes.js
const express = require('express');
const router = express.Router();

// Import the functions from the controller
const { getClasses, getExams, getClassComparison } = require('./academicsController');
const { protect } = require('../../middleware/authMiddleware');

// All academic routes require authentication
router.use(protect);

// Define the actual URL paths
router.get('/classes', getClasses);
router.get('/exams', getExams);
router.get('/comparison', getClassComparison);

module.exports = router;