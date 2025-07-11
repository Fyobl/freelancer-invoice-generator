
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase.js';

function CloudStorageSettings({ user }) {
  const [selectedProvider, setSelectedProvider] = useState('');
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    apiKey: '',
    clientId: '',
    clientSecret: '',
    accessToken: '',
    refreshToken: ''
  });
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const containerStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minHeight: '100vh',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    padding: '30px',
    paddingTop: '100px'
  };

  const formStyle = {
    background: 'rgba(255,255,255,0.95)',
    padding: '40px',
    borderRadius: '20px',
    maxWidth: '600px',
    margin: '0 auto',
    backdropFilter: 'blur(15px)',
    boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
    border: '2px solid rgba(255,255,255,0.2)'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 15px',
    border: '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '15px',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    outline: 'none'
  };

  const buttonStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '15px 30px',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%',
    marginTop: '20px'
  };

  const selectStyle = {
    width: '100%',
    padding: '12px 15px',
    border: '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '20px',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    outline: 'none'
  };

  useEffect(() => {
    loadStorageSettings();
  }, [user]);

  const loadStorageSettings = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'cloudStorage'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setSelectedProvider(data.provider || '');
        setCredentials(data.credentials || {});
        setIsConnected(data.isConnected || false);
      }
    } catch (error) {
      console.error('Error loading storage settings:', error);
    }
  };

  const handleConnect = async () => {
    if (!selectedProvider || !credentials.email || !credentials.password) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Save credentials to Firestore
      const storageData = {
        userId: user.uid,
        provider: selectedProvider,
        credentials: credentials,
        isConnected: true,
        connectedAt: new Date()
      };

      const q = query(collection(db, 'cloudStorage'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        await addDoc(collection(db, 'cloudStorage'), storageData);
      } else {
        await updateDoc(doc(db, 'cloudStorage', snapshot.docs[0].id), storageData);
      }

      setIsConnected(true);
      alert(`Successfully connected to ${selectedProvider}!`);
    } catch (error) {
      console.error('Error connecting to cloud storage:', error);
      alert('Error connecting to cloud storage: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const q = query(collection(db, 'cloudStorage'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        await updateDoc(doc(db, 'cloudStorage', snapshot.docs[0].id), {
          isConnected: false,
          disconnectedAt: new Date()
        });
      }

      setIsConnected(false);
      setCredentials({ email: '', password: '', apiKey: '', clientId: '', clientSecret: '', accessToken: '', refreshToken: '' });
      alert('Disconnected from cloud storage');
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={formStyle}>
        <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>
          ☁️ Cloud Storage Settings
        </h1>

        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
            Select Cloud Storage Provider
          </label>
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            style={selectStyle}
            disabled={isConnected}
          >
            <option value="">Choose a provider</option>
            <option value="google-drive">Google Drive</option>
            <option value="onedrive">OneDrive</option>
            <option value="dropbox">Dropbox</option>
          </select>
        </div>

        {selectedProvider && !isConnected && (
          <div>
            <h3 style={{ color: '#555', marginBottom: '20px' }}>
              Connect to {selectedProvider.replace('-', ' ').toUpperCase()}
            </h3>
            
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
              Email Address
            </label>
            <input
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials({...credentials, email: e.target.value})}
              style={inputStyle}
              placeholder="Enter your email address"
            />

            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
              Password
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              style={inputStyle}
              placeholder="Enter your password"
            />

            {selectedProvider === 'google-drive' && (
              <>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
                  Client ID (Optional)
                </label>
                <input
                  type="text"
                  value={credentials.clientId}
                  onChange={(e) => setCredentials({...credentials, clientId: e.target.value})}
                  style={inputStyle}
                  placeholder="Google Client ID"
                />
              </>
            )}

            {selectedProvider === 'dropbox' && (
              <>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
                  App Key (Optional)
                </label>
                <input
                  type="text"
                  value={credentials.apiKey}
                  onChange={(e) => setCredentials({...credentials, apiKey: e.target.value})}
                  style={inputStyle}
                  placeholder="Dropbox App Key"
                />
              </>
            )}

            <button 
              onClick={handleConnect}
              style={buttonStyle}
              disabled={loading}
            >
              {loading ? 'Connecting...' : `Connect to ${selectedProvider.replace('-', ' ').toUpperCase()}`}
            </button>
          </div>
        )}

        {isConnected && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <div style={{ 
              background: '#d4edda', 
              color: '#155724', 
              padding: '15px', 
              borderRadius: '8px', 
              marginBottom: '20px' 
            }}>
              ✅ Connected to {selectedProvider.replace('-', ' ').toUpperCase()}
            </div>
            
            <button 
              onClick={handleDisconnect}
              style={{
                ...buttonStyle,
                background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
              }}
            >
              Disconnect
            </button>
          </div>
        )}

        <div style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
          <h4 style={{ color: '#555', marginBottom: '15px' }}>ℹ️ How it works:</h4>
          <ul style={{ color: '#666', lineHeight: '1.6' }}>
            <li>Connect your cloud storage account securely</li>
            <li>When you email invoices, PDFs will be uploaded to your cloud storage</li>
            <li>Email will contain a shareable link instead of the large PDF attachment</li>
            <li>Recipients can view and download the PDF from the cloud link</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default CloudStorageSettings;
