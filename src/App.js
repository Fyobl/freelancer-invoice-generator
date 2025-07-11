import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase.js';
import { onAuthStateChanged } from 'firebase/auth';

import Login from './Login.js';
import Register from './Register.js';
import Dashboard from './Dashboard.js';
import Products from './Products.js';
import Clients from './Clients.js';
import Reports from './Reports.js';
import CompanySettings from './CompanySettings.js';

function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  if (!authChecked) return <p>Checking authentication...</p>;

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={user ? <Dashboard user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" />}
        />
        <Route
          path="/register"
          element={!user ? <Register onRegister={setUser} /> : <Navigate to="/" />}
        />
        <Route
          path="/products"
          element={user ? <Products user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/clients"
          element={user ? <Clients user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/reports"
          element={user ? <Reports user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/company-settings"
          element={user ? <CompanySettings user={user} /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;