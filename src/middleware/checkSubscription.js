// src/middleware/checkSubscription.js
const db = require('../config/db');

const checkSubscription = (serviceName) => {
  return async (req, res, next) => {
    try {
      const { school_id } = req.user;

      // Super admins bypass subscription checks
      if (req.user.role === 'super_admin') {
        return next();
      }

      if (!school_id) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. No school associated with this account.' 
        });
      }

      const result = await db.query(
        `SELECT is_active FROM school_subscriptions 
         WHERE school_id = $1 AND service_name = $2`,
        [school_id, serviceName]
      );

      if (result.rows.length === 0 || !result.rows[0].is_active) {
        return res.status(403).json({ 
          success: false, 
          message: `This feature requires an active ${serviceName} subscription. Please contact your school administrator.` 
        });
      }

      next();
    } catch (error) {
      console.error('Subscription Check Error:', error);
      res.status(500).json({ success: false, message: 'Server error checking subscription.' });
    }
  };
};

module.exports = { checkSubscription };