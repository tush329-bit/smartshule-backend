// src/middleware/validate.js
const { z } = require('zod');

// Define schemas for your critical endpoints
const loginSchema = z.object({
  phone_number: z.string().min(10, "Phone number must be at least 10 digits").max(15),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const createUserSchema = z.object({
  first_name: z.string().min(2).max(50),
  last_name: z.string().min(2).max(50),
  phone_number: z.string().min(10).max(15),
  password: z.string().min(6),
  role: z.enum(['teacher', 'principal', 'parent', 'student']), // Strictly enforce allowed roles
});

// Middleware factory to validate requests
const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body); // Parse and validate the request body
      next(); // If valid, proceed to the controller
    } catch (error) {
      // If invalid, return a clean 400 error with the specific Zod message
      const errors = error.errors.map(e => ({ path: e.path.join('.'), message: e.message }));
      res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
  };
};

module.exports = { validate, loginSchema, createUserSchema };