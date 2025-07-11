import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <div className="app">
      <div className="main-layout">
        <Navigation />
        <main className="content-area">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/company-settings" element={<CompanySettings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <DarkModeProvider>
      <Router>
        <AppContent />
      </Router>
    </DarkModeProvider>
  );
}

export default App;