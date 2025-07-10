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
    padding: '20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    textAlign: 'center'
  };

  const navListStyle = {
    flex: 1,
    listStyle: 'none',
    padding: 0,
    margin: 0
  };

  const navItemStyle = {
    margin: 0
  };

  const linkStyle = {
    display: 'block',
    padding: '15px 20px',
    color: 'white',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
    borderLeft: '4px solid transparent'
  };

  const activeLinkStyle = {
    ...linkStyle,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderLeft: '4px solid #fff'
  };

  const footerStyle = {
    padding: '20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
  };

  const buttonStyle = {
    width: '100%',
    padding: '10px',
    margin: '5px 0',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  return (
    <>
      <button 
        style={menuToggleStyle} 
        onClick={toggleMenu}
        onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
      >
        ☰
      </button>

      {isMenuOpen && <div style={overlayStyle} onClick={toggleMenu}></div>}

      <nav style={sidebarStyle}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Invoice App</h2>
          <p style={{ margin: '5px 0 0 0', opacity: 0.8, fontSize: '0.9rem' }}>
            Welcome, {user?.email}
          </p>
        </div>

        <ul style={navListStyle}>
          <li style={navItemStyle}>
            <Link 
              to="/" 
              style={location.pathname === '/' ? activeLinkStyle : linkStyle}
              onClick={toggleMenu}
            >
              📊 Dashboard
            </Link>
          </li>
          <li style={navItemStyle}>
            <Link 
              to="/products" 
              style={location.pathname === '/products' ? activeLinkStyle : linkStyle}
              onClick={toggleMenu}
            >
              📦 Products
            </Link>
          </li>
          <li style={navItemStyle}>
            <Link 
              to="/clients" 
              style={location.pathname === '/clients' ? activeLinkStyle : linkStyle}
              onClick={toggleMenu}
            >
              👥 Clients
            </Link>
          </li>
          <li style={navItemStyle}>
            <Link 
              to="/reports" 
              style={location.pathname === '/reports' ? activeLinkStyle : linkStyle}
              onClick={toggleMenu}
            >
              📈 Reports
            </Link>
          </li>
          <li style={navItemStyle}>
            <Link 
              to="/company-settings" 
              style={location.pathname === '/company-settings' ? activeLinkStyle : linkStyle}
              onClick={toggleMenu}
            >
              ⚙️ Settings
            </Link>
          </li>
        </ul>

        <div style={footerStyle}>
          <button 
            style={buttonStyle} 
            onClick={toggleDarkMode}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          >
            {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
          <button 
            style={buttonStyle} 
            onClick={handleSignOut}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(220, 53, 69, 0.3)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          >
            🚪 Sign Out
          </button>
        </div>
      </nav>
    </>
  );
}

export default Navigation;