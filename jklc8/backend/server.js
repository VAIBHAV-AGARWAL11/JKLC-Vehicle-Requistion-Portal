// backend/server.js
// Main entry point for the Node.js Express server

const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');
const hodRoutes = require('./routes/hodRoutes');
const transportRoutes = require('./routes/transportRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Parse incoming request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register API routes
app.use(authRoutes);
app.use(requestRoutes);
app.use(hodRoutes);
app.use(transportRoutes);

// Serve frontend static assets securely from the root directory
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});
app.get('/style.css', (req, res) => {
  res.sendFile(path.join(__dirname, '../style.css'));
});
app.get('/app.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../app.js'));
});
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Fallback to index.html for single page application routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Start listening for requests
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`JK Lakshmi Vehicle Portal Server is running on port ${PORT}`);
  console.log(`Access the application at: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
