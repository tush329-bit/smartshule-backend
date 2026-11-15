// src/modules/sync/syncRoutes.js
const express = require('express');
const router = express.Router();
const { syncBatch } = require('./syncController');
const { protect } = require('../../middleware/authMiddleware');
const idempotency = require('../../middleware/idempotency'); // 🛡️ Import Phase 3 security!

router.use(protect);

// Apply the idempotency middleware to guarantee no duplicate syncs!
router.post('/batch', idempotency, syncBatch);

module.exports = router;