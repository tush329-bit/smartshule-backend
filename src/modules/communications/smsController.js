// src/modules/communications/smsController.js
const db = require('../../config/db');
const AfricasTalking = require('africastalking');

const at = AfricasTalking({
  username: process.env.AT_USERNAME,
  apiKey: process.env.AT_API_KEY
});
const sms = at.SMS;

const sendBulkSms = async (req, res) => {
  try {
    let rawRecipients = req.body.recipients;
    let rawMessage = req.body.message;

    if (!rawRecipients) {
      return res.status(400).json({ success: false, message: 'No recipients provided.' });
    }
    if (!rawMessage || rawMessage.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    // 1. FORCE TO ARRAY & CLEAN
    let recipientsArray = Array.isArray(rawRecipients) 
      ? rawRecipients 
      : String(rawRecipients).split(',');

    // 2. BULLETPROOF FORMATTING
    const formattedRecipients = recipientsArray
      .map(phone => String(phone).trim())
      .filter(phone => phone.length > 0)
      .map(phone => {
        let clean = phone.replace(/[^\d+]/g, '');
        if (clean.startsWith('0')) return '+254' + clean.substring(1);
        if (clean.startsWith('254')) return '+' + clean;
        if (!clean.startsWith('+254')) return '+254' + clean.replace(/^\+/, '');
        return clean;
      });

    if (formattedRecipients.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid phone numbers found.' });
    }

    // 3. SAFETY: Truncate message to max safe SMS length (640 chars = 4 segments)
    const safeMessage = rawMessage.trim().substring(0, 640);

    console.log('📡 SENDING SMS TO:', formattedRecipients);
    console.log('📝 MESSAGE LENGTH:', safeMessage.length, 'characters');

    // ✅ CRITICAL FIX: Pass 'to' as an ARRAY, not a comma-separated string. 
    // The AT SDK handles arrays perfectly and bypasses string regex glitches.
    const options = {
      to: formattedRecipients, 
      message: safeMessage,
      from: process.env.AT_SHORTCODE || 'SmartShule'
    };

    const result = await sms.send(options);
    console.log('✅ AT SUCCESS RESPONSE:', result.SMSMessageData);

    // 4. LOG TO DB
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      for (const recipientData of result.SMSMessageData.Recipients) {
        await client.query(
          `INSERT INTO sms_logs (recipient, message, status, message_id, cost, sent_by) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            recipientData.phoneNumber,
            safeMessage,
            recipientData.status,
            recipientData.messageId || 'N/A',
            recipientData.cost ? parseFloat(recipientData.cost) : 0.00,
            req.user.id
          ]
        );
      }
      await client.query('COMMIT');
    } catch (dbError) {
      await client.query('ROLLBACK');
      console.error('🔴 DB Logging Error:', dbError);
    } finally {
      client.release();
    }

    res.status(200).json({ 
      success: true, 
      message: `SMS queued for ${formattedRecipients.length} recipients.`,
      details: result.SMSMessageData.Recipients
    });

  } catch (error) {
    console.error('\n🔴 SMS SEND CRASH:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Failed to send SMS.' });
  }
};

const getSmsLogs = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT sl.id, sl.recipient, sl.message, sl.status, sl.cost, sl.created_at, u.first_name
      FROM sms_logs sl
      LEFT JOIN users u ON sl.sent_by = u.id
      ORDER BY sl.created_at DESC
      LIMIT 100
    `);
    res.status(200).json({ success: true, logs: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch SMS logs.' });
  }
};
// Fetch actual phone numbers based on target group
const getRecipients = async (req, res) => {
  try {
    const { group } = req.query;
    let query = '';
    
    if (group === 'all_parents') {
      query = `SELECT phone_number FROM users WHERE role = 'parent' AND phone_number IS NOT NULL`;
    } else if (group === 'all_teachers') {
      query = `SELECT phone_number FROM users WHERE role = 'teacher' AND phone_number IS NOT NULL`;
    } else if (group === 'grade_8_parents') {
      // Fetch parents linked to ANY Grade 8 class (e.g., Grade-8-East, Grade-8-West)
      query = `
        SELECT DISTINCT u.phone_number 
        FROM users u
        JOIN parent_students ps ON u.id = ps.parent_id
        JOIN students s ON ps.student_id = s.id
        WHERE s.class_id LIKE 'Grade-8%' AND u.phone_number IS NOT NULL
      `;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid target group.' });
    }
    
    const result = await db.query(query);
    const phones = result.rows.map(row => row.phone_number);
    
    res.status(200).json({ 
      success: true, 
      recipients: phones, 
      count: phones.length 
    });
  } catch (error) {
    console.error('Get Recipients Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ UPDATE MODULE.EXPORTS:
module.exports = { sendBulkSms, getSmsLogs, getRecipients };