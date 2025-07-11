import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDarkMode } from './DarkModeContext.js';

const Navigation = ({ user }) => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: '📊' },
    { path: '/products', name: 'Products', icon: '📦' },
    { path: '/clients', name: 'Clients', icon: '👥' },
    { path: '/reports', name: 'Reports', icon: '📈' },
    { path: '/company-settings', name: 'Settings', icon: '⚙️' }
  ];

  const sidebarStyle = {
    position: 'fixed',
    top: 0,
    left: isSidebarOpen ? 0 : '-280px',
    width: '280px',
    height: '100vh',
    backgroundColor: 'var(--bg-primary)',
    borderRight: '1px solid var(--border-color)',
    transition: 'all 0.3s ease',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-lg)'
  };

  const headerStyle = {
    padding: '2rem 1.5rem',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };

  const logoStyle = {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const navStyle = {
    flex: 1,
    padding: '1rem 0',
    overflowY: 'auto'
  };

  const menuItemStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.875rem 1.5rem',
    color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
    borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
    backgroundColor: isActive ? 'rgb(59 130 246 / 0.05)' : 'transparent',
    fontWeight: isActive ? '600' : '500'
  });

  const footerStyle = {
    padding: '1.5rem',
    borderTop: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  };

  const toggleButtonStyle = {
    position: 'fixed',
    top: '1rem',
    left: isSidebarOpen ? '290px' : '1rem',
    zIndex: 1001,
    backgroundColor: 'var(--accent-primary)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-lg)',
    transition: 'all 0.3s ease',
    fontSize: '1.25rem'
  };

  const themeToggleStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  return (
    <>
      <button
        style={toggleButtonStyle}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
      >
        {isSidebarOpen ? '✕' : '☰'}
      </button>

      <div style={sidebarStyle}>
        <div style={headerStyle}>
          <div style={logoStyle}>
            <span>💼</span>
            <span>InvoicePro</span>
          </div>
        </div>

        <nav style={navStyle}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={menuItemStyle(location.pathname === item.path)}
              onMouseOver={(e) => {
                if (location.pathname !== item.path) {
                  e.target.style.backgroundColor = 'var(--bg-secondary)';
                  e.target.style.color = 'var(--text-primary)';
                }
              }}
              onMouseOut={(e) => {
                if (location.pathname !== item.path) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div style={footerStyle}>
          <div
            style={themeToggleStyle}
            onClick={toggleDarkMode}
            onMouseOver={(e) => e.target.style.backgroundColor = 'var(--bg-tertiary)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
          >
            <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
              {isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </span>
            <div style={{
              width: '48px',
              height: '24px',
              backgroundColor: isDarkMode ? 'var(--accent-primary)' : 'var(--border-color)',
              borderRadius: '12px',
              position: 'relative',
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                backgroundColor: 'white',
                borderRadius: '50%',
                position: 'absolute',
                top: '2px',
                left: isDarkMode ? '26px' : '2px',
                transition: 'all 0.3s ease',
                boxShadow: 'var(--shadow-sm)'
              }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './firebase.js';
import { useDarkMode } from './DarkModeContext.js';

function Navigation({ user }) {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navigationStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '60px',
    background: isDarkMode 
      ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' 
      : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    borderBottom: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    zIndex: 1000,
    boxShadow: isDarkMode 
      ? '0 4px 12px rgba(0,0,0,0.3)' 
      : '0 4px 12px rgba(0,0,0,0.1)'
  };

  const logoStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: isDarkMode ? '#f1f5f9' : '#1e293b'
  };

  const navLinksStyle = {
    display: 'flex',
    gap: '20px',
    alignItems: 'center'
  };

  const linkStyle = {
    textDecoration: 'none',
    color: isDarkMode ? '#cbd5e1' : '#64748b',
    fontWeight: '500',
    padding: '8px 16px',
    borderRadius: '6px',
    transition: 'all 0.2s ease'
  };

  const activeLinkStyle = {
    ...linkStyle,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  };

  const buttonStyle = {
    background: isDarkMode ? '#374151' : '#f1f5f9',
    color: isDarkMode ? '#f1f5f9' : '#1e293b',
    border: isDarkMode ? '1px solid #475569' : '1px solid #cbd5e1',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    marginLeft: '10px'
  };

  return (
    <nav style={navigationStyle}>
      <div style={logoStyle}>
        📊 Invoice Manager
      </div>
      
      <div style={navLinksStyle}>
        <Link 
          to="/dashboard" 
          style={location.pathname === '/dashboard' ? activeLinkStyle : linkStyle}
        >
          Dashboard
        </Link>
        <Link 
          to="/products" 
          style={location.pathname === '/products' ? activeLinkStyle : linkStyle}
        >
          Products
        </Link>
        <Link 
          to="/clients" 
          style={location.pathname === '/clients' ? activeLinkStyle : linkStyle}
        >
          Clients
        </Link>
        <Link 
          to="/reports" 
          style={location.pathname === '/reports' ? activeLinkStyle : linkStyle}
        >
          Reports
        </Link>
        <Link 
          to="/company-settings" 
          style={location.pathname === '/company-settings' ? activeLinkStyle : linkStyle}
        >
          Settings
        </Link>
        
        <button onClick={toggleDarkMode} style={buttonStyle}>
          {isDarkMode ? '☀️' : '🌙'}
        </button>
        
        <button onClick={handleLogout} style={buttonStyle}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navigation;
