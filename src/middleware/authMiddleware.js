// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// 1. Protect Routes (Verify JWT)
// src/middleware/authMiddleware.js (Update the protect function)
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const userData = await db.query(
        'SELECT id, first_name, last_name, phone_number, role, school_id FROM users WHERE id = $1', 
        [decoded.id]
      );
      
      if (userData.rows.length === 0) {
        return res.status(401).json({ success: false, message: 'User not found.' });
      }

      req.user = userData.rows[0];

           // ✅ SAFELY set PostgreSQL session variables (handle null school_id for super admins)
      await db.query(`SET LOCAL app.current_user_id = '${req.user.id}'`);
      
      if (req.user.school_id) {
        await db.query(`SET LOCAL app.current_school_id = '${req.user.school_id}'`);
      } else {
        await db.query(`SET LOCAL app.current_school_id = NULL`);
      }

      next();
    } catch (error) {
      console.error('🔴 Token verification failed:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed.' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token.' });
  }
};

// 2. Authorize Specific Roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Role ${req.user?.role || 'unknown'} is not authorized to access this route.` 
      });
    }
    next();
  };
};

// 3. Restrict Data Access (Parent-Aware & Multi-Tenant)
const restrictDataAccess = async (req, res, next) => {
  try {
    const { role, id: userId, school_id } = req.user;
    const { student_id } = req.params;

    // Super Admins can see everything
    if (role === 'super_admin') return next();
    
    // Principals can see everything in their school
    if (role === 'principal') return next();

    // Students can only see their own data
    if (role === 'student' && userId === student_id) {
      return next();
    }

    // Teachers can see data for students in their allocated classes
    if (role === 'teacher') {
      const allocation = await db.query(
        `SELECT 1 FROM teacher_allocations ta
         JOIN students s ON ta.class_id = s.class_id
         WHERE ta.teacher_id = $1 AND s.id = $2 AND ta.school_id = $3 LIMIT 1`,
        [userId, student_id, school_id]
      );
      if (allocation.rows.length > 0) return next();
    }

    // Parents can see data for their specifically linked children
    if (role === 'parent') {
      const link = await db.query(
        `SELECT 1 FROM parent_students ps
         JOIN students s ON ps.student_id = s.id
         WHERE ps.parent_id = $1 AND s.id = $2 AND s.school_id = $3 LIMIT 1`,
        [userId, student_id, school_id]
      );
      if (link.rows.length > 0) return next();
    }

    // If none of the above conditions are met, deny access
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. You do not have permission to view this data.' 
    });

  } catch (error) {
    console.error('🔴 Restrict Data Access Error:', error);
    return res.status(500).json({ success: false, message: 'Server error checking permissions.' });
  }
};

// ✅ CRITICAL: Export ALL functions cleanly
module.exports = { protect, authorizeRoles, restrictDataAccess };