
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase.js';
import { DarkModeProvider, useDarkMode } from './DarkModeContext.js';
import Navigation from './Navigation.js';
import Dashboard from './Dashboard.js';
import Products from './Products.js';
import Clients from './Clients.js';
import Reports from './Reports.js';
import CompanySettings from './CompanySettings.js';
import Login from './Login.js';
import Register from './Register.js';
import './App.css';

const AppContent = () => {
  const { isDarkMode } = useDarkMode();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: isDarkMode ? '#0f172a' : '#f8fafc',
        color: isDarkMode ? '#f8fafc' : '#1e293b'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <div className="app">
      <Router>
        <div className="main-layout">
          <main className="content-area">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard user={user} />} />
              <Route path="/products" element={<Products user={user} />} />
              <Route path="/clients" element={<Clients user={user} />} />
              <Route path="/reports" element={<Reports user={user} />} />
              <Route path="/company-settings" element={<CompanySettings user={user} />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </div>
  );
};

function App() {
  return (
    <DarkModeProvider>
      <AppContent />
    </DarkModeProvider>
  );
}

export default App;
