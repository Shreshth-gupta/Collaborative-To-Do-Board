const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { initDB } = require('./database');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [
          process.env.FRONTEND_URL,
          'https://collaborative-to-do.vercel.app',
          'https://collaborative-to-do-board.vercel.app',
          /https:\/\/collaborative-to-do.*\.vercel\.app$/,
          /https:\/\/collaborative-to-do-board.*\.vercel\.app$/
        ]
      : "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// CORS configuration
if (process.env.NODE_ENV === 'production') {
  app.use(cors({
    origin: [
      process.env.FRONTEND_URL,
      'https://collaborative-to-do.vercel.app',
      'https://collaborative-to-do-board.vercel.app',
      /https:\/\/collaborative-to-do.*\.vercel\.app$/,
      /https:\/\/collaborative-to-do-board.*\.vercel\.app$/
    ],
    credentials: true
  }));
} else {
  app.use(cors());
}

app.use(express.json());

// Socket.io middleware to make io available in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Collaborative To-Do Backend API',
    status: 'Running',
    endpoints: {
      auth: '/api/auth',
      tasks: '/api/tasks',
      activity: '/api/activity',
      users: '/api/users'
    }
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/users', require('./routes/users'));

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-board', () => {
    socket.join('board');
  });
  
  socket.on('task-updated', (data) => {
    socket.to('board').emit('task-updated', data);
  });
  
  socket.on('task-created', (data) => {
    socket.to('board').emit('task-created', data);
  });
  
  socket.on('task-deleted', (data) => {
    socket.to('board').emit('task-deleted', data);
  });
  
  socket.on('activity-logged', (data) => {
    socket.to('board').emit('activity-logged', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

initDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});