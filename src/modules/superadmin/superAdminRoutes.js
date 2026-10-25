// src/modules/superadmin/superAdminRoutes.js
const express = require('express');
const router = express.Router();

const { 
  getAllSchools, 
  getSchoolAdmins, 
  resetAdminPassword,
  updateSubscription,
  getSchoolSubscriptions,
  createSchoolAndAdmin // ✅ Make sure this is imported
} = require('./superAdminController');

const { protect, authorizeRoles } = require('../../middleware/authMiddleware');

router.use(protect);
router.use(authorizeRoles('super_admin'));

router.get('/schools', getAllSchools);
router.get('/schools/:school_id/admins', getSchoolAdmins);
router.post('/admins/:admin_id/reset-password', resetAdminPassword);
router.post('/subscriptions', updateSubscription);
router.get('/schools/:school_id/subscriptions', getSchoolSubscriptions);
router.post('/schools', createSchoolAndAdmin); // ✅ Make sure this route is here

module.exports = router;