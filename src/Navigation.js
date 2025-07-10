
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './firebase.js';
import { useDarkMode } from './DarkModeContext.js';

function Navigation({ user }) {
  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Top bar styles
  const topBarStyle = {
    background: isDarkMode 
      ? 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '15px 20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1001,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backdropFilter: 'blur(10px)'
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

  const menuButtonStyle = {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '4px',
    transition: 'background-color 0.3s ease'
  };

  const userSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    color: 'white'
  };

  // Sidebar styles
  const sidebarStyle = {
    position: 'fixed',
    top: '70px',
    left: isOpen ? '0' : '-280px',
    width: '280px',
    height: 'calc(100vh - 70px)',
    background: isDarkMode 
      ? 'linear-gradient(180deg, #1a202c 0%, #2d3748 100%)'
      : 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
    transition: 'left 0.3s ease',
    zIndex: 1000,
    boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
    overflowY: 'auto'
  };

  const overlayStyle = {
    position: 'fixed',
    top: '70px',
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: isOpen ? 'block' : 'none',
    zIndex: 999
  };

  const navListStyle = {
    listStyle: 'none',
    padding: '20px 0',
    margin: 0
  };

  const navItemStyle = {
    margin: '5px 0'
  };

  const linkStyle = {
    color: 'rgba(255,255,255,0.9)',
    textDecoration: 'none',
    padding: '15px 25px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'all 0.3s ease',
    fontWeight: '500',
    fontSize: '1rem',
    borderLeft: '4px solid transparent'
  };

  const activeLinkStyle = {
    ...linkStyle,
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: 'white',
    fontWeight: 'bold',
    borderLeft: '4px solid white'
  };

  const sidebarFooterStyle = {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    right: '20px',
    borderTop: '1px solid rgba(255,255,255,0.2)',
    paddingTop: '20px'
  };

  const darkModeButtonStyle = {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: 'white',
    padding: '10px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1.2rem',
    transition: 'all 0.3s ease',
    width: '100%',
    marginBottom: '10px'
  };

  const logoutButtonStyle = {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  };

  const userInfoStyle = {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '0.9rem',
    marginBottom: '15px',
    textAlign: 'center',
    wordBreak: 'break-word'
  };

  return (
    <>
      {/* Top Bar */}
      <div style={topBarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button 
            onClick={toggleSidebar}
            style={menuButtonStyle}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ☰
          </button>
          <Link to="/" style={logoStyle}>
            💼 InvoiceApp
          </Link>
        </div>

        <div style={userSectionStyle}>
          <button 
            onClick={toggleDarkMode}
            style={{ 
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1.2rem',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.3)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <span style={{ fontSize: '0.9rem', opacity: '0.9', display: window.innerWidth > 768 ? 'block' : 'none' }}>
            Welcome, {user?.email?.split('@')[0] || 'User'}
          </span>
        </div>
      </div>

      {/* Overlay */}
      <div 
        style={overlayStyle} 
        onClick={toggleSidebar}
      />

      {/* Sidebar */}
      <div style={sidebarStyle}>
        <ul style={navListStyle}>
          <li style={navItemStyle}>
            <Link 
              to="/" 
              style={location.pathname === '/' ? activeLinkStyle : linkStyle}
              onClick={() => setIsOpen(false)}
              onMouseOver={(e) => {
                if (location.pathname !== '/') {
                  e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
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
          <li style={navItemStyle}>
            <Link 
              to="/products" 
              style={location.pathname === '/products' ? activeLinkStyle : linkStyle}
              onClick={() => setIsOpen(false)}
              onMouseOver={(e) => {
                if (location.pathname !== '/products') {
                  e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
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
          <li style={navItemStyle}>
            <Link 
              to="/clients" 
              style={location.pathname === '/clients' ? activeLinkStyle : linkStyle}
              onClick={() => setIsOpen(false)}
              onMouseOver={(e) => {
                if (location.pathname !== '/clients') {
                  e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
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
          <li style={navItemStyle}>
            <Link 
              to="/reports" 
              style={location.pathname === '/reports' ? activeLinkStyle : linkStyle}
              onClick={() => setIsOpen(false)}
              onMouseOver={(e) => {
                if (location.pathname !== '/reports') {
                  e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
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
          <li style={navItemStyle}>
            <Link 
              to="/company-settings" 
              style={location.pathname === '/company-settings' ? activeLinkStyle : linkStyle}
              onClick={() => setIsOpen(false)}
              onMouseOver={(e) => {
                if (location.pathname !== '/company-settings') {
                  e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
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

        <div style={sidebarFooterStyle}>
          <div style={userInfoStyle}>
            {user?.email || 'User'}
          </div>
          <button 
            onClick={toggleDarkMode}
            style={darkModeButtonStyle}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.3)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
          >
            {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
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
    </>
  );
}

export default Navigation;
