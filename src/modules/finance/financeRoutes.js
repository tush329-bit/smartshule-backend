// src/modules/finance/financeRoutes.js
const express = require('express');
const router = express.Router();
const { recordPayment, getFeeStatement } = require('./financeController');
const { initiateStkPush } = require('./mpesaController');

// We will add the 'protect' middleware here later to ensure only authorized users can access this
router.post('/payments', recordPayment);
router.get('/statement/:student_id', getFeeStatement);
router.post('/stk-push', initiateStkPush);

module.exports = router;