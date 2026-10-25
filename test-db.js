// test-db.js
const db = require('./src/config/db');

async function testInsert() {
  try {
    console.log('🔍 Testing direct database insert...');
    
    // ⚠️ CRITICAL: Replace this with the EXACT UUID you put in FeeStatement.jsx
// test-db.js
const STUDENT_ID = 'a965c9d3-e6d7-499f-ab4a-edcb3d7a847e'; 
    
    const result = await db.query(
      `INSERT INTO fee_payments (student_id, amount, payment_method, transaction_code, phone_number) 
       VALUES ($1, $2, 'M-Pesa', $3, $4) RETURNING *`,
      [STUDENT_ID, 5000, 'DIRECTTEST1', '0712345678']
    );
    
    console.log('✅ SUCCESS! The database accepted it:', result.rows[0]);
  } catch (error) {
    // This will print the EXACT reason the database rejected it
    console.error('❌ FAILED! The exact database error is:', error.message);
  } finally {
    process.exit(); // Closes the script cleanly
  }
}

testInsert();