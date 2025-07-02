# Collaborative To-Do Board

A real-time collaborative task management application built with React and Node.js.

## Features

- 🚀 Real-time collaboration with Socket.IO
- 📋 Kanban board with drag & drop
- 👥 User management and task assignment
- 🤖 Smart task assignment
- ⚔️ Conflict resolution for simultaneous edits
- 📊 Activity tracking and notifications
- 📱 Responsive design

## Tech Stack

**Frontend:**
- React 18
- Socket.IO Client
- Custom CSS (no frameworks)

**Backend:**
- Node.js & Express
- PostgreSQL
- Socket.IO
- JWT Authentication
- bcryptjs

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

### Environment Variables

Create `.env` file in backend directory:

```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

## Local Development

1. Clone repository
2. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
3. Set up PostgreSQL database
4. Create `.env` file with database credentials
5. Start backend: `cd backend && npm run dev`
6. Start frontend: `cd frontend && npm start`

## Database Setup

The application automatically creates required tables on first run:
- users
- tasks  
- activity_logs

## Features Implementation

- **Smart Assign**: Assigns tasks to user with fewest active tasks
- **Conflict Resolution**: Handles simultaneous edits with merge options
- **Real-time Updates**: Live synchronization across all users
- **Activity Tracking**: Comprehensive logging of all user actions
- **Responsive Design**: Works on desktop, tablet, and mobile

## License

MIT License