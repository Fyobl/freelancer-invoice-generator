
import React, { useState, useEffect } from 'react';
import { updatePassword, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from './firebase.js';
import Navigation from './Navigation.js';

function AccountSettings({ user }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [userData, setUserData] = useState(null);

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
    if (!password || !confirmPassword) {
      setErrorMessage("Please enter your password in both fields.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      // Re-authenticate the user before deletion (required by Firebase)
      const { EmailAuthProvider, reauthenticateWithCredential } = await import('firebase/auth');
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      // Delete the user account
      await deleteUser(user);
      setSuccessMessage("Account deleted successfully. You will be logged out.");
      
      // Clear form
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error("Error deleting account:", error);
      if (error.code === 'auth/wrong-password') {
        setErrorMessage("Incorrect password provided.");
      } else if (error.code === 'auth/too-many-requests') {
        setErrorMessage("Too many failed attempts. Please try again later.");
      } else {
        setErrorMessage("Error deleting account: " + error.message);
      }
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundAttachment: 'fixed'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '40px'
  };

  const sectionStyle = {
    background: 'rgba(255,255,255,0.95)',
    padding: '30px',
    marginBottom: '30px',
    borderRadius: '16px',
    border: '2px solid #f8f9fa',
    backdropFilter: 'blur(15px)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  };

  const dangerSectionStyle = {
    ...sectionStyle,
    border: '2px solid #dc3545',
    background: 'rgba(248, 215, 218, 0.95)'
  };

  const inputStyle = {
    width: '100%',
    padding: '15px 18px',
    margin: '8px 0',
    border: '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '16px',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxSizing: 'border-box',
    outline: 'none',
    height: '52px',
    lineHeight: '20px',
    verticalAlign: 'top',
    display: 'block',
    marginBottom: '15px'
  };

  const buttonStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '10px'
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
  };

  return (
    <div style={containerStyle}>
      <Navigation user={user} />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', paddingTop: '100px' }}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '300', color: 'white' }}>
            👤 Account Settings
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0, color: 'white' }}>
            Hello {userData?.firstName || user?.email?.split('@')[0]}! Manage your account settings and preferences
          </p>
        </div>

        {/* Account Information */}
        <div 
          style={sectionStyle}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 25px 50px rgba(0,0,0,0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
          }}
        >
          <h2 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '1.5rem' }}>
            ℹ️ Account Information
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '5px' }}>
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                style={{
                  ...inputStyle,
                  backgroundColor: '#f8f9fa',
                  color: '#6c757d'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '5px' }}>
                Account Created
              </label>
              <input
                type="text"
                value={user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}
                disabled
                style={{
                  ...inputStyle,
                  backgroundColor: '#f8f9fa',
                  color: '#6c757d'
                }}
              />
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div 
          style={sectionStyle}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 25px 50px rgba(0,0,0,0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
          }}
        >
          <h2 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '1.5rem' }}>
            🔒 Change Password
          </h2>
          <form onSubmit={handlePasswordChange}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '5px' }}>
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={inputStyle}
              placeholder="Enter your new password"
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
            <button 
              type="submit" 
              style={buttonStyle}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Update Password
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div 
          style={dangerSectionStyle}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 25px 50px rgba(220, 53, 69, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
          }}
        >
          <h2 style={{ margin: '0 0 25px 0', color: '#dc3545', fontSize: '1.5rem' }}>
            ⚠️ Danger Zone
          </h2>
          <p style={{ color: '#721c24', marginBottom: '20px', fontWeight: '500' }}>
            Warning: This action is irreversible. All your data will be permanently deleted.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#721c24', display: 'block', marginBottom: '5px' }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: '#dc3545'
                }}
                placeholder="Enter your password"
                onFocus={(e) => e.target.style.borderColor = '#dc3545'}
                onBlur={(e) => e.target.style.borderColor = '#dc3545'}
              />
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#721c24', display: 'block', marginBottom: '5px' }}>
                Re-enter Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: '#dc3545'
                }}
                placeholder="Confirm your password"
                onFocus={(e) => e.target.style.borderColor = '#dc3545'}
                onBlur={(e) => e.target.style.borderColor = '#dc3545'}
              />
            </div>
          </div>
          
          <button 
            onClick={handleDeleteAccount}
            style={dangerButtonStyle}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            Delete Account Permanently
          </button>
        </div>

        {/* Messages */}
        {errorMessage && (
          <div style={{
            ...sectionStyle,
            border: '2px solid #dc3545',
            background: 'rgba(248, 215, 218, 0.95)',
            color: '#721c24'
          }}>
            <strong>Error:</strong> {errorMessage}
          </div>
        )}
        
        {successMessage && (
          <div style={{
            ...sectionStyle,
            border: '2px solid #28a745',
            background: 'rgba(212, 237, 218, 0.95)',
            color: '#155724'
          }}>
            <strong>Success:</strong> {successMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export default AccountSettings;
