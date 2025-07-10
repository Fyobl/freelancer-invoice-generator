
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './firebase.js';
import { useDarkMode } from './DarkModeContext.js';

function Navigation({ user }) {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Styles
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
    display: isMenuOpen ? 'block' : 'none'
  };

  const sidebarStyle = {
    position: 'fixed',
    top: 0,
    left: isMenuOpen ? 0 : '-300px',
    width: '300px',
    height: '100vh',
    background: isDarkMode ? 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    boxShadow: '2px 0 10px rgba(0, 0, 0, 0.3)',
    transition: 'left 0.3s ease',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    color: 'white'
  };

  const menuToggleStyle = {
    position: 'fixed',
    top: '20px',
    left: '20px',
    background: isDarkMode ? 'rgba(26, 32, 44, 0.9)' : 'rgba(102, 126, 234, 0.9)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '18px',
    cursor: 'pointer',
    zIndex: 1001,
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.3s ease'
  };

  const headerStyle = {
    padding: '30px 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    textAlign: 'center'
  };

  const navStyle = {
    flex: 1,
    padding: '20px 0'
  };

  const linkStyle = {
    display: 'block',
    padding: '15px 25px',
    color: 'white',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '500',
    borderLeft: '4px solid transparent',
    transition: 'all 0.3s ease'
  };

  const activeLinkStyle = {
    ...linkStyle,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderLeft: '4px solid #ffffff'
  };

  const footerStyle = {
    padding: '20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
  };

  const buttonStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '10px',
    width: '100%'
  };

  const closeButtonStyle = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '5px',
    borderRadius: '4px',
    transition: 'background 0.3s ease'
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <button
        style={menuToggleStyle}
        onClick={toggleMenu}
        onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
      >
        ☰
      </button>

      <div style={overlayStyle} onClick={toggleMenu} />

      <div style={sidebarStyle}>
        <button
          style={closeButtonStyle}
          onClick={toggleMenu}
          onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          ×
        </button>

        <div style={headerStyle}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '1.5rem' }}>
            📋 Invoice App
          </h2>
          <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>
            Welcome, {user?.email}
          </p>
        </div>

        <nav style={navStyle}>
          <Link
            to="/dashboard"
            style={isActive('/dashboard') ? activeLinkStyle : linkStyle}
            onClick={toggleMenu}
            onMouseOver={(e) => !isActive('/dashboard') && (e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
            onMouseOut={(e) => !isActive('/dashboard') && (e.target.style.backgroundColor = 'transparent')}
          >
            🏠 Dashboard
          </Link>
          <Link
            to="/clients"
            style={isActive('/clients') ? activeLinkStyle : linkStyle}
            onClick={toggleMenu}
            onMouseOver={(e) => !isActive('/clients') && (e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
            onMouseOut={(e) => !isActive('/clients') && (e.target.style.backgroundColor = 'transparent')}
          >
            👥 Clients
          </Link>
          <Link
            to="/products"
            style={isActive('/products') ? activeLinkStyle : linkStyle}
            onClick={toggleMenu}
            onMouseOver={(e) => !isActive('/products') && (e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
            onMouseOut={(e) => !isActive('/products') && (e.target.style.backgroundColor = 'transparent')}
          >
            📦 Products
          </Link>
          <Link
            to="/reports"
            style={isActive('/reports') ? activeLinkStyle : linkStyle}
            onClick={toggleMenu}
            onMouseOver={(e) => !isActive('/reports') && (e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
            onMouseOut={(e) => !isActive('/reports') && (e.target.style.backgroundColor = 'transparent')}
          >
            📊 Reports
          </Link>
          <Link
            to="/settings"
            style={isActive('/settings') ? activeLinkStyle : linkStyle}
            onClick={toggleMenu}
            onMouseOver={(e) => !isActive('/settings') && (e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
            onMouseOut={(e) => !isActive('/settings') && (e.target.style.backgroundColor = 'transparent')}
          >
            ⚙️ Settings
          </Link>
        </nav>

        <div style={footerStyle}>
          <button
            style={buttonStyle}
            onClick={toggleDarkMode}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          >
            {isDarkMode ? '☀️' : '🌙'} {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            style={buttonStyle}
            onClick={handleSignOut}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(220, 53, 69, 0.2)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          >
            🚪 Sign Out
          </button>
        </div>
      </div>
    </>
  );
}

export default Navigation;
