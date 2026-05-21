const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const connectDB = require('./config/db');

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Serve static assets in production
const frontendDistPath = path.join(__dirname, '../frontend/dist');
const frontendIndexPath = path.join(frontendDistPath, 'index.html');

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  // In production, any unmatched GET requests are served the frontend React build
  app.get('*', (req, res) => {
    if (fs.existsSync(frontendIndexPath)) {
      res.sendFile(frontendIndexPath);
    } else {
      res.status(404).json({ message: 'Frontend build not found. Run npm run build.' });
    }
  });
} else {
  // Fallback: no frontend build available
  app.get('/', (req, res) => {
    res.json({ message: 'Team Task Manager API is running...' });
  });
}

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Server error stack:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
