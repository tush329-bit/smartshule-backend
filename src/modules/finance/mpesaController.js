// src/modules/finance/mpesaController.js
const axios = require('axios');
const db = require('../../config/db');

// 1. Helper to get Daraja Access Token
const getDarajaToken = async () => {
  const auth = Buffer.from(`${process.env.DARAJA_CONSUMER_KEY}:${process.env.DARAJA_CONSUMER_SECRET}`).toString('base64');
  const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
    headers: { Authorization: `Basic ${auth}` }
  });
  return response.data.access_token;
};

// 2. Initiate STK Push
const initiateStkPush = async (req, res) => {
  try {
    const { student_id, amount, phone_number } = req.body;

    // Format phone number to 2547XXXXXXXX (Safaricom requirement)
    const formattedPhone = phone_number.startsWith('0') ? `254${phone_number.substring(1)}` : phone_number;

    // Generate Timestamp (YYYYMMDDHHmmss)
    const timestamp = new Date().toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14);
    
    // Generate Password: Base64(Shortcode + Passkey + Timestamp)
    const password = Buffer.from(`${process.env.DARAJA_SHORTCODE}${process.env.DARJA_PASSKEY}${timestamp}`).toString('base64');

    // Get Access Token
    const token = await getDarajaToken();

    // 3. Send STK Push Request to Safaricom
    const stkResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: process.env.DARAJA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: formattedPhone, // Customer phone
        PartyB: process.env.DARAJA_SHORTCODE, // Paybill
        PhoneNumber: formattedPhone,
        CallBackURL: process.env.DARAJA_CALLBACK_URL || 'https://example.com/callback', // Placeholder for local dev
        AccountReference: `SmartShule-${student_id}`,
        TransactionDesc: 'School Fees Payment'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    // 4. Save as "PENDING" in our database so the webhook can update it later
    const pendingPayment = await db.query(
      `INSERT INTO fee_payments (student_id, amount, payment_method, transaction_code, phone_number, paid_at) 
       VALUES ($1, $2, 'M-Pesa STK Push', 'PENDING_STK', $3, NOW()) 
       RETURNING id`,
      [student_id, amount, formattedPhone]
    );

    res.status(200).json({
      success: true,
      message: 'M-Pesa prompt sent to phone. Please check your device.',
      merchantRequestId: stkResponse.data.MerchantRequestID,
      checkoutRequestId: stkResponse.data.CheckoutRequestID,
      pendingPaymentId: pendingPayment.rows[0].id
    });

  } catch (error) {
    console.error('🔴 STK Push Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, message: 'Failed to initiate M-Pesa prompt.' });
  }
};

module.exports = { initiateStkPush };