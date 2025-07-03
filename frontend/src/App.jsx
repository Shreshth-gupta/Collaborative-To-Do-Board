import React, { useState, useEffect } from 'react';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Board from './pages/Board.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
          padding: '20px'
        }}>
          <h1>🚨 Something went wrong</h1>
          <p>Please refresh the page to try again.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: '#fff',
              color: '#333',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            🔄 Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set page title
    document.title = 'Collaborative To-Do Board';
    
    // Simulate app initialization
    const initializeApp = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
          // Validate token is still valid
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('App initialization error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
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
        <LoadingSpinner size="large" message="Initializing workspace..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <NotificationProvider>
        {user ? (
          <Board user={user} onLogout={handleLogout} />
        ) : isLogin ? (
          <Login 
            onLogin={handleLogin} 
            switchToRegister={() => setIsLogin(false)} 
          />
        ) : (
          <Register 
            onLogin={handleLogin} 
            switchToLogin={() => setIsLogin(true)} 
          />
        )}
      </NotificationProvider>
    </ErrorBoundary>
  );
};

export default App;