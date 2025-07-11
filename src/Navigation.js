
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './firebase.js';

function Navigation({ user }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navigationStyle = {
    position: 'fixed',
    left: 0,
    top: 0,
    height: '100vh',
    width: isCollapsed ? '80px' : '280px',
    background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '20px',
    boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
    transition: 'width 0.3s ease',
    zIndex: 1000,
    overflowY: 'auto'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '40px',
    paddingBottom: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.2)'
  };

  const navListStyle = {
    listStyle: 'none',
    padding: 0,
    margin: 0
  };

  const navItemStyle = (isActive) => ({
    marginBottom: '8px',
    borderRadius: '12px',
    overflow: 'hidden',
    background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
    transition: 'all 0.3s ease'
  });

  const navLinkStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '15px 20px',
    color: 'white',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.3s ease'
  };

  const footerStyle = {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    right: '20px'
  };

  const userInfoStyle = {
    padding: '15px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '12px',
    marginBottom: '20px',
    textAlign: 'center'
  };

  const signOutButtonStyle = {
    width: '100%',
    padding: '12px',
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease'
  };

  const collapseButtonStyle = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '8px',
    cursor: 'pointer',
    fontSize: '18px'
  };

  const menuItems = [
    { path: '/dashboard', label: '📊 Dashboard', icon: '📊' },
    { path: '/products', label: '📦 Products', icon: '📦' },
    { path: '/clients', label: '👥 Clients', icon: '👥' },
    { path: '/reports', label: '📈 Reports', icon: '📈' },
    { path: '/company-settings', label: '⚙️ Settings', icon: '⚙️' }
  ];

  return (
    <>
      <div style={navigationStyle}>
        <button
          style={collapseButtonStyle}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? '→' : '←'}
        </button>

        <div style={headerStyle}>
          {!isCollapsed && (
            <>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
                Invoice Pro
              </h2>
              <p style={{ margin: '5px 0 0 0', opacity: 0.8, fontSize: '14px' }}>
                Professional Invoicing
              </p>
            </>
          )}
        </div>

        <nav>
          <ul style={navListStyle}>
            {menuItems.map((item) => (
              <li key={item.path} style={navItemStyle(location.pathname === item.path)}>
                <Link
                  to={item.path}
                  style={navLinkStyle}
                  onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <span style={{ marginRight: isCollapsed ? '0' : '12px', fontSize: '20px' }}>
                    {item.icon}
                  </span>
                  {!isCollapsed && <span>{item.label.split(' ').slice(1).join(' ')}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div style={footerStyle}>
          {!isCollapsed && (
            <div style={userInfoStyle}>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>
                Logged in as:
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', marginTop: '5px' }}>
                {user?.email}
              </div>
            </div>
          )}
          <button
            style={signOutButtonStyle}
            onClick={handleSignOut}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.3)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
          >
            {isCollapsed ? '🚪' : '🚪 Sign Out'}
          </button>
        </div>
      </div>
    </>
  );
}

export default Navigation;
