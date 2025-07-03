import React, { useState } from 'react';

const TaskCard = ({ task, onEdit, onDelete, onSmartAssign, users }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.target.classList.add('dragging');
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
  };

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
    setTimeout(() => setIsFlipped(false), 2000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      className={`task-card ${isFlipped ? 'flipped' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
    >
      <div className="task-title">
        {task.title}
        <span className="task-date">{formatDate(task.created_at)}</span>
      </div>
      
      {task.description && (
        <div className="task-description">{task.description}</div>
      )}
      
      <div className="task-meta">
        <span className={`priority ${task.priority}`}>
          {task.priority === 'High' ? '🔴' : task.priority === 'Medium' ? '🟡' : '🟢'} {task.priority}
        </span>
        <span className="assigned-user">
          {task.assigned_username ? `👤 ${task.assigned_username}` : '👤 Unassigned'}
        </span>
      </div>
      
      <div className="task-actions">
        <button 
          className="btn btn-small" 
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          title="Edit Task"
        >
          ✏️ Edit
        </button>
        <button 
          className="btn btn-secondary btn-small" 
          onClick={(e) => {
            e.stopPropagation();
            onSmartAssign(task.id);
          }}
          title="Auto-assign to least busy user"
        >
          🤖 Smart
        </button>
        <button 
          className="btn btn-danger btn-small" 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          title="Delete Task"
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );
};

export default TaskCard;