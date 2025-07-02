# Real-Time Collaborative To-Do Board

A full-stack web application for collaborative task management with real-time synchronization.

## Features

### Backend (Node.js/Express + MySQL)
- **User Authentication**: Secure registration/login with JWT and bcrypt
- **Task Management**: CRUD operations with status tracking (Todo, In Progress, Done)
- **Real-Time Sync**: WebSocket integration using Socket.IO
- **Activity Logging**: Tracks all user actions with timestamps
- **Conflict Resolution**: Detects and handles concurrent edits
- **Smart Assignment**: Auto-assigns tasks to users with fewest active tasks

### Frontend (React)
- **Custom UI**: No third-party CSS frameworks, fully custom styling
- **Kanban Board**: Drag-and-drop interface with three columns
- **Real-Time Updates**: Live synchronization across all connected users
- **Activity Panel**: Shows last 20 actions in real-time
- **Conflict Handling**: UI for resolving edit conflicts
- **Responsive Design**: Works on desktop and mobile
- **Animations**: Smooth transitions and hover effects

### Unique Features
- **Smart Assign**: Automatically assigns tasks to least busy user
- **Conflict Detection**: Prevents data loss from concurrent edits
- **Validation**: Unique task titles, no column name conflicts
- **Real-Time Activity**: Live activity feed with user actions

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- MySQL (v8+)
- npm or yarn

### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   npm install
   ```

2. Configure MySQL database:
   - Create a MySQL database named `todo_app`
   - Update `.env` file with your database credentials

3. Start the server:
   ```bash
   npm run dev
   ```
   Server runs on http://localhost:5000

### Frontend Setup
1. Navigate to frontend directory:
   ```bash
   cd frontend
   npm install
   ```

2. Start the React app:
   ```bash
   npm start
   ```
   App runs on http://localhost:3000

### Database Schema
The application automatically creates the following tables:
- `users`: User accounts with authentication
- `tasks`: Task data with versioning for conflict detection
- `activity_logs`: Action history with JSON details

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Create Tasks**: Click "Add Task" to create new tasks with title, description, priority
3. **Manage Tasks**: Drag tasks between columns (Todo, In Progress, Done)
4. **Assign Tasks**: Use dropdown to assign tasks or "Smart Assign" button
5. **Real-Time Collaboration**: See changes from other users instantly
6. **Activity Tracking**: Monitor all actions in the activity panel
7. **Conflict Resolution**: Handle concurrent edits through conflict dialog

## Technical Implementation

### Real-Time Features
- Socket.IO for bidirectional communication
- Event-driven updates for tasks and activities
- Automatic reconnection handling

### Conflict Resolution
- Version-based optimistic locking
- Server-side conflict detection
- Client-side resolution interface

### Security
- JWT token authentication
- Password hashing with bcrypt
- SQL injection prevention with parameterized queries

### Performance
- Connection pooling for database
- Efficient real-time event handling
- Optimized React rendering with proper state management

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/smart-assign/:id` - Smart assign task

### Users & Activity
- `GET /api/users` - Get all users
- `GET /api/activity` - Get last 20 activities

## Architecture

```
Frontend (React)
├── Components (TaskCard, TaskModal, ActivityPanel)
├── Pages (Login, Register, Board)
├── Utils (API, Socket)
└── Custom CSS

Backend (Node.js/Express)
├── Routes (auth, tasks, users, activity)
├── Middleware (JWT authentication)
├── Database (MySQL with connection pooling)
└── Socket.IO (Real-time communication)
```

This implementation provides a complete collaborative to-do board with all required features including real-time synchronization, conflict handling, and custom business logic.