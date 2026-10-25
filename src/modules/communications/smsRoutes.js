const express = require('express');
const router = express.Router();
const { sendBulkSms, getSmsLogs, getRecipients } = require('./smsController'); // ✅ Added getRecipients
const { checkSubscription } = require('../../middleware/checkSubscription');
const { protect } = require('../../middleware/authMiddleware');

router.use(protect);
router.post('/send', sendBulkSms);
router.post('/send', checkSubscription('sms'), sendBulkSms);
router.get('/logs', getSmsLogs);
router.get('/recipients', getRecipients); // ✅ NEW ROUTE

module.exports = router;