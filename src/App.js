import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase.js';
import { onAuthStateChanged, deleteUser, updatePassword } from 'firebase/auth';
import { getAuth, updateProfile } from "firebase/auth";

import Login from './Login.js';
import Register from './Register.js';
import Dashboard from './Dashboard.js';
import Products from './Products.js';
import Clients from './Clients.js';
import Reports from './Reports.js';
import CompanySettings from './CompanySettings.js';
import Quotes from './Quotes.js';

// New AccountSettings Component
function AccountSettings({ user }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handlePasswordChange = async (e) => {
      e.preventDefault();
      setErrorMessage('');
      setSuccessMessage('');

      if (!newPassword) {
          setErrorMessage('Please enter a new password.');
          return;
      }

      if (newPassword.length < 6) {
          setErrorMessage('Password must be at least 6 characters.');
          return;
      }

      try {
          await updatePassword(user, newPassword);
          setSuccessMessage('Password updated successfully!');
          setNewPassword('');
      } catch (error) {
          setErrorMessage(error.message);
      }
  };


  const handleDeleteAccount = async () => {
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      const credential = prompt("Please enter your password to confirm account deletion:");
      if (credential) {
        await deleteUser(user);
        setSuccessMessage("Account deleted successfully.");
      } else {
        setErrorMessage("Deletion cancelled: Incorrect password provided.");
      }
    } catch (error) {
      setErrorMessage("Error deleting account: " + error.message);
    }
  };

  return (
    <div>
      <h2>Account Settings</h2>

      <h3>Change Password</h3>
      <form onSubmit={handlePasswordChange}>
          <label>
              New Password:
              <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
              />
          </label>
          <button type="submit">Change Password</button>
      </form>

      <h3>Delete Account</h3>
      <p>Warning: This action is irreversible. All your data will be permanently deleted.</p>
      <label>
        Confirm Password:
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </label>
      <br/>
      <label>
        Re-enter Password:
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <br/>
      <button onClick={handleDeleteAccount}>Delete Account</button>

      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
    </div>
  );
}


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
      <main style={{ minHeight: '100vh' }}>
        <Routes>
        <Route
          path="/"
          element={user ? <Dashboard user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/dashboard"
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
          path="/quotes"
          element={user ? <Quotes user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/account-settings"
          element={user ? <AccountSettings user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/company-settings"
          element={user ? <CompanySettings user={user} /> : <Navigate to="/login" />}
        />
      </Routes>
        </main>
      </BrowserRouter>
  );
}

export default App;