# Collaborative To-Do Board

A real-time collaborative task management application where teams can work together on a shared kanban board. Built this because I got tired of using heavy project management tools for simple task tracking.

## Project Overview

This is a full-stack web app that lets multiple users collaborate on tasks in real-time. Think Trello but simpler and with better conflict handling. Users can create tasks, drag them between columns (Todo, In Progress, Done), assign them to team members, and see what everyone else is doing through live updates.

The main challenge I wanted to solve was the "edit collision" problem - when two people try to edit the same task at the same time. Most apps either lose data or create duplicates. This one actually handles it properly.

## Tech Stack

**Frontend:**
- React 18 (hooks, context API)
- Socket.IO Client (real-time updates)
- Custom CSS (no Bootstrap or Tailwind - wanted full control)
- Vanilla drag & drop API

**Backend:**
- Node.js & Express
- PostgreSQL (with connection pooling)
- Socket.IO (WebSocket fallback)
- JWT Authentication
- bcryptjs for password hashing

**Database:**
- PostgreSQL hosted on Supabase
- Three main tables: users, tasks, activity_logs
- Uses ENUM types for task status and priority

## Features

### Core Features
- ✅ **Real-time collaboration** - See changes instantly across all connected users
- ✅ **Drag & drop kanban board** - Move tasks between Todo, In Progress, and Done
- ✅ **User management** - Register, login, assign tasks to specific users
- ✅ **Task management** - Create, edit, delete tasks with title, description, priority
- ✅ **Activity tracking** - See who did what and when
- ✅ **Responsive design** - Works on desktop, tablet, and mobile

### Advanced Features
- 🤖 **Smart Auto-Assign** - Automatically assigns tasks to the user with the least workload
- ⚔️ **Conflict Resolution** - Handles simultaneous edits without losing data
- 🔔 **Live Notifications** - Toast notifications for important events
- 📊 **Activity Feed** - Real-time activity log with user actions
- 🎯 **Task Validation** - Prevents duplicate titles and invalid data

