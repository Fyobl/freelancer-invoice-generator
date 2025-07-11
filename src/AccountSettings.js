
import React, { useState, useEffect } from 'react';
import { 
  deleteUser, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { auth, db } from './firebase.js';
import Navigation from './Navigation.js';

function AccountSettings({ user }) {
  const [userData, setUserData] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', user.email)));
          if (!userDoc.empty) {
            setUserData(userDoc.docs[0].data());
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [user]);

  const deleteAllUserData = async (userId) => {
    const collections = ['invoices', 'clients', 'products', 'quotes', 'users'];
    
    for (const collectionName of collections) {
      const q = query(collection(db, collectionName), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      for (const docSnapshot of snapshot.docs) {
        await deleteDoc(doc(db, collectionName, docSnapshot.id));
      }
    }

    // Also delete user document by email
    const userQuery = query(collection(db, 'users'), where('email', '==', user.email));
    const userSnapshot = await getDocs(userQuery);
    for (const docSnapshot of userSnapshot.docs) {
      await deleteDoc(doc(db, 'users', docSnapshot.id));
    }
  };

  const handleDeleteAccount = async () => {
    if (!password) {
      alert('Please enter your password to confirm deletion.');
      return;
    }

    if (confirmText !== 'DELETE') {
      alert('Please type "DELETE" to confirm account deletion.');
      return;
    }

    setLoading(true);

    try {
      // Re-authenticate user before deletion
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Delete all user data from Firestore
      await deleteAllUserData(user.uid);

      // Delete the user account
      await deleteUser(user);

      alert('Your account and all associated data have been permanently deleted.');
    } catch (error) {
      console.error('Error deleting account:', error);
      if (error.code === 'auth/wrong-password') {
        alert('Incorrect password. Please try again.');
      } else if (error.code === 'auth/too-many-requests') {
        alert('Too many failed attempts. Please try again later.');
      } else {
        alert('Error deleting account: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: 'Arial, sans-serif'
  };

  const headerStyle = {
    background: 'rgba(255,255,255,0.95)',
    padding: '40px',
    borderRadius: '15px',
    textAlign: 'center',
    marginBottom: '30px',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
  };

  const cardStyle = {
    background: 'white',
    border: '2px solid #f8f9fa',
    borderRadius: '12px',
    padding: '30px',
    marginBottom: '20px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
  };

  const dangerCardStyle = {
    ...cardStyle,
    border: '2px solid #dc3545',
    background: '#fff5f5'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    margin: '8px 0',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box'
  };

  const buttonStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 25px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s ease'
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
  };

  return (
    <div style={containerStyle}>
      <Navigation user={user} />
      <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto', paddingTop: '100px' }}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '300' }}>
            ⚙️ Account Settings
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
            Hello {userData?.firstName || user?.email?.split('@')[0]}! Manage your account settings here.
          </p>
        </div>

        {/* Account Information */}
        <div style={cardStyle}>
          <h3 style={{ color: '#333', marginBottom: '20px' }}>👤 Account Information</h3>
          <div style={{ fontSize: '16px', color: '#666', lineHeight: '1.6' }}>
            <p><strong>Name:</strong> {userData?.firstName} {userData?.lastName}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Company:</strong> {userData?.companyName}</p>
            <p><strong>Phone:</strong> {userData?.phone}</p>
          </div>
        </div>

        {/* Danger Zone */}
        <div style={dangerCardStyle}>
          <h3 style={{ color: '#dc3545', marginBottom: '20px' }}>⚠️ Danger Zone</h3>
          
          {!showDeleteConfirm ? (
            <div>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={dangerButtonStyle}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                🗑️ Delete Account
              </button>
            </div>
          ) : (
            <div>
              <h4 style={{ color: '#dc3545', marginBottom: '15px' }}>
                ⚠️ Confirm Account Deletion
              </h4>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                This will permanently delete your account and ALL associated data including:
              </p>
              <ul style={{ color: '#666', marginBottom: '20px', paddingLeft: '20px' }}>
                <li>All invoices and quotes</li>
                <li>All clients and products</li>
                <li>Company settings</li>
                <li>Your user profile</li>
              </ul>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#dc3545' }}>
                  Enter your password to confirm:
                </label>
                <input
                  type="password"
                  placeholder="Your current password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#dc3545' }}>
                  Type "DELETE" to confirm:
                </label>
                <input
                  type="text"
                  placeholder="Type DELETE here"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading || !password || confirmText !== 'DELETE'}
                  style={{
                    ...dangerButtonStyle,
                    opacity: (loading || !password || confirmText !== 'DELETE') ? 0.5 : 1,
                    cursor: (loading || !password || confirmText !== 'DELETE') ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? '🔄 Deleting...' : '💀 Permanently Delete Account'}
                </button>
                
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPassword('');
                    setConfirmText('');
                  }}
                  style={buttonStyle}
                  disabled={loading}
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AccountSettings;
