import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase.js';
import Home from './Home.js';
import Login from './Login.js';
import Register from './Register.js';
import Dashboard from './Dashboard.js';
import Quotes from './Quotes.js';
import Clients from './Clients.js';
import Products from './Products.js';
import Reports from './Reports.js';
import CompanySettings from './CompanySettings.js';
import AccountSettings from './AccountSettings.js';
import EmailSettings from './EmailSettings.js';
import Admin from './Admin.js';
import Subscription from './Subscription.js';
import Navigation from './Navigation.js';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (user) => {
    setUser(user);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '24px'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {user && <Navigation user={user} />}
        <Routes>
          <Route path="/" element={!user ? <Home /> : <Navigate to="/dashboard" />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!user ? <Register onRegister={handleLogin} /> : <Navigate to="/dashboard" />} />
          {user && (
            <>
              <Route path="/dashboard" element={<Dashboard user={user} />} />
              <Route path="/quotes" element={<Quotes user={user} />} />
              <Route path="/clients" element={<Clients user={user} />} />
              <Route path="/products" element={<Products user={user} />} />
              <Route path="/reports" element={<Reports user={user} />} />
              <Route path="/company-settings" element={<CompanySettings user={user} />} />
              <Route path="/account-settings" element={<AccountSettings user={user} />} />
              <Route path="/subscription" element={<Subscription user={user} />} />
              <Route path="/admin" element={<Admin user={user} />} />
              <Route path="/settings" element={<Navigate to="/company-settings" />} />
            </>
          )}
          <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;