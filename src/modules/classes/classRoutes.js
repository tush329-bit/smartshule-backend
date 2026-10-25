// src/modules/classes/classRoutes.js
const express = require('express');
const router = express.Router();
const { getClasses, createClass, deleteClass } = require('./classController');
const { protect } = require('../../middleware/authMiddleware');

router.use(protect);
router.get('/', getClasses);
router.post('/', createClass);
router.delete('/:id', deleteClass);

module.exports = router;