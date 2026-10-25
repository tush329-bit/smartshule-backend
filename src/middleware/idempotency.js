// src/middleware/idempotency.js
const db = require('../config/db');

const idempotencyMiddleware = async (req, res, next) => {
  const idempotencyKey = req.headers['idempotency-key'];

  // If no key is provided, just proceed (for non-critical GET requests, etc.)
  if (!idempotencyKey) return next();

  try {
    // 1. Check if this key already exists and is completed
    const existing = await db.query(
      `SELECT status, response_data FROM idempotency_keys WHERE key = $1 AND user_id = $2`,
      [idempotencyKey, req.user.id]
    );

    if (existing.rows.length > 0) {
      const record = existing.rows[0];
      
      if (record.status === 'completed') {
        // ✅ Return the cached successful response immediately!
        return res.status(200).json(JSON.parse(record.response_data));
      }
      
      if (record.status === 'processing') {
        // ⚠️ A request with this key is currently being processed. Prevent duplicate.
        return res.status(409).json({ 
          success: false, 
          message: 'Request is already being processed. Please wait.' 
        });
      }
    }

    // 2. If new, insert it as 'processing'
    await db.query(
      `INSERT INTO idempotency_keys (key, user_id, request_path, status) 
       VALUES ($1, $2, $3, 'processing')`,
      [idempotencyKey, req.user.id, req.path]
    );

    // 3. Override res.json to capture the response and update the key to 'completed'
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      // Update the idempotency key with the successful response
      db.query(
        `UPDATE idempotency_keys SET status = 'completed', response_data = $1 WHERE key = $2`,
        [JSON.stringify(data), idempotencyKey]
      ).catch(err => console.error('Failed to update idempotency key:', err));
      
      return originalJson(data);
    };

    next();
  } catch (error) {
    console.error('🔴 Idempotency Error:', error);
    next(); // Fail open: if idempotency fails, let the request through to avoid blocking the user
  }
};

module.exports = idempotencyMiddleware;