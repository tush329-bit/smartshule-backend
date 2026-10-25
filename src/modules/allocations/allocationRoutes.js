// src/modules/allocations/allocationRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getAllocations, 
  createAllocation, 
  deleteAllocation, 
  getAllocationOptions,
  getMyClasses // <-- Import it here
} = require('./allocationController');
const { protect, authorizeRoles } = require('../../middleware/authMiddleware');

router.use(protect);

// Existing routes
router.get('/', getAllocations);
router.get('/options', getAllocationOptions);
router.post('/', authorizeRoles('principal', 'super_admin'), createAllocation);
router.delete('/:id', authorizeRoles('principal', 'super_admin'), deleteAllocation);

// ✅ NEW ROUTE: For teachers to see their own assigned classes
router.get('/my-classes', getMyClasses); 

module.exports = router;