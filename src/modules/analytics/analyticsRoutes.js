// src/modules/analytics/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const { getSchoolAnalytics } = require('./analyticsController');
const { protect, authorizeRoles } = require('../../middleware/authMiddleware');

// Only principals and super admins can view school-wide analytics
router.use(protect);
router.use(authorizeRoles('principal', 'super_admin'));

router.get('/school', getSchoolAnalytics);

module.exports = router;