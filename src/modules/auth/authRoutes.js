// src/modules/auth/authRoutes.js
const express = require('express');
const router = express.Router();
const { login, createUser } = require('./authController');
const { protect, authorizeRoles } = require('../../middleware/authMiddleware');

// Public route
router.post('/login', login);

// ✅ Protected route: Map createUser to '/register' so the frontend works!
// Only principals and super admins can create new users
router.post('/register', protect, authorizeRoles('principal', 'super_admin'), createUser);

module.exports = router;