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
    background: isDarkMode 
      ? 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '15px 0',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    backdropFilter: 'blur(10px)'
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 30px'
  };

  const logoStyle = {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    color: 'white',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  };

  const navLinksStyle = {
    display: 'flex',
    listStyle: 'none',
    gap: '0',
    margin: 0,
    padding: 0,
    alignItems: 'center'
  };

  const linkStyle = {
    color: 'rgba(255,255,255,0.9)',
    textDecoration: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    fontWeight: '500',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const activeLinkStyle = {
    ...linkStyle,
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: 'white',
    fontWeight: 'bold'
  };

  const userSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    color: 'white'
  };

  const darkModeButtonStyle = {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1.2rem',
    transition: 'all 0.3s ease'
  };

  const logoutButtonStyle = {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.3s ease'
  };

  return (
    <nav style={navStyle}>
      <div style={containerStyle}>
        <Link to="/" style={logoStyle}>
          💼 InvoiceApp
        </Link>

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
              to="/company-settings" 
              style={location.pathname === '/company-settings' ? activeLinkStyle : linkStyle}
              onMouseOver={(e) => {
                if (location.pathname !== '/company-settings') {
                  e.target.style.backgroundColor = isDarkMode ? 'rgba(55,65,81,0.5)' : 'rgba(102,126,234,0.1)';
                }
              }}
              onMouseOut={(e) => {
                if (location.pathname !== '/company-settings') {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              ⚙️ Settings
            </Link>
          </li>
        </ul>

        <div style={userSectionStyle}>
          <button 
            onClick={toggleDarkMode}
            style={darkModeButtonStyle}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.3)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <span style={{ fontSize: '0.9rem', opacity: '0.9' }}>
            Welcome, {user?.email || 'User'}
          </span>
          <button 
            onClick={handleLogout}
            style={logoutButtonStyle}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.3)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;