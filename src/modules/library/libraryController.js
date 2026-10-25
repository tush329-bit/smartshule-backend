// src/modules/library/libraryController.js
const db = require('../../config/db');

// 1. Issue a book to a student
const issueBook = async (req, res) => {
  try {
    const { book_id, student_id, due_date } = req.body;
    const issued_by = req.user.id;

    const bookCheck = await db.query('SELECT available_copies FROM books WHERE id = $1', [book_id]);
    if (!bookCheck.rows[0] || bookCheck.rows[0].available_copies <= 0) {
      return res.status(400).json({ success: false, message: 'No copies of this book are currently available.' });
    }

    await db.query(
      `INSERT INTO book_issuances (book_id, student_id, due_date, issued_by, condition_returned) 
       VALUES ($1, $2, $3, $4, 'Pending')`,
      [book_id, student_id, due_date, issued_by]
    );

    await db.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id = $1',
      [book_id]
    );

    res.status(201).json({ success: true, message: 'Book issued successfully.' });
  } catch (error) {
    console.error('Issue Book Error:', error);
    res.status(500).json({ success: false, message: 'Server error issuing book.' });
  }
};

// 2. Get all books currently held by a specific student
const getStudentBooks = async (req, res) => {
  try {
    const { student_id } = req.params;

    const result = await db.query(`
      SELECT b.id as book_id, b.title, b.author, i.id as issuance_id, i.issue_date, i.due_date, i.condition_returned 
      FROM book_issuances i
      JOIN books b ON i.book_id = b.id
      WHERE i.student_id = $1 AND i.condition_returned = 'Pending'
      ORDER BY i.issue_date DESC
    `, [student_id]);

    res.status(200).json({ success: true, books: result.rows });
  } catch (error) {
    console.error('Get Student Books Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching books.' });
  }
};

// 3. Return a book
const returnBook = async (req, res) => {
  try {
    const { issuance_id, condition } = req.body;

    const issuanceCheck = await db.query('SELECT book_id FROM book_issuances WHERE id = $1', [issuance_id]);
    if (!issuanceCheck.rows[0]) {
      return res.status(404).json({ success: false, message: 'Issuance record not found.' });
    }
    const book_id = issuanceCheck.rows[0].book_id;

    await db.query(
      `UPDATE book_issuances SET return_date = CURRENT_DATE, condition_returned = $1 WHERE id = $2`,
      [condition, issuance_id]
    );

    await db.query(
      'UPDATE books SET available_copies = available_copies + 1 WHERE id = $1',
      [book_id]
    );

    const message = condition === 'Damaged' || condition === 'Lost' 
      ? 'Book returned. Student flagged for replacement fee.' 
      : 'Book returned successfully in good condition.';

    res.status(200).json({ success: true, message });
  } catch (error) {
    console.error('Return Book Error:', error);
    res.status(500).json({ success: false, message: 'Server error returning book.' });
  }
};

// 4. Get available books for the catalogue dropdown
const getAvailableBooks = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, title, author, available_copies 
      FROM books 
      WHERE available_copies > 0 
      ORDER BY title ASC
    `);
    res.status(200).json({ success: true, books: result.rows });
  } catch (error) {
    console.error('Get Books Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching books.' });
  }
};

// 5. Add a new book to the catalogue (Admin only)
const addBook = async (req, res) => {
  try {
    const { title, author, subject, total_copies } = req.body;
    await db.query(
      `INSERT INTO books (title, author, subject, total_copies, available_copies) 
       VALUES ($1, $2, $3, $4, $4)`,
      [title, author, subject, total_copies]
    );
    res.status(201).json({ success: true, message: 'Book added to catalogue.' });
  } catch (error) {
    console.error('Add Book Error:', error);
    res.status(500).json({ success: false, message: 'Server error adding book.' });
  }
};

// ✅ CRITICAL: Export ALL functions so the routes file can use them
module.exports = { 
  issueBook, 
  getStudentBooks, 
  returnBook, 
  getAvailableBooks, 
  addBook 
};