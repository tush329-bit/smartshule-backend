// src/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Import Rate Limiters
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');

// Import Routes
const authRoutes = require('./modules/auth/authRoutes');
const superAdminRoutes = require('./modules/superadmin/superAdminRoutes');
const academicsRoutes = require('./modules/academics/academicsRoutes');
const userRoutes = require('./modules/users/userRoutes'); // If you have this
const studentRoutes = require('./modules/students/studentRoutes'); // If you have this
const allocationRoutes = require('./modules/allocations/allocationRoutes'); // If you have this
const syncRoutes = require('./modules/sync/syncRoutes');
const analyticsRoutes = require('./modules/analytics/analyticsRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ 1. SECURITY: Helmet (XSS/Headers) & CORS (Perimeter)
app.use(helmet()); 

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Strictly limit to your frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// ✅ Standard Body Parsing (with size limit to prevent DoS)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ✅ 2. SECURITY: Rate Limiting
app.use('/api/v1/auth', authLimiter); // Strict limits on login/register
app.use('/api/v1/', apiLimiter);      // Moderate limits on general API

// ✅ 3. ROUTE REGISTRATION (The Missing Link!)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/superadmin', superAdminRoutes);
app.use('/api/v1/academics', academicsRoutes);
app.use('/api/v1/sync', syncRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
// Uncomment these if you have created these route files:
// app.use('/api/v1/users', userRoutes);
// app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/allocations', allocationRoutes);

// ✅ 4. Health Check Route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, message: 'SmartShule API is running securely.' });
});

// ✅ 5. Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔴 Global Error:', err.message);
  
  // Handle Multer File Upload Errors
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: err.message });
  }
  
  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || 'Internal server error.' 
  });
});

// ✅ 6. Start Server
app.listen(PORT, () => {
  console.log(`🚀 Backend Kitchen is OPEN! Server running on http://localhost:${PORT}`);
  console.log(`🛡️ Security Shield Active: Helmet, CORS, Rate Limiting`);
});