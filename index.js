const express = require('express');
const path = require('path');
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 10000; // fallback for local use
require('events').EventEmitter.defaultMaxListeners = 500;

// Load routes
const server = require('./qr');
const code = require('./pair');

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/server', server);
app.use('/code', code);

app.get('/pair', (req, res) => {
  res.sendFile(path.join(__dirname, 'pair.html'));
});

app.get('/qr', (req, res) => {
  res.sendFile(path.join(__dirname, 'qr.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'main.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ WHITESHADOW-MD Server running on http://localhost:${PORT}`);
});

module.exports = app;
