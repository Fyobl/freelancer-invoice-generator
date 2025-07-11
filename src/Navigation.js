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
    left: isOpen ? '0' : '-280px',
    width: '280px',
    height: '100vh',
    background: isDarkMode 
      ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' 
      : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    borderRight: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0',
    zIndex: 1000,
    transition: 'left 0.3s ease',
    boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column'
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
    top: '20px',
    left: '20px',
    background: isDarkMode 
      ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' 
      : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    border: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '12px',
    cursor: 'pointer',
    zIndex: 1001,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    color: isDarkMode ? '#f1f5f9' : '#1e293b',
    fontSize: '20px',
    transition: 'all 0.3s ease'
  };

  const logoStyle = {
    padding: '30px 20px',
    borderBottom: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0',
    textAlign: 'center'
  };

  const logoTextStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: isDarkMode ? '#f1f5f9' : '#1e293b',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  };

  const navLinksStyle = {
    flex: 1,
    padding: '20px 0',
    listStyle: 'none',
    margin: 0
  };

  const linkItemStyle = {
    margin: '5px 0'
  };

  const linkStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    color: isDarkMode ? '#e2e8f0' : '#475569',
    textDecoration: 'none',
    padding: '15px 25px',
    transition: 'all 0.3s ease',
    borderRadius: '0 25px 25px 0',
    margin: '2px 0',
    fontSize: '16px',
    fontWeight: '500'
  };

  const activeLinkStyle = {
    ...linkStyle,
    background: isDarkMode 
      ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
  };

  const footerStyle = {
    padding: '20px',
    borderTop: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  };

  const buttonStyle = {
    background: isDarkMode 
      ? 'linear-gradient(135deg, #64748b 0%, #475569 100%)' 
      : 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  };

  const darkModeButtonStyle = {
    background: isDarkMode ? '#fbbf24' : '#1f2937',
    color: isDarkMode ? '#111827' : '#f9fafb',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Overlay */}
      <div style={overlayStyle} onClick={toggleSidebar}></div>

      {/* Toggle Button */}
      <button onClick={toggleSidebar} style={toggleButtonStyle}>
        ☰
      </button>

      {/* Sidebar */}
      <nav style={sidebarStyle}>
        {/* Logo */}
        <div style={logoStyle}>
          <Link to="/dashboard" style={logoTextStyle} onClick={() => setIsOpen(false)}>
            <span>📋</span>
            <span>InvoiceGen</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <ul style={navLinksStyle}>
          <li style={linkItemStyle}>
            <Link 
              to="/dashboard" 
              style={isActive('/dashboard') ? activeLinkStyle : linkStyle}
              onClick={() => setIsOpen(false)}
            >
              <span>📊</span>
              <span>Dashboard</span>
            </Link>
          </li>
          <li style={linkItemStyle}>
            <Link 
              to="/clients" 
              style={isActive('/clients') ? activeLinkStyle : linkStyle}
              onClick={() => setIsOpen(false)}
            >
              <span>👥</span>
              <span>Clients</span>
            </Link>
          </li>
          <li style={linkItemStyle}>
            <Link 
              to="/products" 
              style={isActive('/products') ? activeLinkStyle : linkStyle}
              onClick={() => setIsOpen(false)}
            >
              <span>📦</span>
              <span>Products</span>
            </Link>
          </li>
          <li style={linkItemStyle}>
            <Link 
              to="/reports" 
              style={isActive('/reports') ? activeLinkStyle : linkStyle}
              onClick={() => setIsOpen(false)}
            >
              <span>📈</span>
              <span>Reports</span>
            </Link>
          </li>
          <li style={linkItemStyle}>
            <Link 
              to="/settings" 
              style={isActive('/settings') ? activeLinkStyle : linkStyle}
              onClick={() => setIsOpen(false)}
            >
              <span>⚙️</span>
              <span>Settings</span>
            </Link>
          </li>
        </ul>

        {/* Footer with Dark Mode Toggle and Logout */}
        <div style={footerStyle}>
          <button onClick={toggleDarkMode} style={darkModeButtonStyle}>
            <span>{isDarkMode ? '🌞' : '🌙'}</span>
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button onClick={handleLogout} style={buttonStyle}>
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
}

export default Navigation;