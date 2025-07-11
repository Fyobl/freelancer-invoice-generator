
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './firebase.js';
import { useDarkMode } from './DarkModeContext.js';

function Navigation({ user }) {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    background: isDarkMode 
      ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' 
      : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    backdropFilter: 'blur(20px)',
    borderBottom: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0',
    zIndex: 1000,
    padding: '10px 20px',
    boxShadow: isDarkMode 
      ? '0 4px 20px rgba(0,0,0,0.3)' 
      : '0 4px 20px rgba(0,0,0,0.1)'
  };

  const containerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const logoStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: isDarkMode ? '#f1f5f9' : '#1e293b',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  };

  const navLinksStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '30px',
    listStyle: 'none',
    margin: 0,
    padding: 0
  };

  const linkStyle = {
    color: isDarkMode ? '#e2e8f0' : '#475569',
    textDecoration: 'none',
    fontWeight: '500',
    padding: '8px 16px',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    position: 'relative'
  };

  const activeLinkStyle = {
    ...linkStyle,
    background: isDarkMode 
      ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
  };

  const buttonStyle = {
    background: isDarkMode 
      ? 'linear-gradient(135deg, #64748b 0%, #475569 100%)' 
      : 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    marginLeft: '20px'
  };

  const toggleButtonStyle = {
    background: isDarkMode ? '#fbbf24' : '#1f2937',
    color: isDarkMode ? '#111827' : '#f9fafb',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    marginLeft: '10px'
  };

  const mobileMenuStyle = {
    display: isMenuOpen ? 'block' : 'none',
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: isDarkMode 
      ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' 
      : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    borderBottom: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0',
    padding: '20px',
    boxShadow: isDarkMode 
      ? '0 4px 20px rgba(0,0,0,0.3)' 
      : '0 4px 20px rgba(0,0,0,0.1)'
  };

  const mobileNavLinksStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    listStyle: 'none',
    margin: 0,
    padding: 0
  };

  const hamburgerStyle = {
    display: 'none',
    flexDirection: 'column',
    cursor: 'pointer',
    padding: '5px',
    gap: '3px'
  };

  const hamburgerLineStyle = {
    width: '25px',
    height: '3px',
    background: isDarkMode ? '#f1f5f9' : '#1e293b',
    borderRadius: '2px',
    transition: 'all 0.3s ease'
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={navStyle}>
      <style>
        {`
          @media (max-width: 768px) {
            .desktop-nav { display: none !important; }
            .mobile-hamburger { display: flex !important; }
          }
          @media (min-width: 769px) {
            .mobile-menu { display: none !important; }
          }
        `}
      </style>
      <div style={containerStyle}>
        <Link to="/dashboard" style={logoStyle}>
          <span>📋</span>
          <span>InvoiceGen</span>
        </Link>

        {/* Desktop Navigation */}
        <ul className="desktop-nav" style={navLinksStyle}>
          <li>
            <Link 
              to="/dashboard" 
              style={isActive('/dashboard') ? activeLinkStyle : linkStyle}
            >
              📊 Dashboard
            </Link>
          </li>
          <li>
            <Link 
              to="/clients" 
              style={isActive('/clients') ? activeLinkStyle : linkStyle}
            >
              👥 Clients
            </Link>
          </li>
          <li>
            <Link 
              to="/products" 
              style={isActive('/products') ? activeLinkStyle : linkStyle}
            >
              📦 Products
            </Link>
          </li>
          <li>
            <Link 
              to="/reports" 
              style={isActive('/reports') ? activeLinkStyle : linkStyle}
            >
              📈 Reports
            </Link>
          </li>
          <li>
            <Link 
              to="/settings" 
              style={isActive('/settings') ? activeLinkStyle : linkStyle}
            >
              ⚙️ Settings
            </Link>
          </li>
        </ul>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={toggleDarkMode} style={toggleButtonStyle}>
            {isDarkMode ? '🌞' : '🌙'}
          </button>
          
          <button onClick={handleLogout} style={buttonStyle}>
            🚪 Logout
          </button>

          {/* Mobile Hamburger */}
          <div 
            className="mobile-hamburger" 
            style={hamburgerStyle}
            onClick={toggleMenu}
          >
            <div style={hamburgerLineStyle}></div>
            <div style={hamburgerLineStyle}></div>
            <div style={hamburgerLineStyle}></div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className="mobile-menu" style={mobileMenuStyle}>
        <ul style={mobileNavLinksStyle}>
          <li>
            <Link 
              to="/dashboard" 
              style={isActive('/dashboard') ? activeLinkStyle : linkStyle}
              onClick={() => setIsMenuOpen(false)}
            >
              📊 Dashboard
            </Link>
          </li>
          <li>
            <Link 
              to="/clients" 
              style={isActive('/clients') ? activeLinkStyle : linkStyle}
              onClick={() => setIsMenuOpen(false)}
            >
              👥 Clients
            </Link>
          </li>
          <li>
            <Link 
              to="/products" 
              style={isActive('/products') ? activeLinkStyle : linkStyle}
              onClick={() => setIsMenuOpen(false)}
            >
              📦 Products
            </Link>
          </li>
          <li>
            <Link 
              to="/reports" 
              style={isActive('/reports') ? activeLinkStyle : linkStyle}
              onClick={() => setIsMenuOpen(false)}
            >
              📈 Reports
            </Link>
          </li>
          <li>
            <Link 
              to="/settings" 
              style={isActive('/settings') ? activeLinkStyle : linkStyle}
              onClick={() => setIsMenuOpen(false)}
            >
              ⚙️ Settings
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navigation;
