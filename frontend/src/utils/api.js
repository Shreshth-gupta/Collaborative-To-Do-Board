const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// auth header helper
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  // auth stuff
  login: async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || `HTTP ${res.status}: ${res.statusText}` };
      }
      return data;
    } catch (err) {
      return { error: 'Network error: ' + err.message };
    }
  },

  register: async (username, email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || `HTTP ${res.status}: ${res.statusText}` };
      }
      return data;
    } catch (err) {
      return { error: 'Network error: ' + err.message };
    }
  },

  // task operations
  getTasks: async () => {
    const res = await fetch(`${API_BASE}/tasks`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  createTask: async (task) => {
    try {
      const response = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(task)
      });
      const data = await response.json();
      
      if (!response.ok) {
        return { error: data.error || `HTTP ${response.status}: ${response.statusText}` };
      }
      
      return data;
    } catch (err) {
      return { error: 'Network error: ' + err.message };
    }
  },

  updateTask: async (id, task) => {
    try {
      const response = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(task)
      });
      const data = await response.json();
      
      // Handle conflict (409) specifically
      if (response.status === 409) {
        return data; // This should contain the conflict data
      }
      
      if (!response.ok) {
        return { error: data.error || `HTTP ${response.status}: ${response.statusText}` };
      }
      
      return data;
    } catch (err) {
      return { error: 'Network error: ' + err.message };
    }
  },

  deleteTask: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (!response.ok) {
        return { error: data.error || `HTTP ${response.status}: ${response.statusText}` };
      }
      
      return data;
    } catch (err) {
      return { error: 'Network error: ' + err.message };
    }
  },

  smartAssign: async (id) => {
    const response = await fetch(`${API_BASE}/tasks/smart-assign/${id}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return response.json();
  },

  validateTitle: async (title, excludeId = null) => {
    const response = await fetch(`${API_BASE}/tasks/validate-title`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ title, excludeId })
    });
    return response.json();
  },

  // Users
  getUsers: async () => {
    const response = await fetch(`${API_BASE}/users`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  createUser: async (username, email) => {
    const response = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ username, email })
    });
    return response.json();
  },

  // Activity
  getActivity: async () => {
    const response = await fetch(`${API_BASE}/activity`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  getUnseenActivityCount: async () => {
    const response = await fetch(`${API_BASE}/activity/unseen-count`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  markActivitySeen: async () => {
    const response = await fetch(`${API_BASE}/activity/mark-seen`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return response.json();
  }
};