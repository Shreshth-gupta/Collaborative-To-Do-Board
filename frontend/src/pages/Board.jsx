import React, { useState, useEffect, useCallback } from 'react';
import TaskCard from '../components/TaskCard.jsx';
import TaskModal from '../components/TaskModal.jsx';
import ActivityPanel from '../components/ActivityPanel.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { api } from '../utils/api';
import socketService from '../utils/socket';
import { useNotification } from '../contexts/NotificationContext.jsx';

const Board = ({ user, onLogout }) => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [conflictData, setConflictData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showSuccess, showError, showInfo } = useNotification();

  const [socket, setSocket] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [tasks, users, activities] = await Promise.all([
        api.getTasks(),
        api.getUsers(),
        api.getActivity()
      ]);
      setTasks(tasks);
      setUsers(users);
      setActivities(activities);
    } catch (err) {
      console.error('data load failed:', err);
      showError('Failed to load workspace data');
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    const initializeApp = async () => {
      await loadData();
      
      // setup socket stuff
      try {
        const sock = socketService.connect();
        setSocket(sock);
        
        if (sock && typeof sock.on === 'function') {
          sock.on('task-created', (task) => {
            setTasks(prev => [...prev, task]);
            loadActivities();
          });
          
          sock.on('task-updated', (task) => {
            setTasks(prev => prev.map(t => t.id === task.id ? task : t));
            loadActivities();
          });
          
          sock.on('task-deleted', (data) => {
            setTasks(prev => prev.filter(t => t.id !== data.id));
            loadActivities();
          });
          
          sock.on('activity-logged', () => {
            loadActivities();
          });
          
          sock.on('connect_error', (error) => {
            console.warn('Socket connection error:', error);
            showInfo('Real-time updates temporarily unavailable');
          });
        }
      } catch (error) {
        console.warn('Socket initialization failed:', error);
        showInfo('Real-time features unavailable - using polling instead');
        
        // Fallback to polling if socket fails
        const pollInterval = setInterval(() => {
          loadTasks();
          loadActivities();
        }, 10000);
        
        return () => clearInterval(pollInterval);
      }
    };
    
    initializeApp();
    
    return () => {
      socketService.disconnect();
      setSocket(null);
    };
  }, [loadData, showInfo]);

  const loadTasks = async () => {
    try {
      const tasksData = await api.getTasks();
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const loadActivities = async () => {
    try {
      const activitiesData = await api.getActivity();
      setActivities(activitiesData);
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setShowModal(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const handleUserAdded = (newUser) => {
    setUsers(prev => [...prev, newUser]);
  };

  const handleSaveTask = async (taskData, taskId) => {
    try {
      if (taskId) {
        // Use the version from taskData if it exists (conflict resolution), otherwise use editingTask version
        const versionToUse = taskData.version || editingTask.version;
        console.log('Saving task with data:', { ...taskData, version: versionToUse });
        
        const result = await api.updateTask(taskId, { ...taskData, version: versionToUse });
        console.log('Update result:', result);
        
        if (result.error === 'Conflict detected') {
          console.log('Conflict detected, setting conflict data');
          setConflictData({ 
            current: result.currentTask, 
            yours: taskData,
            currentVersion: result.currentVersion
          });
          return;
        }
        
        if (result.error) {
          console.error('Update error:', result.error);
          showError(result.error);
          return;
        }
        
        setTasks(prev => prev.map(t => t.id === taskId ? result : t));
        socketService.emit('task-updated', result);
        loadActivities();
        showSuccess('Task updated successfully!');
      } else {
        const result = await api.createTask(taskData);
        if (result.error) {
          showError(result.error);
          return;
        }
        setTasks(prev => [...prev, result]);
        socketService.emit('task-created', result);
        loadActivities();
        showSuccess('Task created successfully!');
      }
      setShowModal(false);
      setEditingTask(null);
      setConflictData(null);
    } catch (error) {
      console.error('Failed to save task:', error);
      showError('Failed to save task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const result = await api.deleteTask(taskId);
        if (result.error) {
          showError(result.error);
          return;
        }
        setTasks(prev => prev.filter(t => t.id !== taskId));
        socketService.emit('task-deleted', { id: taskId });
        showSuccess('Task deleted successfully!');
        loadActivities();
      } catch (error) {
        console.error('Failed to delete task:', error);
        showError('Failed to delete task');
      }
    }
  };

  const handleSmartAssign = async (taskId) => {
    try {
      const result = await api.smartAssign(taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? result : t));
      socketService.emit('task-updated', result);
      loadActivities();
    } catch (error) {
      console.error('Failed to smart assign:', error);
    }
  };

  const handleDrop = async (e, status) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData('text/plain'));
    const task = tasks.find(t => t.id === taskId);
    
    if (task && task.status !== status) {
      try {
        const updatedTask = { ...task, status, version: task.version };
        const result = await api.updateTask(taskId, updatedTask);
        setTasks(prev => prev.map(t => t.id === taskId ? result : t));
        socketService.emit('task-updated', result);
        loadActivities();
      } catch (error) {
        console.error('Failed to update task status:', error);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <LoadingSpinner size="large" message="Loading your workspace..." />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '10px', verticalAlign: 'middle'}}>
            <path d="M3.35288 8.95043C4.00437 6.17301 6.17301 4.00437 8.95043 3.35287C10.9563 2.88237 13.0437 2.88237 15.0496 3.35287C17.827 4.00437 19.9956 6.17301 20.6471 8.95043C21.1176 10.9563 21.1176 13.0437 20.6471 15.0496C19.9956 17.827 17.827 19.9956 15.0496 20.6471C13.0437 21.1176 10.9563 21.1176 8.95044 20.6471C6.17301 19.9956 4.00437 17.827 3.35288 15.0496C2.88237 13.0437 2.88237 10.9563 3.35288 8.95043Z" stroke="#0095FF" strokeWidth="1.5"/>
            <path d="M3.35288 8.95043C2.88237 10.9563 2.88237 13.0437 3.35288 15.0496C4.00437 17.827 6.17301 19.9956 8.95044 20.6471C10.9563 21.1176 13.0437 21.1176 15.0496 20.6471C17.827 19.9956 19.9956 17.827 20.6471 15.0496C21.1176 13.0437 21.1176 10.9563 20.6471 8.95043C19.9956 6.17301 17.827 4.00437 15.0496 3.35287" stroke="#363853" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M7.84912 8.86907C7.55622 8.57618 7.08135 8.57618 6.78846 8.86907C6.49556 9.16197 6.49556 9.63684 6.78846 9.92973L7.84912 8.86907ZM8.35906 10.4397L7.82873 10.97C7.96938 11.1107 8.16015 11.1897 8.35906 11.1897C8.55797 11.1897 8.74874 11.1107 8.88939 10.97L8.35906 10.4397ZM10.9699 8.88946C11.2628 8.59657 11.2628 8.12169 10.9699 7.8288C10.677 7.53591 10.2022 7.53591 9.90928 7.8288L10.9699 8.88946ZM13.0403 9.16954C12.6261 9.16954 12.2903 9.50533 12.2903 9.91954C12.2903 10.3338 12.6261 10.6695 13.0403 10.6695V9.16954ZM16.6812 10.6695C17.0955 10.6695 17.4312 10.3338 17.4312 9.91954C17.4312 9.50533 17.0955 9.16954 16.6812 9.16954V10.6695ZM7.84912 14.0704C7.55622 13.7775 7.08135 13.7775 6.78846 14.0704C6.49556 14.3633 6.49556 14.8382 6.78846 15.1311L7.84912 14.0704ZM8.35906 15.641L7.82873 16.1714C8.12162 16.4643 8.5965 16.4643 8.88939 16.1714L8.35906 15.641ZM10.9699 14.0908C11.2628 13.7979 11.2628 13.3231 10.9699 13.0302C10.677 12.7373 10.2022 12.7373 9.90928 13.0302L10.9699 14.0908ZM13.0403 14.3709C12.6261 14.3709 12.2903 14.7067 12.2903 15.1209C12.2903 15.5351 12.6261 15.8709 13.0403 15.8709V14.3709ZM16.6812 15.8709C17.0955 15.8709 17.4312 15.5351 17.4312 15.1209C17.4312 14.7067 17.0955 14.3709 16.6812 14.3709V15.8709ZM6.78846 9.92973L7.82873 10.97L8.88939 9.90935L7.84912 8.86907L6.78846 9.92973ZM8.88939 10.97L10.9699 8.88946L9.90928 7.8288L7.82873 9.90935L8.88939 10.97ZM13.0403 10.6695H16.6812V9.16954H13.0403V10.6695ZM6.78846 15.1311L7.82873 16.1714L8.88939 15.1107L7.84912 14.0704L6.78846 15.1311ZM8.88939 16.1714L10.9699 14.0908L9.90928 13.0302L7.82873 15.1107L8.88939 16.1714ZM13.0403 15.8709H16.6812V14.3709H13.0403V15.8709Z" fill="#0095FF"/>
          </svg>
          Collaborative To-Do Board
        </h1>
        <div className="header-actions">
          <span className="welcome-text">Welcome, {user.username}! 👋</span>
          <button className="btn" onClick={handleCreateTask}>✨ Add Task</button>
          <ActivityPanel activities={activities} socket={socket} />
          <button className="btn btn-secondary" onClick={onLogout}>🚪 Logout</button>
        </div>
      </div>

      <div className="board">
        {['Todo', 'In Progress', 'Done'].map(status => (
          <div
            key={status}
            className="column"
            onDrop={(e) => handleDrop(e, status)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <h3>{status}</h3>
            {getTasksByStatus(status).map(task => (
              <TaskCard
                key={task.id}
                task={task}
                users={users}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onSmartAssign={handleSmartAssign}
              />
            ))}
          </div>
        ))}
      </div>

      {showModal && (
        <TaskModal
          task={editingTask}
          users={users}
          onSave={handleSaveTask}
          onClose={() => {
            setShowModal(false);
            setEditingTask(null);
            setConflictData(null);
          }}
          isConflict={!!conflictData}
          conflictData={conflictData}
          onUserAdded={handleUserAdded}
        />
      )}
    </div>
  );
};

export default Board;