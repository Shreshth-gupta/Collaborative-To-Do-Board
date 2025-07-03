import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

const TaskModal = ({ task, users, onSave, onClose, isConflict, conflictData, onUserAdded }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    assigned_user_id: '',
    status: 'Todo'
  });
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '' });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'Medium',
        assigned_user_id: task.assigned_user_id || '',
        status: task.status || 'Todo'
      });
    }
  }, [task]);

  const validateForm = async () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else {
      // Real-time validation for unique title
      const validation = await api.validateTitle(formData.title, task?.id);
      if (!validation.valid) {
        newErrors.title = validation.error;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTitleChange = async (newTitle) => {
    setFormData({...formData, title: newTitle});
    
    // Clear existing title error
    if (errors.title) {
      setErrors({...errors, title: ''});
    }
    
    // Validate title in real-time (debounced)
    if (newTitle.length >= 3) {
      setTimeout(async () => {
        const validation = await api.validateTitle(newTitle, task?.id);
        if (!validation.valid) {
          setErrors(prev => ({...prev, title: validation.error}));
        }
      }, 500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isConflict && selectedVersion) {
      setLoading(true);
      let finalData;
      if (selectedVersion === 'current') {
        finalData = { ...conflictData.current, version: conflictData.currentVersion };
      } else if (selectedVersion === 'yours') {
        finalData = { ...formData, version: conflictData.currentVersion };
      } else if (selectedVersion === 'merge') {
        finalData = { ...formData, version: conflictData.currentVersion };
      }
      await onSave(finalData, task?.id);
      setLoading(false);
      return;
    }
    
    if (!(await validateForm())) return;
    
    setLoading(true);
    await onSave(formData, task?.id);
    setLoading(false);
  };

  const handleMergeFields = (field, useYours = true) => {
    if (!isConflict) return;
    const value = useYours ? formData[field] : conflictData.current[field];
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddUser = async () => {
    if (!newUser.username.trim() || !newUser.email.trim()) return;
    
    setLoading(true);
    try {
      const result = await api.createUser(newUser.username.trim(), newUser.email.trim());
      if (result.error) {
        setErrors(prev => ({...prev, addUser: result.error}));
      } else {
        // Add new user to the list and select them
        onUserAdded(result.user);
        setFormData(prev => ({...prev, assigned_user_id: result.user.id}));
        setShowAddUser(false);
        setNewUser({ username: '', email: '' });
        alert(`Teammate added successfully!\nDefault password: password123\nThey can change it after first login.`);
      }
    } catch (error) {
      setErrors(prev => ({...prev, addUser: 'Failed to add teammate'}));
    } finally {
      setLoading(false);
    }
  };

  if (isConflict) {
    return (
      <div className="modal">
        <div className="modal-content">
          <h3>⚠️ Conflict Detected</h3>
          <p style={{textAlign: 'center', color: '#666', marginBottom: '25px'}}>
            Another user has modified this task while you were editing. Choose which version to keep:
          </p>
          
          <div className="conflict-resolution">
            <div className="conflict-options">
              <div 
                className={`conflict-option ${selectedVersion === 'current' ? 'selected' : ''}`}
                onClick={() => setSelectedVersion('current')}
              >
                <h4>🌐 Use Server Version</h4>
                <p>Keep the current version from the server (overwrite your changes)</p>
              </div>
              
              <div 
                className={`conflict-option ${selectedVersion === 'yours' ? 'selected' : ''}`}
                onClick={() => setSelectedVersion('yours')}
              >
                <h4>✏️ Use Your Version</h4>
                <p>Keep your local changes (overwrite server version)</p>
              </div>
              
              <div 
                className={`conflict-option ${selectedVersion === 'merge' ? 'selected' : ''}`}
                onClick={() => setSelectedVersion('merge')}
              >
                <h4>🔀 Merge Changes</h4>
                <p>Manually choose which fields to keep from each version</p>
              </div>
            </div>
            
            {selectedVersion === 'merge' && (
              <div className="merge-fields">
                <h4>Choose fields to merge:</h4>
                
                <div className="merge-field">
                  <label>Title:</label>
                  <div className="merge-options">
                    <button 
                      type="button"
                      className={`merge-btn ${formData.title === conflictData.current.title ? '' : 'selected'}`}
                      onClick={() => handleMergeFields('title', true)}
                    >
                      Your: "{formData.title}"
                    </button>
                    <button 
                      type="button"
                      className={`merge-btn ${formData.title === conflictData.current.title ? 'selected' : ''}`}
                      onClick={() => handleMergeFields('title', false)}
                    >
                      Server: "{conflictData.current.title}"
                    </button>
                  </div>
                </div>
                
                <div className="merge-field">
                  <label>Description:</label>
                  <div className="merge-options">
                    <button 
                      type="button"
                      className={`merge-btn ${formData.description === conflictData.current.description ? '' : 'selected'}`}
                      onClick={() => handleMergeFields('description', true)}
                    >
                      Your: "{formData.description || 'Empty'}"
                    </button>
                    <button 
                      type="button"
                      className={`merge-btn ${formData.description === conflictData.current.description ? 'selected' : ''}`}
                      onClick={() => handleMergeFields('description', false)}
                    >
                      Server: "{conflictData.current.description || 'Empty'}"
                    </button>
                  </div>
                </div>
                
                <div className="merge-field">
                  <label>Priority:</label>
                  <div className="merge-options">
                    <button 
                      type="button"
                      className={`merge-btn ${formData.priority === conflictData.current.priority ? '' : 'selected'}`}
                      onClick={() => handleMergeFields('priority', true)}
                    >
                      Your: {formData.priority}
                    </button>
                    <button 
                      type="button"
                      className={`merge-btn ${formData.priority === conflictData.current.priority ? 'selected' : ''}`}
                      onClick={() => handleMergeFields('priority', false)}
                    >
                      Server: {conflictData.current.priority}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="conflict-comparison">
              <div className="version-display">
                <h5>🌐 Server Version:</h5>
                <p><strong>Title:</strong> {conflictData.current.title}</p>
                <p><strong>Description:</strong> {conflictData.current.description || 'Empty'}</p>
                <p><strong>Status:</strong> {conflictData.current.status}</p>
                <p><strong>Priority:</strong> {conflictData.current.priority}</p>
              </div>
              
              <div className="version-display">
                <h5>✏️ Your Version:</h5>
                <p><strong>Title:</strong> {formData.title}</p>
                <p><strong>Description:</strong> {formData.description || 'Empty'}</p>
                <p><strong>Status:</strong> {formData.status}</p>
                <p><strong>Priority:</strong> {formData.priority}</p>
              </div>
            </div>
          </div>
          
          <div className="modal-actions">
            <button 
              className="btn" 
              onClick={handleSubmit} 
              disabled={!selectedVersion || loading}
            >
              {loading ? 'Saving...' : '💾 Save Selected Version'}
            </button>
            <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
              ❌ Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>{task ? '✏️ Edit Task' : '✨ Create New Task'}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Task Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter a descriptive title"
              required
              disabled={loading}
            />
            {errors.title && <div className="error-message">{errors.title}</div>}
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Add more details about this task..."
              rows="4"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Priority Level</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({...formData, priority: e.target.value})}
              disabled={loading}
            >
              <option value="Low">🟢 Low Priority</option>
              <option value="Medium">🟡 Medium Priority</option>
              <option value="High">🔴 High Priority</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Assign to Team Member</label>
            <select
              value={formData.assigned_user_id}
              onChange={(e) => {
                if (e.target.value === 'add_new') {
                  setShowAddUser(true);
                } else {
                  setFormData({...formData, assigned_user_id: e.target.value});
                }
              }}
              disabled={loading}
            >
              <option value="">👤 Unassigned</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>👤 {user.username}</option>
              ))}
              <option value="add_new" style={{borderTop: '1px solid #ccc'}}>➕ Add New Teammate</option>
            </select>
          </div>
          
          {showAddUser && (
            <div className="add-user-form">
              <h4>➕ Add New Teammate</h4>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  placeholder="Enter username"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="Enter email address"
                  disabled={loading}
                />
              </div>
              {errors.addUser && <div className="error-message">{errors.addUser}</div>}
              <div className="add-user-actions">
                <button 
                  type="button" 
                  className="btn btn-small"
                  onClick={handleAddUser}
                  disabled={loading || !newUser.username.trim() || !newUser.email.trim()}
                >
                  {loading ? 'Adding...' : '✓ Add Teammate'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-small"
                  onClick={() => {
                    setShowAddUser(false);
                    setNewUser({ username: '', email: '' });
                  }}
                  disabled={loading}
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          )}
          
          {task && (
            <div className="form-group">
              <label>Current Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                disabled={loading}
              >
                <option value="Todo">📋 Todo</option>
                <option value="In Progress">⚡ In Progress</option>
                <option value="Done">✅ Done</option>
              </select>
            </div>
          )}
          
          <div className="modal-actions">
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Saving...' : (task ? '💾 Update Task' : '✨ Create Task')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              ❌ Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;