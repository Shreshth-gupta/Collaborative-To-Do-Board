import React, { useState } from 'react';
import { api } from '../utils/api';

const Register = ({ onLogin, switchToLogin }) => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const result = await api.register(formData.username, formData.email, formData.password);
      if (result.error) {
        setError(result.error);
      } else {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        onLogin(result.user);
      }
    } catch (error) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Create Account</h2>
        <p style={{textAlign: 'center', color: '#666', marginBottom: '30px'}}>Join our collaborative workspace</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            placeholder="Choose a username"
            required
            disabled={loading}
            minLength={3}
          />
        </div>
        
        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="Enter your email"
            required
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            placeholder="Create a password (min 6 characters)"
            required
            disabled={loading}
            minLength={6}
          />
        </div>
        
        <button type="submit" className="btn" disabled={loading} style={{width: '100%', marginBottom: '20px'}}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
        
        <p style={{textAlign: 'center', color: '#666'}}>
          Already have an account?{' '}
          <button 
            type="button" 
            onClick={switchToLogin} 
            style={{
              background: 'none', 
              border: 'none', 
              color: '#667eea', 
              cursor: 'pointer',
              fontWeight: '600',
              textDecoration: 'underline'
            }}
            disabled={loading}
          >
            Sign In
          </button>
        </p>
      </form>
    </div>
  );
};

export default Register;