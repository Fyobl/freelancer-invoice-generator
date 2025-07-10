import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

import Login from './Login';
import Dashboard from './Dashboard';
import Products from './Products'; // ✅ Add Products screen

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
          path="/products"
          element={user ? <Products user={user} /> : <Navigate to="/login" />}
        />
        {/* You can add more routes here later */}
      </Routes>
    </Router>
  );
}

export default App;
