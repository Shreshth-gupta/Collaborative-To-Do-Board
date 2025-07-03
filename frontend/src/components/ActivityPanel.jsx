import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

const ActivityPanel = ({ activities, socket }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);

  // Listen for real-time activity updates
  useEffect(() => {
    if (socket && socket.on && typeof socket.on === 'function') {
      const handleActivityLogged = () => {
        if (!isOpen) {
          loadUnseenCount();
        }
      };
      
      socket.on('activity-logged', handleActivityLogged);
      
      return () => {
        if (socket && socket.off && typeof socket.off === 'function') {
          socket.off('activity-logged', handleActivityLogged);
        }
      };
    }
  }, [socket, isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.activity-dropdown')) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Load unseen count on mount
  useEffect(() => {
    loadUnseenCount();
  }, []);

  // Poll for unseen count every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadUnseenCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUnseenCount = async () => {
    try {
      const result = await api.getUnseenActivityCount();
      setUnseenCount(result.count || 0);
    } catch (error) {
      console.error('Failed to load unseen count:', error);
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return activityTime.toLocaleDateString();
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'create': return '✨';
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      case 'smart_assign': return '🤖';
      case 'drag_drop': return '🔄';
      case 'assign': return '👤';
      case 'unassign': return '🚫';
      default: return '📝';
    }
  };

  const getActionText = (activity) => {
    const details = typeof activity.details === 'string' ? JSON.parse(activity.details) : activity.details;
    
    switch (activity.action) {
      case 'create':
        return `created "${details.title}"`;
      case 'update':
        return `updated "${activity.task_title || 'a task'}"`;
      case 'delete':
        return `deleted a task`;
      case 'smart_assign':
        return `auto-assigned task to ${details.assigned_to}`;
      case 'drag_drop':
        return `moved "${activity.task_title}" from ${details.from_status} to ${details.to_status}`;
      case 'assign':
        return `assigned "${activity.task_title}" to someone`;
      case 'unassign':
        return `unassigned "${activity.task_title}"`;
      default:
        return activity.action;
    }
  };

  const handleToggle = async () => {
    if (!isOpen) {
      // Opening dropdown - mark activities as seen
      try {
        await api.markActivitySeen();
        setUnseenCount(0);
      } catch (error) {
        console.error('Failed to mark activities as seen:', error);
      }
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="activity-dropdown">
      <button 
        className="btn btn-secondary activity-toggle"
        onClick={handleToggle}
      >
        📊 Activity
        {unseenCount > 0 && (
          <span className="activity-badge">{unseenCount}</span>
        )}
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div className="activity-dropdown-content">
          <div className="activity-dropdown-header">
            <h4>📊 Recent Activity</h4>
          </div>
          <div className="activity-list">
            {activities.length === 0 ? (
              <div className="activity-item" style={{textAlign: 'center', color: '#888'}}>
                😴 No recent activity
              </div>
            ) : (
              activities.slice(0, 10).map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-content">
                    <span className="activity-icon">{getActionIcon(activity.action)}</span>
                    <span className="activity-user">{activity.username}</span>
                    <span className="activity-text">{getActionText(activity)}</span>
                  </div>
                  <div className="activity-time">{formatTime(activity.created_at)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityPanel;