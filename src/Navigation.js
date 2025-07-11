import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from './firebase.js';

function Navigation({ user }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/clients', label: 'Clients', icon: '👥' },
    { path: '/products', label: 'Products', icon: '📦' },
    { path: '/reports', label: 'Reports', icon: '📈' },
    { path: '/quotes', label: 'Quotes', icon: '💰' },
    { path: '/company-settings', label: 'Settings', icon: '⚙️' },
    { path: '/account-settings', label: 'Account Settings', icon: '👤' }
  ];

  return (
    <>
      {/* Navigation Bar */}
      <nav style={{
        background: '#fff',
        borderBottom: '1px solid #e0e0e0',
        padding: '0 20px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* Hamburger Menu Button */}
        <button
          onClick={toggleMenu}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '40px',
            height: '40px'
          }}
        >
          <div style={{
            width: '20px',
            height: '2px',
            backgroundColor: '#333',
            margin: '2px 0',
            transition: '0.3s'
          }}></div>
          <div style={{
            width: '20px',
            height: '2px',
            backgroundColor: '#333',
            margin: '2px 0',
            transition: '0.3s'
          }}></div>
          <div style={{
            width: '20px',
            height: '2px',
            backgroundColor: '#333',
            margin: '2px 0',
            transition: '0.3s'
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

        <div style={{ fontSize: '14px', color: '#666', fontWeight: 'bold' }}>
          Hi {userData?.firstName || user?.email}
        </div>
      </nav>

      {/* Sidebar Menu */}
      <div style={{
        position: 'fixed',
        top: '60px',
        left: isMenuOpen ? '0' : '-250px',
        width: '250px',
        height: 'calc(100vh - 60px)',
        background: '#f8f9fa',
        borderRight: '1px solid #e0e0e0',
        transition: 'left 0.3s ease',
        zIndex: 999,
        boxShadow: isMenuOpen ? '2px 0 5px rgba(0,0,0,0.1)' : 'none',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px' }}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                margin: '4px 0',
                borderRadius: '8px',
                textDecoration: 'none',
                color: location.pathname === item.path ? '#007bff' : '#333',
                backgroundColor: location.pathname === item.path ? '#e3f2fd' : 'transparent',
                border: location.pathname === item.path ? '1px solid #007bff' : '1px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ marginRight: '12px', fontSize: '18px' }}>
                {item.icon}
              </span>
              <span style={{ fontWeight: location.pathname === item.path ? '600' : '400' }}>
                {item.label}
              </span>
            </Link>
          ))}

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              margin: '20px 0 4px 0',
              borderRadius: '8px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              fontSize: '14px'
            }}
          >
            <span style={{ marginRight: '12px', fontSize: '18px' }}>🚪</span>
            Logout
          </button>
        </div>
      </div>

      {/* Overlay when menu is open */}
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          style={{
            position: 'fixed',
            top: '60px',
            left: '250px',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 998
          }}
        />
      )}
    </>
  );
}

export default Navigation;
```

```
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from './firebase.js';

