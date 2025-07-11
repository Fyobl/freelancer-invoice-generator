import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase.js';

function Navigation({ user }) {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userData, setUserData] = useState(null);

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

  const navStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '15px 25px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const menuButtonStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    width: '30px',
    height: '30px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    zIndex: 1001
  };

  const hamburgerLineStyle = {
    width: '30px',
    height: '3px',
    background: '#fff',
    borderRadius: '3px',
    transition: 'all 0.3s ease',
    transformOrigin: '1px'
  };

  const mobileMenuStyle = {
    position: 'fixed',
    top: '80px',
    left: 0,
    right: 0,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    transform: isMenuOpen ? 'translateY(0)' : 'translateY(-100%)',
    transition: 'transform 0.3s ease',
    zIndex: 999,
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
  };

  const menuLinkStyle = {
    display: 'block',
    color: '#fff',
    textDecoration: 'none',
    padding: '15px 0',
    fontSize: '16px',
    fontWeight: 'bold',
    borderBottom: '1px solid rgba(255,255,255,0.1)'
  };

  const activeMenuLinkStyle = {
    ...menuLinkStyle,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '15px 20px'
  };

  return (
    <>
      <nav style={navStyle}>
        <button 
          style={menuButtonStyle}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <div style={{
            ...hamburgerLineStyle,
            transform: isMenuOpen ? 'rotate(45deg)' : 'rotate(0)'
          }}></div>
          <div style={{
            ...hamburgerLineStyle,
            opacity: isMenuOpen ? 0 : 1,
            transform: isMenuOpen ? 'translateX(20px)' : 'translateX(0)'
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

        <div style={{ fontSize: '14px', color: '#fff' }}>
          Hi, {userData?.firstName || user?.email?.split('@')[0]}
        </div>
      </nav>

      <div style={mobileMenuStyle}>
        <Link 
          to="/" 
          style={location.pathname === '/' ? activeMenuLinkStyle : menuLinkStyle}
          onClick={() => setIsMenuOpen(false)}
        >
          📊 Dashboard
        </Link>

        <Link 
          to="/products" 
          style={location.pathname === '/products' ? activeMenuLinkStyle : menuLinkStyle}
          onClick={() => setIsMenuOpen(false)}
        >
          📦 Products
        </Link>

        <Link 
          to="/clients" 
          style={location.pathname === '/clients' ? activeMenuLinkStyle : menuLinkStyle}
          onClick={() => setIsMenuOpen(false)}
        >
          👥 Clients
        </Link>

        <Link 
          to="/reports" 
          style={location.pathname === '/reports' ? activeMenuLinkStyle : menuLinkStyle}
          onClick={() => setIsMenuOpen(false)}
        >
          📈 Reports
        </Link>

        <Link 
          to="/company-settings" 
          style={location.pathname === '/company-settings' ? activeMenuLinkStyle : menuLinkStyle}
          onClick={() => setIsMenuOpen(false)}
        >
          🏢 Company Settings
        </Link>

        <button 
          onClick={handleLogout} 
          style={{
            ...menuLinkStyle,
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '10px',
            width: '100%',
            textAlign: 'left'
          }}
        >
          🚪 Logout
        </button>
      </div>
    </>
  );
}

export default Navigation;