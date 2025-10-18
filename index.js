// ===============================
// ⚙️  WhiteShadow-MD Main Server
// ===============================

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

// Create express app
const app = express();
require('events').EventEmitter.defaultMaxListeners = 500;

// Set static path
const __path = process.cwd();

// Import routes
const server = require('./qr');
const code = require('./pair');

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/server', server);
app.use('/code', code);

app.get('/pair', (req, res) => {
  res.sendFile(path.join(__path, 'pair.html'));
});

app.get('/qr', (req, res) => {
  res.sendFile(path.join(__path, 'qr.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__path, 'main.html'));
});

// Auto port binding for Render
const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
✅ WHITESHADOW-MD Server is now running!
🌐 URL: http://localhost:${PORT}
⭐ Don't forget to give a star on GitHub!
  `);
});

module.exports = app;
