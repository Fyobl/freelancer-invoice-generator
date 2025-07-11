import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase.js';

function Navigation({ user }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [user]);

  const handleLogout = () => {
    signOut(auth);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const headerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    background: '#f8f9fa',
    padding: '15px 20px',
    borderBottom: '1px solid #dee2e6',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1000,
    height: '60px',
    boxSizing: 'border-box'
  };

  const hamburgerStyle = {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '5px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    width: '30px',
    height: '30px'
  };

  const hamburgerLineStyle = {
    width: '100%',
    height: '3px',
    backgroundColor: '#333',
    transition: 'all 0.3s ease',
    transformOrigin: 'center'
  };

  const sideMenuStyle = {
    position: 'fixed',
    top: 0,
    left: isMenuOpen ? '0' : '-300px',
    width: '300px',
    height: '100vh',
    background: '#2c3e50',
    transition: 'left 0.3s ease',
    zIndex: 1001,
    padding: '80px 0 20px 0',
    boxShadow: isMenuOpen ? '2px 0 10px rgba(0,0,0,0.3)' : 'none'
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.5)',
    zIndex: 999,
    display: isMenuOpen ? 'block' : 'none',
    transition: 'opacity 0.3s ease'
  };

  const menuLinkStyle = {
    display: 'block',
    padding: '15px 25px',
    textDecoration: 'none',
    color: '#ecf0f1',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'background-color 0.3s ease',
    borderLeft: '4px solid transparent'
  };

  const activeMenuLinkStyle = {
    ...menuLinkStyle,
    backgroundColor: '#34495e',
    borderLeft: '4px solid #3498db',
    color: '#3498db'
  };

  const menuLinkHoverStyle = {
    backgroundColor: '#34495e'
  };

  const userInfoStyle = {
    padding: '20px 25px',
    borderTop: '1px solid #34495e',
    marginTop: 'auto'
  };

  const logoutButtonStyle = {
    width: '100%',
    padding: '12px',
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    marginTop: '10px',
    transition: 'background-color 0.3s ease'
  };

  return (
    <>
      {/* Header */}
      <header style={headerStyle}>
        <button 
          style={hamburgerStyle} 
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <div style={{
            ...hamburgerLineStyle,
            transform: isMenuOpen ? 'rotate(45deg) translate(6px, 6px)' : 'none'
          }}></div>
          <div style={{
            ...hamburgerLineStyle,
            opacity: isMenuOpen ? '0' : '1'
          }}></div>
          <div style={{
            ...hamburgerLineStyle,
            transform: isMenuOpen ? 'rotate(-45deg) translate(6px, -6px)' : 'none'
          }}></div>
        </button>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          fontSize: '22px', 
          fontWeight: 'bold',
          color: '#2c3e50',
          fontFamily: 'Arial, sans-serif'
        }}>
          <span style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginRight: '8px'
          }}>
            📄
          </span>
          <span style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '0.5px'
          }}>
            Easy Invoice
          </span>
        </div>

        <div style={{ fontSize: '14px', color: '#666' }}>
          Hi, {userData?.firstName || user?.email?.split('@')[0]}
        </div>
      </header>

      {/* Overlay */}
      <div style={overlayStyle} onClick={closeMenu}></div>

      {/* Side Menu */}
      <nav style={sideMenuStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Link 
            to="/" 
            style={location.pathname === '/' ? activeMenuLinkStyle : menuLinkStyle}
            onClick={closeMenu}
            onMouseEnter={(e) => {
              if (location.pathname !== '/') {
                e.target.style.backgroundColor = menuLinkHoverStyle.backgroundColor;
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/') {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            📊 Dashboard
          </Link>

          <Link 
            to="/products" 
            style={location.pathname === '/products' ? activeMenuLinkStyle : menuLinkStyle}
            onClick={closeMenu}
            onMouseEnter={(e) => {
              if (location.pathname !== '/products') {
                e.target.style.backgroundColor = menuLinkHoverStyle.backgroundColor;
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/products') {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            📦 Products
          </Link>

          <Link 
            to="/clients" 
            style={location.pathname === '/clients' ? activeMenuLinkStyle : menuLinkStyle}
            onClick={closeMenu}
            onMouseEnter={(e) => {
              if (location.pathname !== '/clients') {
                e.target.style.backgroundColor = menuLinkHoverStyle.backgroundColor;
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/clients') {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            👥 Clients
          </Link>

          <Link 
            to="/reports" 
            style={location.pathname === '/reports' ? activeMenuLinkStyle : menuLinkStyle}
            onClick={closeMenu}
            onMouseEnter={(e) => {
              if (location.pathname !== '/reports') {
                e.target.style.backgroundColor = menuLinkHoverStyle.backgroundColor;
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/reports') {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            📈 Reports
          </Link>

          <Link 
            to="/company-settings" 
            style={location.pathname === '/company-settings' ? activeMenuLinkStyle : menuLinkStyle}
            onClick={closeMenu}
            onMouseEnter={(e) => {
              if (location.pathname !== '/company-settings') {
                e.target.style.backgroundColor = menuLinkHoverStyle.backgroundColor;
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/company-settings') {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            🏢 Company Settings
          </Link>

          <div style={userInfoStyle}>
            <div style={{ color: '#bdc3c7', fontSize: '14px', marginBottom: '10px' }}>
              Welcome, {userData?.firstName || user?.email?.split('@')[0]}
            </div>
            <button 
              onClick={handleLogout} 
              style={logoutButtonStyle}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#c0392b'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#e74c3c'}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navigation;