## Setup and Installation

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database (I use Supabase but any Postgres works)
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd collaborative-to-do-board
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Environment Variables Setup**
   
   Create a `.env` file in the `backend` directory:
   ```env
   # Database Configuration
   DATABASE_URL=postgresql://username:password@host:port/database
   
   # JWT Secret (generate a random string)
   JWT_SECRET=your-super-secret-jwt-key-here
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:3000
   ```

   **How to get these values:**
   - `DATABASE_URL`: Get from your PostgreSQL provider (Supabase, Railway, etc.)
   - `JWT_SECRET`: Generate with `openssl rand -hex 64` or use any long random string
   - `PORT`: 5000 is fine for local development
   - `FRONTEND_URL`: Your React app URL (usually http://localhost:3000)

4. **Database Setup**
   
   The app automatically creates tables on first run, but you need a PostgreSQL database first:
   
   **Option A: Using Supabase (Recommended)**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Go to Settings > Database
   - Copy the connection string
   
   **Option B: Local PostgreSQL**
   ```bash
   # Install PostgreSQL locally
   createdb collaborative_todo
   # Use: postgresql://username:password@localhost:5432/collaborative_todo
   ```

5. **Start the backend server**
   ```bash
   npm run dev
   ```
   
   You should see:
   ```
   connecting to db...
   db connected!
   Database initialized successfully
   Server running on port 5000
   ```

### Frontend Setup

1. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

2. **Environment Variables (Optional)**
   
   Create `.env` file in `frontend` directory if your backend isn't on localhost:5000:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

3. **Start the frontend**
   ```bash
   npm start
   ```
   
   Opens browser at http://localhost:3000

### Verification

1. Open http://localhost:3000
2. Register a new account
3. Create a task
4. Open another browser tab, login with different account
5. You should see the task appear in real-time

## Usage Guide

### Getting Started
1. **Register/Login** - Create account or login with existing credentials
2. **Create Tasks** - Click "✨ Add Task" button
3. **Drag & Drop** - Move tasks between columns by dragging
4. **Assign Tasks** - Edit task to assign to specific user or use Smart Assign
5. **Track Activity** - Click activity button to see what everyone's doing

### Task Management
- **Creating**: Fill out title (required), description, priority, and assignee
- **Editing**: Click "✏️ Edit" on any task card
- **Deleting**: Click "🗑️ Delete" (asks for confirmation)
- **Moving**: Drag task cards between Todo, In Progress, Done columns

### User Management
- **Adding Users**: Use the "Add User" form in task creation modal
- **Assigning Tasks**: Select user from dropdown or use Smart Assign feature

## Smart Assign Logic

The Smart Assign feature automatically assigns tasks to the user with the least workload. Here's how it works:

```sql
SELECT u.id, u.username, COUNT(t.id) as task_count
FROM users u
LEFT JOIN tasks t ON u.id = t.assigned_user_id AND t.status != 'Done'
GROUP BY u.id, u.username
ORDER BY task_count ASC
LIMIT 1
```

**Algorithm:**
1. Count active tasks (not "Done") for each user
2. Find user with lowest count
3. Assign task to that user
4. Update task version and log activity

**Why this works:**
- Distributes workload evenly
- Considers only active tasks (Done tasks don't count)
- Handles new users (they get 0 count)
- Simple but effective for small teams

## Conflict Resolution System

This was the trickiest part to get right. When two users edit the same task simultaneously, here's what happens:

### Version-Based Conflict Detection

Each task has a `version` number that increments on every update:

```javascript
// Before updating, check if version matches
if (currentTask.version !== submittedVersion) {
  return res.status(409).json({ 
    error: 'Conflict detected', 
    currentVersion: currentTask.version,
    currentTask: currentTask
  });
}
```

### Conflict Resolution Options

When conflict detected, user gets three choices:

1. **Use Current Version** - Discard your changes, keep what's in database
2. **Use Your Version** - Overwrite database with your changes
3. **Merge Changes** - Pick and choose fields from both versions

### Implementation Details

**Frontend Conflict Handling:**
```javascript
if (result.error === 'Conflict detected') {
  setConflictData({ 
    current: result.currentTask, 
    yours: taskData,
    currentVersion: result.currentVersion
  });
  // Show conflict resolution UI
}
```

**Why This Works:**
- Prevents data loss (most important)
- Gives user control over resolution
- Shows exactly what changed
- Maintains data integrity
- Better UX than "save failed" errors

### Real-World Example

1. User A opens task "Fix login bug"
2. User B opens same task
3. User A changes title to "Fix authentication issue"
4. User B changes description and tries to save
5. System detects conflict (versions don't match)
6. User B sees both versions and can choose how to merge

## Environment Variables Reference

### Backend (.env)
```env
# Required
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-secret-key

# Optional
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```env
# Optional - only if backend not on localhost:5000
REACT_APP_API_URL=http://localhost:5000/api
```

### Production Environment Variables

For deployment (Vercel, Heroku, etc.):

```env
# Backend
DATABASE_URL=your-production-db-url
JWT_SECRET=your-production-jwt-secret
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com

# Frontend
REACT_APP_API_URL=https://your-backend-domain.com/api
```

## Database Schema

The app creates these tables automatically:

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status task_status DEFAULT 'Todo',
  priority task_priority DEFAULT 'Medium',
  assigned_user_id INT REFERENCES users(id),
  created_by INT REFERENCES users(id),
  version INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity logs
CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  task_id INT REFERENCES tasks(id),
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Troubleshooting

### Common Issues

**"Database connection failed"**
- Check DATABASE_URL format
- Verify database exists and is accessible
- Check firewall/network settings

**"Socket connection failed"**
- Check if backend is running on correct port
- Verify CORS settings
- Check browser console for errors

**"JWT token invalid"**
- Clear localStorage and login again
- Check JWT_SECRET matches between sessions

**"Tasks not updating in real-time"**
- Check WebSocket connection in browser dev tools
- Verify Socket.IO is working (fallback to polling)

### Development Tips

- Use `npm run dev` for backend (nodemon auto-restart)
- Check browser console for frontend errors
- Use PostgreSQL logs for database issues
- Test with multiple browser tabs for real-time features

## License

MIT License - feel free to use this for your own projects!