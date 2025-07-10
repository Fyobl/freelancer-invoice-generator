
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './firebase.js';
import { useDarkMode } from './DarkModeContext.js';

function Navigation({ user }) {
  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navStyle = {
    background: isDarkMode ? 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '15px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    borderBottom: isDarkMode ? '1px solid #4a5568' : 'none'
  };

  const linkStyle = {
    color: isDarkMode ? '#a0aec0' : 'rgba(255,255,255,0.8)',
    textDecoration: 'none',
    margin: '0 15px',
    fontWeight: '500',
    transition: 'color 0.3s ease',
    fontSize: '16px'
  };

  const activeLinkStyle = {
    ...linkStyle,
    color: isDarkMode ? '#ffffff' : '#ffffff',
    fontWeight: 'bold',
    textShadow: '0 1px 3px rgba(0,0,0,0.3)'
  };

  const toggleButtonStyle = {
    background: isDarkMode ? '#4a5568' : 'rgba(255,255,255,0.2)',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    cursor: 'pointer',
    fontSize: '18px',
    marginRight: '15px',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return (
    <nav style={navStyle}>
      <div>
        <Link 
          to="/" 
          style={location.pathname === '/' ? activeLinkStyle : linkStyle}
        >
          📊 Dashboard
        </Link>
        <Link 
          to="/products" 
          style={location.pathname === '/products' ? activeLinkStyle : linkStyle}
        >
          📦 Products
        </Link>
        <Link 
          to="/clients" 
          style={location.pathname === '/clients' ? activeLinkStyle : linkStyle}
        >
          👥 Clients
        </Link>
        <Link 
          to="/reports" 
          style={location.pathname === '/reports' ? activeLinkStyle : linkStyle}
        >
          📈 Reports
        </Link>
        <Link 
          to="/company-settings" 
          style={location.pathname === '/company-settings' ? activeLinkStyle : linkStyle}
        >
          🏢 Company Settings
        </Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button 
          onClick={toggleDarkMode}
          style={toggleButtonStyle}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
        <span style={{ marginRight: '15px', color: isDarkMode ? '#a0aec0' : '#6c757d' }}>
          Welcome, {user?.email}
        </span>
        <button 
          onClick={handleLogout}
          style={{
            background: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'background-color 0.3s ease'
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navigation;
