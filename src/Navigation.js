
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './firebase.js';
import { useDarkMode } from './DarkModeContext.js';

function Navigation({ user }) {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

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

  const sidebarStyle = {
    position: 'fixed',
    top: 0,
    left: isOpen ? '0' : '-300px',
    width: '300px',
    height: '100vh',
    background: isDarkMode 
      ? 'linear-gradient(180deg, #1a202c 0%, #2d3748 100%)' 
      : 'linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)',
    borderRight: isDarkMode ? '1px solid #4a5568' : '1px solid #e2e8f0',
    zIndex: 1000,
    transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    backdropFilter: 'blur(20px)'
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
    display: isOpen ? 'block' : 'none',
    transition: 'opacity 0.3s ease'
  };

  const toggleButtonStyle = {
    position: 'fixed',
    top: '24px',
    left: '24px',
    background: isDarkMode 
      ? 'rgba(26, 32, 44, 0.9)' 
      : 'rgba(255, 255, 255, 0.9)',
    border: isDarkMode ? '1px solid #4a5568' : '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '14px',
    cursor: 'pointer',
    zIndex: 1001,
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
    color: isDarkMode ? '#e2e8f0' : '#2d3748',
    fontSize: '20px',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(20px)',
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const logoStyle = {
    padding: '40px 30px',
    borderBottom: isDarkMode ? '1px solid #4a5568' : '1px solid #e2e8f0',
    textAlign: 'center'
  };

  const logoTextStyle = {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: isDarkMode ? '#ffffff' : '#1a202c',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    letterSpacing: '-0.025em'
  };

  const navLinksStyle = {
    flex: 1,
    padding: '30px 0',
    listStyle: 'none',
    margin: 0
  };

  const linkItemStyle = {
    margin: '4px 0'
  };

  const linkStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    color: isDarkMode ? '#cbd5e0' : '#4a5568',
    textDecoration: 'none',
    padding: '16px 30px',
    transition: 'all 0.3s ease',
    borderRadius: '0',
    margin: '0',
    fontSize: '16px',
    fontWeight: '500',
    position: 'relative'
  };

  const activeLinkStyle = {
    ...linkStyle,
    background: isDarkMode 
      ? 'linear-gradient(90deg, #3182ce 0%, #2b6cb0 100%)' 
      : 'linear-gradient(90deg, #4299e1 0%, #3182ce 100%)',
    color: '#ffffff',
    fontWeight: '600'
  };

  const footerStyle = {
    padding: '30px',
    borderTop: isDarkMode ? '1px solid #4a5568' : '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  };

  const buttonStyle = {
    background: isDarkMode 
      ? 'linear-gradient(90deg, #718096 0%, #4a5568 100%)' 
      : 'linear-gradient(90deg, #a0aec0 0%, #718096 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '14px 20px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  };

  const darkModeButtonStyle = {
    background: isDarkMode 
      ? 'linear-gradient(90deg, #f6ad55 0%, #ed8936 100%)' 
      : 'linear-gradient(90deg, #4a5568 0%, #2d3748 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '14px 20px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <div style={overlayStyle} onClick={toggleSidebar}></div>

      <button onClick={toggleSidebar} style={toggleButtonStyle}>
        ☰
      </button>

      <nav style={sidebarStyle}>
        <div style={logoStyle}>
          <Link to="/dashboard" style={logoTextStyle} onClick={() => setIsOpen(false)}>
            <span style={{fontSize: '2rem'}}>💼</span>
            <span>InvoicePro</span>
          </Link>
        </div>

        <ul style={navLinksStyle}>
          <li style={linkItemStyle}>
            <Link 
              to="/dashboard" 
              style={isActive('/dashboard') ? activeLinkStyle : linkStyle}
              onClick={() => setIsOpen(false)}
            >
              <span style={{fontSize: '18px'}}>📊</span>
              <span>Dashboard</span>
            </Link>
          </li>
          <li style={linkItemStyle}>
            <Link 
              to="/clients" 
              style={isActive('/clients') ? activeLinkStyle : linkStyle}
              onClick={() => setIsOpen(false)}
            >
              <span style={{fontSize: '18px'}}>👥</span>
              <span>Clients</span>
            </Link>
          </li>
          <li style={linkItemStyle}>
            <Link 
              to="/products" 
              style={isActive('/products') ? activeLinkStyle : linkStyle}
              onClick={() => setIsOpen(false)}
            >
              <span style={{fontSize: '18px'}}>📦</span>
              <span>Products</span>
            </Link>
          </li>
          <li style={linkItemStyle}>
            <Link 
              to="/reports" 
              style={isActive('/reports') ? activeLinkStyle : linkStyle}
              onClick={() => setIsOpen(false)}
            >
              <span style={{fontSize: '18px'}}>📈</span>
              <span>Reports</span>
            </Link>
          </li>
          <li style={linkItemStyle}>
            <Link 
              to="/settings" 
              style={isActive('/settings') ? activeLinkStyle : linkStyle}
              onClick={() => setIsOpen(false)}
            >
              <span style={{fontSize: '18px'}}>⚙️</span>
              <span>Settings</span>
            </Link>
          </li>
        </ul>

        <div style={footerStyle}>
          <button onClick={toggleDarkMode} style={darkModeButtonStyle}>
            <span>{isDarkMode ? '☀️' : '🌙'}</span>
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button onClick={handleLogout} style={buttonStyle}>
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </nav>
    </>
  );
}

export default Navigation;
