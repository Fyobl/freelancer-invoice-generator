
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './firebase.js';
import { useDarkMode } from './DarkModeContext.js';

function Navigation({ user }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navStyle = {
    background: isDarkMode ? 'rgba(26,32,46,0.95)' : 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(15px)',
    borderBottom: '2px solid rgba(102, 126, 234, 0.1)',
    padding: '15px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
  };

  const logoStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: isDarkMode ? '#ffffff' : '#333333',
    textDecoration: 'none',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  };

  const linkStyle = {
    color: isDarkMode ? '#cccccc' : '#666666',
    textDecoration: 'none',
    margin: '0 20px',
    padding: '10px 15px',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    fontSize: '0.95rem',
    fontWeight: '500'
  };

  const activeLinkStyle = {
    ...linkStyle,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
  };

  const userMenuStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  };

  const darkModeToggleStyle = {
    background: isDarkMode ? '#4a5568' : 'rgba(255,255,255,0.2)',
    border: 'none',
    borderRadius: '25px',
    padding: '8px 16px',
    color: 'white',
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

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link 
          to="/" 
          style={location.pathname === '/' ? activeLinkStyle : linkStyle}
        >
          📊 Dashboard
        </Link>
        <Link 
          to="/products" 
          style={location.pathname === '/products' ? activeLinkStyle : linkStyle}
        >
          📦 Products
        </Link>
        <Link 
          to="/clients" 
          style={location.pathname === '/clients' ? activeLinkStyle : linkStyle}
        >
          👥 Clients
        </Link>
        <Link 
          to="/reports" 
          style={location.pathname === '/reports' ? activeLinkStyle : linkStyle}
        >
          📈 Reports
        </Link>
        <Link 
          to="/company-settings" 
          style={location.pathname === '/company-settings' ? activeLinkStyle : linkStyle}
        >
          🏢 Company Settings
        </Link>
      </div>

      <div style={userMenuStyle}>
        <button 
          onClick={toggleDarkMode}
          style={darkModeToggleStyle}
          onMouseOver={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.background = isDarkMode ? '#5a6578' : 'rgba(255,255,255,0.3)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.background = isDarkMode ? '#4a5568' : 'rgba(255,255,255,0.2)';
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
              background: isDarkMode ? 'rgba(26,32,46,0.95)' : 'white',
              border: '2px solid #f8f9fa',
              borderRadius: '12px',
              padding: '15px',
              minWidth: '200px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(15px)',
              zIndex: 1001
            }}>
              <div style={{ 
                padding: '10px 0', 
                borderBottom: '1px solid #eee', 
                marginBottom: '10px',
                color: isDarkMode ? '#ffffff' : '#333333'
              }}>
                <strong>{user?.email}</strong>
              </div>
              <button
                onClick={handleSignOut}
                style={{
                  background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  width: '100%',
                  transition: 'transform 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
              >
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
