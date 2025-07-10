
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './firebase.js';
import { useDarkMode } from './DarkModeContext.js';

function Navigation({ user }) {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      alert('Error logging out: ' + error.message);
    }
  };

  const navStyle = {
    background: isDarkMode ? 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '15px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    backdropFilter: 'blur(10px)',
    borderBottom: isDarkMode ? '1px solid #4a5568' : '1px solid rgba(255,255,255,0.2)',
    color: 'white'
  };

  const logoStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    textDecoration: 'none',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  };

  const linkStyle = {
    textDecoration: 'none',
    color: 'white',
    marginRight: '25px',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    padding: '8px 16px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  };

  const activeLinkStyle = {
    ...linkStyle,
    background: 'rgba(255,255,255,0.2)',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(255,255,255,0.1)'
  };

  const userMenuStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  };

  const darkModeToggleStyle = {
    background: isDarkMode ? '#4a5568' : 'rgba(255,255,255,0.2)',
    border: 'none',
    borderRadius: '25px',
    padding: '8px 16px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  };

  return (
    <nav style={navStyle}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link to="/" style={logoStyle}>
          💼 Invoice Generator
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center' }}>
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

      <div style={userMenuStyle}>
        <button 
          onClick={toggleDarkMode}
          style={darkModeToggleStyle}
          onMouseOver={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.background = isDarkMode ? '#5a6578' : 'rgba(255,255,255,0.3)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.background = isDarkMode ? '#4a5568' : 'rgba(255,255,255,0.2)';
          }}
        >
          {isDarkMode ? '☀️ Light' : '🌙 Dark'}
        </button>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '25px',
              padding: '8px 16px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}
          >
            👤 {user?.email || 'User'}
          </button>

          {showUserMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: '0',
              marginTop: '5px',
              background: isDarkMode ? '#2d3748' : 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: '150px',
              zIndex: 1000
            }}>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  background: 'transparent',
                  color: isDarkMode ? 'white' : '#333',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textAlign: 'left',
                  borderRadius: '8px',
                  transition: 'background 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = isDarkMode ? '#4a5568' : '#f7fafc';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'transparent';
                }}
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
