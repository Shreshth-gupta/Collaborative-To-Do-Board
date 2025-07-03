import React, { useState } from 'react';
import { api } from '../utils/api';

const Login = ({ onLogin, switchToRegister }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await api.login(formData.email, formData.password);
      if (result.error) {
        setError(result.error);
      } else {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        onLogin(result.user);
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Welcome Back</h2>
        <p style={{textAlign: 'center', color: '#666', marginBottom: '30px'}}>Sign in to your account</p>
        
        {error && <div className="error-message">{error}</div>}
        
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
            placeholder="Enter your password"
            required
            disabled={loading}
          />
        </div>
        
        <button type="submit" className="btn" disabled={loading} style={{width: '100%', marginBottom: '20px'}}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
        
        <p style={{textAlign: 'center', color: '#666'}}>
          Don't have an account?{' '}
          <button 
            type="button" 
            onClick={switchToRegister} 
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
            Create Account
          </button>
        </p>
      </form>
    </div>
  );
};

export default Login;