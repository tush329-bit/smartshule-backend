// src/modules/finance/financeController.js
const db = require('../../config/db');

const recordPayment = async (req, res) => {
  try {
    const { student_id, amount, transaction_code, phone_number } = req.body;

    // 🛡️ 1. STRICT VALIDATION (Prevents 500 errors)
    if (!student_id || !amount || !transaction_code || !phone_number) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Clean the amount: remove commas and parse to float
    const cleanAmount = parseFloat(String(amount).replace(/,/g, ''));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please enter a valid amount greater than 0.' });
    }

    // Clean M-Pesa code: must be at least 8 characters, alphanumeric
    const cleanCode = transaction_code.trim().toUpperCase();
    if (cleanCode.length < 8) {
      return res.status(400).json({ success: false, message: 'M-Pesa code must be at least 8 characters.' });
    }

    // Clean phone number: remove spaces
    const cleanPhone = phone_number.replace(/\s/g, '');

    // 2. Insert the payment
    const paymentResult = await db.query(
      `INSERT INTO fee_payments (student_id, amount, payment_method, transaction_code, phone_number, paid_at) 
       VALUES ($1, $2, 'M-Pesa', $3, $4, NOW()) 
       RETURNING id, paid_at`,
      [student_id, cleanAmount, cleanCode, cleanPhone]
    );

    // 3. Calculate Current Balance (IGNORE PENDING_STK GHOST TRANSACTIONS)
    const DEMO_FEE_STRUCTURE = 15000; 
    const balanceResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total_paid 
       FROM fee_payments 
       WHERE student_id = $1 AND transaction_code != 'PENDING_STK'`, // ✅ ADDED FILTER
      [student_id]
    );

    const totalPaid = parseFloat(balanceResult.rows[0].total_paid);
    const balance = DEMO_FEE_STRUCTURE - totalPaid;

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully.',
      payment: paymentResult.rows[0],
      summary: { total_expected: DEMO_FEE_STRUCTURE, total_paid: totalPaid, balance }
    });

  } catch (error) {
    // Catch duplicate M-Pesa codes specifically
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'This M-Pesa transaction code has already been recorded.' });
    }
    
    // 🚨 LOG THE EXACT ERROR SO WE CAN SEE IT
    console.error('🔴 Record Payment Database Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error recording payment.' });
  }
};

// Get a student's fee statement
const getFeeStatement = async (req, res) => {
  try {
    const { student_id } = req.params;
    const DEMO_FEE_STRUCTURE = 15000;

    // Fetch ONLY successful payments (IGNORE PENDING_STK GHOST TRANSACTIONS)
    const payments = await db.query(
      `SELECT amount, transaction_code, phone_number, paid_at 
       FROM fee_payments 
       WHERE student_id = $1 AND transaction_code != 'PENDING_STK' -- ✅ ADDED FILTER
       ORDER BY paid_at DESC`,
      [student_id]
    );

    // Calculate total paid from the filtered, valid payments only
    const totalPaid = payments.rows.reduce((sum, row) => sum + parseFloat(row.amount), 0);
    const balance = DEMO_FEE_STRUCTURE - totalPaid;

    res.status(200).json({
      success: true,
      summary: { total_expected: DEMO_FEE_STRUCTURE, total_paid: totalPaid, balance },
      history: payments.rows
    });
  } catch (error) {
    console.error('Get Statement Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching statement.' });
  }
};

module.exports = { recordPayment, getFeeStatement };