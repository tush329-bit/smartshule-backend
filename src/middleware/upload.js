// src/middleware/upload.js
const multer = require('multer');
const path = require('path');

// Store files in memory for validation, or disk if preferred
const storage = multer.memoryStorage(); 

const fileFilter = (req, file, cb) => {
  // 1. Check MIME type
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
  }

  // 2. Check extension (Double verification)
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('Invalid file extension.'), false);
  }

  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit (Prevents DoS via massive files)
  fileFilter: fileFilter
});

module.exports = upload;