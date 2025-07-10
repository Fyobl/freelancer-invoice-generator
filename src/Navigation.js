import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './firebase.js';

function Navigation({ user }) {
  const location = useLocation();

  const handleLogout = () => {
    signOut(auth);
  };

  const navStyle = {
    background: '#f8f9fa',
    padding: '10px 20px',
    borderBottom: '1px solid #dee2e6',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const linkStyle = {
    margin: '0 15px',
    textDecoration: 'none',
    color: '#007bff',
    fontWeight: 'bold'
  };

  const activeLinkStyle = {
    ...linkStyle,
    color: '#0056b3',
    borderBottom: '2px solid #0056b3'
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
            padding: '5px 15px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navigation;