// src/modules/library/libraryRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');

const { 
  issueBook, 
  getStudentBooks, 
  returnBook, 
  getAvailableBooks, 
  addBook 
} = require('./libraryController');

router.use(protect);

router.get('/catalog', getAvailableBooks);
router.post('/books', addBook);
router.get('/student/:student_id', getStudentBooks);
router.post('/issue', issueBook);
router.post('/return', returnBook);

module.exports = router;