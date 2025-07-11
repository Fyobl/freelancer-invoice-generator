
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
  doc,
  getDoc 
} from 'firebase/firestore';
import { auth, db } from './firebase.js';
import Navigation from './Navigation.js';

function AccountSettings() {
  const [userData, setUserData] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const user = auth.currentUser;

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

  const handleDeleteAccount = async () => {
    if (!confirmPassword) {
      alert('Please enter your password to confirm deletion');
      return;
    }

    setIsDeleting(true);
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, confirmPassword);
      await reauthenticateWithCredential(user, credential);

      // Delete all user data from Firestore
      const collections = ['invoices', 'clients', 'products', 'quotes', 'companySettings'];
      
      for (const collectionName of collections) {
        const q = query(collection(db, collectionName), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        
        const deletePromises = snapshot.docs.map(docSnapshot => 
          deleteDoc(doc(db, collectionName, docSnapshot.id))
        );
        
        await Promise.all(deletePromises);
      }

      // Delete user document
      await deleteDoc(doc(db, 'users', user.uid));

      // Delete user account
      await deleteUser(user);

      alert('Account deleted successfully');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Error deleting account: ' + error.message);
    }
    setIsDeleting(false);
  };

  // Styles matching the rest of the site
  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  };

  const contentStyle = {
    padding: '30px',
    maxWidth: '1200px',
    margin: '0 auto',
    paddingTop: '100px'
  };

  const headerStyle = {
    color: 'white',
    textAlign: 'center',
    marginBottom: '40px'
  };

  const cardStyle = {
    background: 'rgba(255,255,255,0.95)',
    padding: '30px',
    borderRadius: '16px',
    marginBottom: '30px',
    backdropFilter: 'blur(15px)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    border: '2px solid rgba(255,255,255,0.2)'
  };

  const dangerCardStyle = {
    ...cardStyle,
    border: '2px solid #dc3545',
    background: 'rgba(248, 215, 218, 0.95)'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 15px',
    border: '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '15px',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
    height: '44px',
    lineHeight: '20px',
    verticalAlign: 'top'
  };

  const buttonStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '15px 30px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
    boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#333',
    fontSize: '14px'
  };

  return (
    <div style={containerStyle}>
      <Navigation user={user} />
      <div style={contentStyle}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '300' }}>
            ⚙️ Account Settings
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
            Hello {userData?.firstName || user?.email?.split('@')[0]}! Manage your account settings and preferences
          </p>
        </div>

        {/* Account Information */}
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '1.5rem' }}>
            👤 Account Information
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                style={{ ...inputStyle, backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
              />
            </div>
            <div>
              <label style={labelStyle}>First Name</label>
              <input
                type="text"
                value={userData?.firstName || ''}
                disabled
                style={{ ...inputStyle, backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input
                type="text"
                value={userData?.lastName || ''}
                disabled
                style={{ ...inputStyle, backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Account Created</label>
              <input
                type="text"
                value={user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
                disabled
                style={{ ...inputStyle, backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
              />
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div style={dangerCardStyle}>
          <h2 style={{ margin: '0 0 25px 0', color: '#dc3545', fontSize: '1.5rem' }}>
            ⚠️ Danger Zone
          </h2>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: '#721c24', fontSize: '14px', margin: '0 0 15px 0', lineHeight: '1.6' }}>
              <strong>Warning:</strong> Deleting your account will permanently remove all your data including:
            </p>
            <ul style={{ color: '#721c24', fontSize: '14px', marginLeft: '20px', lineHeight: '1.6' }}>
              <li>All invoices and quotes</li>
              <li>Client information</li>
              <li>Product catalog</li>
              <li>Company settings</li>
              <li>Account information</li>
            </ul>
            <p style={{ color: '#721c24', fontSize: '14px', margin: '15px 0 0 0', fontWeight: 'bold' }}>
              This action cannot be undone.
            </p>
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={dangerButtonStyle}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 20px rgba(220, 53, 69, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.3)';
              }}
            >
              🗑️ Delete Account
            </button>
          ) : (
            <div style={{ 
              border: '2px solid #dc3545', 
              borderRadius: '12px', 
              padding: '25px', 
              backgroundColor: '#fff5f5' 
            }}>
              <h3 style={{ color: '#dc3545', margin: '0 0 20px 0', fontSize: '1.2rem' }}>
                🔒 Confirm Account Deletion
              </h3>
              <p style={{ color: '#721c24', fontSize: '14px', margin: '0 0 20px 0' }}>
                Please enter your password to confirm deletion of your account:
              </p>
              
              <label style={labelStyle}>Current Password *</label>
              <input
                type="password"
                placeholder="Enter your current password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: '#dc3545',
                  marginBottom: '20px'
                }}
                onFocus={(e) => e.target.style.borderColor = '#dc3545'}
                onBlur={(e) => e.target.style.borderColor = '#dc3545'}
              />

              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || !confirmPassword}
                  style={{
                    ...dangerButtonStyle,
                    opacity: isDeleting || !confirmPassword ? 0.6 : 1,
                    cursor: isDeleting || !confirmPassword ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (!isDeleting && confirmPassword) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 8px 20px rgba(220, 53, 69, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDeleting && confirmPassword) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.3)';
                    }
                  }}
                >
                  {isDeleting ? '⏳ Deleting...' : '🗑️ Confirm Delete Account'}
                </button>
                
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setConfirmPassword('');
                  }}
                  style={{
                    ...buttonStyle,
                    background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                    boxShadow: '0 4px 12px rgba(108, 117, 125, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 20px rgba(108, 117, 125, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(108, 117, 125, 0.3)';
                  }}
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
