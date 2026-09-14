const fs = require('fs');
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const { initSocket } = require('./services/socketService');
const { errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const commentRoutes = require('./routes/commentRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const fileRoutes = require('./routes/fileRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const activityRoutes = require('./routes/activityRoutes');

const app = express();
const server = http.createServer(app);

// CORS configuration supporting multiple domains, wildcards, and development
const configuredOrigins = env.CLIENT_URL
  ? env.CLIENT_URL.split(',').map((u) => u.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

const allowedOrigins = [
  ...configuredOrigins,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV !== 'production'
      ) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../', env.UPLOAD_DIR)));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/activity-logs', activityRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve frontend build in production (supports single-service deployment)
const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Centralized error handler
app.use(errorHandler);

// Initialize Socket.IO
initSocket(server, env.CLIENT_URL);

// Start server if executed directly
if (process.env.NODE_ENV !== 'test' && require.main === module) {
  connectDB().then(async () => {
    try {
      const User = require('./models/User');
      const count = await User.countDocuments();
      if (count === 0) {
        console.log('[Server] Database is empty. Seeding initial SaaS records...');
        const { seedDatabase } = require('./seeds/seedData');
        await seedDatabase(false);
      }
    } catch (seedErr) {
      console.warn('[Server] Auto-seed warning:', seedErr.message);
    }

    server.listen(env.PORT, () => {
      console.log(`=============================================`);
      console.log(`  SphereOps SaaS API Server Running on port ${env.PORT}`);
      console.log(`  Environment: ${env.NODE_ENV}`);
      console.log(`  Client Origin: ${env.CLIENT_URL}`);
      console.log(`=============================================`);
    });
  });
}

module.exports = { app, server };