function Navigation({ user }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/clients', label: 'Clients', icon: '👥' },
    { path: '/products', label: 'Products', icon: '📦' },
    { path: '/reports', label: 'Reports', icon: '📈' },
    { path: '/quotes', label: 'Quotes', icon: '💰' },
    { path: '/company-settings', label: 'Settings', icon: '⚙️' },
    { path: '/account-settings', label: 'Account Settings', icon: '👤' }
  ];

  return (
    <>
      {/* Navigation Bar */}
      <nav style={{
        background: '#fff',
        borderBottom: '1px solid #e0e0e0',
        padding: '0 20px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* Hamburger Menu Button */}
        <button
          onClick={toggleMenu}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '40px',
            height: '40px'
          }}
        >
          <div style={{
            width: '20px',
            height: '2px',
            backgroundColor: '#333',
            margin: '2px 0',
            transition: '0.3s'
          }}></div>
          <div style={{
            width: '20px',
            height: '2px',
            backgroundColor: '#333',
            margin: '2px 0',
            transition: '0.3s'
          }}></div>
          <div style={{
            width: '20px',
            height: '2px',
            backgroundColor: '#333',
            margin: '2px 0',
            transition: '0.3s'
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

        <div style={{ fontSize: '14px', color: '#666', fontWeight: 'bold' }}>
          Hi {userData?.firstName || user?.email}
        </div>
      </nav>

      {/* Sidebar Menu */}
      <div style={{
        position: 'fixed',
        top: '60px',
        left: isMenuOpen ? '0' : '-250px',
        width: '250px',
        height: 'calc(100vh - 60px)',
        background: '#f8f9fa',
        borderRight: '1px solid #e0e0e0',
        transition: 'left 0.3s ease',
        zIndex: 999,
        boxShadow: isMenuOpen ? '2px 0 5px rgba(0,0,0,0.1)' : 'none',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px' }}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                margin: '4px 0',
                borderRadius: '8px',
                textDecoration: 'none',
                color: location.pathname === item.path ? '#007bff' : '#333',
                backgroundColor: location.pathname === item.path ? '#e3f2fd' : 'transparent',
                border: location.pathname === item.path ? '1px solid #007bff' : '1px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ marginRight: '12px', fontSize: '18px' }}>
                {item.icon}
              </span>
              <span style={{ fontWeight: location.pathname === item.path ? '600' : '400' }}>
                {item.label}
              </span>
            </Link>
          ))}

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              margin: '20px 0 4px 0',
              borderRadius: '8px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              fontSize: '14px'
            }}
          >
            <span style={{ marginRight: '12px', fontSize: '18px' }}>🚪</span>
            Logout
          </button>
        </div>
      </div>

      {/* Overlay when menu is open */}
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          style={{
            position: 'fixed',
            top: '60px',
            left: '250px',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 998
          }}
        />
      )}
    </>
  );
}

export default Navigation;
```

The provided change snippet is designed to modify the sidebar menu, but refers to non-existent variables like `linkStyle` and components that are not part of the original sidebar structure in `Navigation.js`. Based on the intention of adding an "Email Setup" link, I will modify the `menuItems` array to include this new link. This will correctly add the Email Setup link to the sidebar using the existing styling and navigation structure.

```
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from './firebase.js';

function Navigation({ user }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/clients', label: 'Clients', icon: '👥' },
    { path: '/products', label: 'Products', icon: '📦' },
    { path: '/reports', label: 'Reports', icon: '📈' },
    { path: '/quotes', label: 'Quotes', icon: '💰' },
    { path: '/company-settings', label: 'Settings', icon: '⚙️' },
    { path: '/email-config', label: 'Email Setup', icon: '📧' }, // Added Email Setup Link
    { path: '/account-settings', label: 'Account Settings', icon: '👤' }
  ];

  return (
    <>
      {/* Navigation Bar */}
      <nav style={{
        background: '#fff',
        borderBottom: '1px solid #e0e0e0',
        padding: '0 20px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* Hamburger Menu Button */}
        <button
          onClick={toggleMenu}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '40px',
            height: '40px'
          }}
        >
          <div style={{
            width: '20px',
            height: '2px',
            backgroundColor: '#333',
            margin: '2px 0',
            transition: '0.3s'
          }}></div>
          <div style={{
            width: '20px',
            height: '2px',
            backgroundColor: '#333',
            margin: '2px 0',
            transition: '0.3s'
          }}></div>
          <div style={{
            width: '20px',
            height: '2px',
            backgroundColor: '#333',
            margin: '2px 0',
            transition: '0.3s'
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

        <div style={{ fontSize: '14px', color: '#666', fontWeight: 'bold' }}>
          Hi {userData?.firstName || user?.email}
        </div>
      </nav>

      {/* Sidebar Menu */}
      <div style={{
        position: 'fixed',
        top: '60px',
        left: isMenuOpen ? '0' : '-250px',
        width: '250px',
        height: 'calc(100vh - 60px)',
        background: '#f8f9fa',
        borderRight: '1px solid #e0e0e0',
        transition: 'left 0.3s ease',
        zIndex: 999,
        boxShadow: isMenuOpen ? '2px 0 5px rgba(0,0,0,0.1)' : 'none',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px' }}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                margin: '4px 0',
                borderRadius: '8px',
                textDecoration: 'none',
                color: location.pathname === item.path ? '#007bff' : '#333',
                backgroundColor: location.pathname === item.path ? '#e3f2fd' : 'transparent',
                border: location.pathname === item.path ? '1px solid #007bff' : '1px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ marginRight: '12px', fontSize: '18px' }}>
                {item.icon}
              </span>
              <span style={{ fontWeight: location.pathname === item.path ? '600' : '400' }}>
                {item.label}
              </span>
            </Link>
          ))}

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              margin: '20px 0 4px 0',
              borderRadius: '8px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              fontSize: '14px'
            }}
          >
            <span style={{ marginRight: '12px', fontSize: '18px' }}>🚪</span>
            Logout
          </button>
        </div>
      </div>

      {/* Overlay when menu is open */}
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          style={{
            position: 'fixed',
            top: '60px',
            left: '250px',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 998
          }}
        />
      )}
    </>
  );
}

