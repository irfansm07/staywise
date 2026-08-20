const express = require('express');
const cors = require('cors');
const path = require('path');
const { getSimulatedEmails } = require('./config/mail');

const app = express();

// Standard Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve photos uploaded by residents statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const noticeRoutes = require('./routes/notices');
const statsRoutes = require('./routes/stats');

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/stats', statsRoutes);

// Simulated mailbox logs endpoint for UI in-app Inbox
app.get('/api/simulated-emails', (req, res) => {
  res.json(getSimulatedEmails());
});

// Root check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
