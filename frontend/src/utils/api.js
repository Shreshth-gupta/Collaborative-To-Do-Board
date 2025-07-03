const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  // Auth
  login: async (email, password) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  register: async (username, email, password) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    return response.json();
  },

  // Tasks
  getTasks: async () => {
    const response = await fetch(`${API_BASE}/tasks`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  createTask: async (task) => {
    const response = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(task)
    });
    return response.json();
  },

  updateTask: async (id, task) => {
    const response = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(task)
    });
    return response.json();
  },

  deleteTask: async (id) => {
    const response = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return response.json();
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