export default Navigation;
```

```
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from './firebase.js';

function Navigation({ user }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Added Email Setup Link to the menuItems array
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/clients', label: 'Clients', icon: '👥' },
    { path: '/products', label: 'Products', icon: '📦' },
    { path: '/reports', label: 'Reports', icon: '📈' },
    { path: '/quotes', label: 'Quotes', icon: '💰' },
    { path: '/company-settings', label: 'Settings', icon: '⚙️' },
    { path: '/email-config', label: 'Email Setup', icon: '📧' },
    { path: '/account-settings', label: 'Account Settings', icon: '👤' }
  ];

  return (
    <>
      {/* Navigation Bar */}
      <nav style={{
        background: '#fff',
        borderBottom: '1px solid #e0e0e0',
        padding: '0 20px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* Hamburger Menu Button */}
        <button
          onClick={toggleMenu}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '40px',
            height: '40px'
          }}
        >
          <div style={{
            width: '20px',
            height: '2px',
            backgroundColor: '#333',
            margin: '2px 0',
            transition: '0.3s'
          }}></div>
          <div style={{
            width: '20px',
            height: '2px',
            backgroundColor: '#333',
            margin: '2px 0',
            transition: '0.3s'
          }}></div>
          <div style={{
            width: '20px',
            height: '2px',
            backgroundColor: '#333',
            margin: '2px 0',
            transition: '0.3s'
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

        <div style={{ fontSize: '14px', color: '#666', fontWeight: 'bold' }}>
          Hi {userData?.firstName || user?.email}
        </div>
      </nav>

      {/* Sidebar Menu */}
      <div style={{
        position: 'fixed',
        top: '60px',
        left: isMenuOpen ? '0' : '-250px',
        width: '250px',
        height: 'calc(100vh - 60px)',
        background: '#f8f9fa',
        borderRight: '1px solid #e0e0e0',
        transition: 'left 0.3s ease',
        zIndex: 999,
        boxShadow: isMenuOpen ? '2px 0 5px rgba(0,0,0,0.1)' : 'none',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px' }}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                margin: '4px 0',
                borderRadius: '8px',
                textDecoration: 'none',
                color: location.pathname === item.path ? '#007bff' : '#333',
                backgroundColor: location.pathname === item.path ? '#e3f2fd' : 'transparent',
                border: location.pathname === item.path ? '1px solid #007bff' : '1px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ marginRight: '12px', fontSize: '18px' }}>
                {item.icon}
              </span>
              <span style={{ fontWeight: location.pathname === item.path ? '600' : '400' }}>
                {item.label}
              </span>
            </Link>
          ))}

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              margin: '20px 0 4px 0',
              borderRadius: '8px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              fontSize: '14px'
            }}
          >
            <span style={{ marginRight: '12px', fontSize: '18px' }}>🚪</span>
            Logout
          </button>
        </div>
      </div>

      {/* Overlay when menu is open */}
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          style={{
            position: 'fixed',
            top: '60px',
            left: '250px',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 998
          }}
        />
      )}
    </>
  );
}

export default Navigation;