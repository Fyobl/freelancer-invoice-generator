
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './firebase.js';
import { useDarkMode } from './DarkModeContext.js';

function Navigation({ user }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
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
    background: isDarkMode ? 'rgba(15,15,35,0.95)' : 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(20px)',
    padding: '15px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: isDarkMode ? '1px solid #374151' : '1px solid rgba(255,255,255,0.2)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    boxShadow: isDarkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)'
  };

  const logoStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: isDarkMode ? '#ffffff' : '#333',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  };

  const navLinksStyle = {
    display: 'flex',
    gap: '25px',
    alignItems: 'center',
    listStyle: 'none',
    margin: 0,
    padding: 0
  };

  const linkStyle = {
    color: isDarkMode ? '#e5e7eb' : '#555',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '500',
    padding: '8px 16px',
    borderRadius: '8px',
    transition: 'all 0.3s ease'
  };

  const activeLinkStyle = {
    ...linkStyle,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  };

  const userMenuStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  };

  const darkModeToggleStyle = {
    background: isDarkMode ? 'rgba(55,65,81,0.8)' : 'rgba(255,255,255,0.2)',
    border: isDarkMode ? '1px solid #4b5563' : '1px solid rgba(255,255,255,0.3)',
    borderRadius: '25px',
    padding: '8px 16px',
    color: isDarkMode ? '#ffffff' : '#333',
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

      <ul style={navLinksStyle}>
        <li>
          <Link 
            to="/" 
            style={location.pathname === '/' ? activeLinkStyle : linkStyle}
            onMouseOver={(e) => {
              if (location.pathname !== '/') {
                e.target.style.backgroundColor = isDarkMode ? 'rgba(55,65,81,0.5)' : 'rgba(102,126,234,0.1)';
              }
            }}
            onMouseOut={(e) => {
              if (location.pathname !== '/') {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            📊 Dashboard
          </Link>
        </li>
        <li>
          <Link 
            to="/products" 
            style={location.pathname === '/products' ? activeLinkStyle : linkStyle}
            onMouseOver={(e) => {
              if (location.pathname !== '/products') {
                e.target.style.backgroundColor = isDarkMode ? 'rgba(55,65,81,0.5)' : 'rgba(102,126,234,0.1)';
              }
            }}
            onMouseOut={(e) => {
              if (location.pathname !== '/products') {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            📦 Products
          </Link>
        </li>
        <li>
          <Link 
            to="/clients" 
            style={location.pathname === '/clients' ? activeLinkStyle : linkStyle}
            onMouseOver={(e) => {
              if (location.pathname !== '/clients') {
                e.target.style.backgroundColor = isDarkMode ? 'rgba(55,65,81,0.5)' : 'rgba(102,126,234,0.1)';
              }
            }}
            onMouseOut={(e) => {
              if (location.pathname !== '/clients') {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            👥 Clients
          </Link>
        </li>
        <li>
          <Link 
            to="/reports" 
            style={location.pathname === '/reports' ? activeLinkStyle : linkStyle}
            onMouseOver={(e) => {
              if (location.pathname !== '/reports') {
                e.target.style.backgroundColor = isDarkMode ? 'rgba(55,65,81,0.5)' : 'rgba(102,126,234,0.1)';
              }
            }}
            onMouseOut={(e) => {
              if (location.pathname !== '/reports') {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            📈 Reports
          </Link>
        </li>
        <li>
          <Link 
            to="/settings" 
            style={location.pathname === '/settings' ? activeLinkStyle : linkStyle}
            onMouseOver={(e) => {
              if (location.pathname !== '/settings') {
                e.target.style.backgroundColor = isDarkMode ? 'rgba(55,65,81,0.5)' : 'rgba(102,126,234,0.1)';
              }
            }}
            onMouseOut={(e) => {
              if (location.pathname !== '/settings') {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            ⚙️ Settings
          </Link>
        </li>
      </ul>

      <div style={userMenuStyle}>
        <button 
          onClick={toggleDarkMode}
          style={darkModeToggleStyle}
          onMouseOver={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.background = isDarkMode ? 'rgba(75,85,99,0.8)' : 'rgba(255,255,255,0.3)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.background = isDarkMode ? 'rgba(55,65,81,0.8)' : 'rgba(255,255,255,0.2)';
          }}
        >
          {isDarkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
        
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            👤 {user?.email?.split('@')[0] || 'User'}
          </button>
          
          {showUserMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '10px',
              background: isDarkMode ? 'rgba(31,41,55,0.95)' : 'white',
              border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '15px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              backdropFilter: 'blur(20px)',
              minWidth: '200px'
            }}>
              <div style={{ 
                marginBottom: '10px', 
                paddingBottom: '10px', 
                borderBottom: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                color: isDarkMode ? '#ffffff' : '#333'
              }}>
                <strong>{user?.email}</strong>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  width: '100%'
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
