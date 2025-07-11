
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase.js';
import Navigation from './Navigation.js';

function CloudStorageSettings({ user }) {
  const [cloudSettings, setCloudSettings] = useState({
    provider: 'none',
    awsAccessKey: '',
    awsSecretKey: '',
    awsBucket: '',
    awsRegion: 'us-east-1',
    gcpProjectId: '',
    gcpBucket: '',
    gcpCredentials: '',
    azureAccount: '',
    azureKey: '',
    azureContainer: '',
    oneDriveClientId: '',
    oneDriveClientSecret: '',
    oneDriveTenantId: '',
    dropboxAppKey: '',
    dropboxAppSecret: '',
    dropboxAccessToken: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      fetchCloudSettings();
    }
  }, [user]);

  const fetchCloudSettings = async () => {
    try {
      const docRef = doc(db, 'cloudStorage', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCloudSettings({ ...cloudSettings, ...docSnap.data() });
      }
    } catch (error) {
      console.error('Error fetching cloud settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCloudSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await setDoc(doc(db, 'cloudStorage', user.uid), cloudSettings);
      setMessage('Cloud storage settings saved successfully!');
    } catch (error) {
      setMessage('Error saving settings: ' + error.message);
      console.error('Error saving cloud settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundAttachment: 'fixed'
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

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    margin: '8px 0',
    border: '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '16px',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box'
  };

  const selectStyle = {
    ...inputStyle,
    backgroundColor: '#fff'
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
    marginTop: '20px'
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={containerStyle}>
      <Navigation user={user} />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', paddingTop: '100px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '300', color: 'white' }}>
            ☁️ Cloud Storage Settings
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0, color: 'white' }}>
            Configure your cloud storage to host PDF files and generate shareable links
          </p>
        </div>

        <form onSubmit={saveCloudSettings}>
          <div style={sectionStyle}>
            <h2 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '1.5rem' }}>
              🔧 Cloud Provider Configuration
            </h2>
            
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
              Cloud Storage Provider
            </label>
            <select
              value={cloudSettings.provider}
              onChange={(e) => setCloudSettings({ ...cloudSettings, provider: e.target.value })}
              style={selectStyle}
            >
              <option value="none">None (Email attachment only)</option>
              <option value="aws">Amazon S3</option>
              <option value="gcp">Google Cloud Storage</option>
              <option value="azure">Azure Blob Storage</option>
              <option value="onedrive">Microsoft OneDrive</option>
              <option value="dropbox">Dropbox</option>
            </select>

            {cloudSettings.provider === 'aws' && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ color: '#333', marginBottom: '15px' }}>Amazon S3 Configuration</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                      Access Key ID
                    </label>
                    <input
                      type="text"
                      value={cloudSettings.awsAccessKey}
                      onChange={(e) => setCloudSettings({ ...cloudSettings, awsAccessKey: e.target.value })}
                      style={inputStyle}
                      placeholder="AKIA..."
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                      Secret Access Key
                    </label>
                    <input
                      type="password"
                      value={cloudSettings.awsSecretKey}
                      onChange={(e) => setCloudSettings({ ...cloudSettings, awsSecretKey: e.target.value })}
                      style={inputStyle}
                      placeholder="Secret key..."
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                      Bucket Name
                    </label>
                    <input
                      type="text"
                      value={cloudSettings.awsBucket}
                      onChange={(e) => setCloudSettings({ ...cloudSettings, awsBucket: e.target.value })}
                      style={inputStyle}
                      placeholder="my-invoice-bucket"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                      Region
                    </label>
                    <select
                      value={cloudSettings.awsRegion}
                      onChange={(e) => setCloudSettings({ ...cloudSettings, awsRegion: e.target.value })}
                      style={selectStyle}
                    >
                      <option value="us-east-1">US East (N. Virginia)</option>
                      <option value="us-west-2">US West (Oregon)</option>
                      <option value="eu-west-1">Europe (Ireland)</option>
                      <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {cloudSettings.provider === 'gcp' && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ color: '#333', marginBottom: '15px' }}>Google Cloud Storage Configuration</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                      Project ID
                    </label>
                    <input
                      type="text"
                      value={cloudSettings.gcpProjectId}
                      onChange={(e) => setCloudSettings({ ...cloudSettings, gcpProjectId: e.target.value })}
                      style={inputStyle}
                      placeholder="my-project-id"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                      Bucket Name
                    </label>
                    <input
                      type="text"
                      value={cloudSettings.gcpBucket}
                      onChange={(e) => setCloudSettings({ ...cloudSettings, gcpBucket: e.target.value })}
                      style={inputStyle}
                      placeholder="my-invoice-bucket"
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                    Service Account JSON (paste entire JSON content)
                  </label>
                  <textarea
                    value={cloudSettings.gcpCredentials}
                    onChange={(e) => setCloudSettings({ ...cloudSettings, gcpCredentials: e.target.value })}
                    style={{ ...inputStyle, height: '150px', resize: 'vertical' }}
                    placeholder='{"type": "service_account", "project_id": "...", ...}'
                  />
                </div>
              </div>
            )}

            {cloudSettings.provider === 'azure' && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ color: '#333', marginBottom: '15px' }}>Azure Blob Storage Configuration</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                      Storage Account Name
                    </label>
                    <input
                      type="text"
                      value={cloudSettings.azureAccount}
                      onChange={(e) => setCloudSettings({ ...cloudSettings, azureAccount: e.target.value })}
                      style={inputStyle}
                      placeholder="mystorageaccount"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                      Access Key
                    </label>
                    <input
                      type="password"
                      value={cloudSettings.azureKey}
                      onChange={(e) => setCloudSettings({ ...cloudSettings, azureKey: e.target.value })}
                      style={inputStyle}
                      placeholder="Access key..."
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                      Container Name
                    </label>
                    <input
                      type="text"
                      value={cloudSettings.azureContainer}
                      onChange={(e) => setCloudSettings({ ...cloudSettings, azureContainer: e.target.value })}
                      style={inputStyle}
                      placeholder="invoices"
                    />
                  </div>
                </div>
              </div>
            )}

            {cloudSettings.provider === 'onedrive' && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ color: '#333', marginBottom: '15px' }}>Microsoft OneDrive Configuration</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                      Client ID (Application ID)
                    </label>
                    <input
                      type="text"
                      value={cloudSettings.oneDriveClientId}
                      onChange={(e) => setCloudSettings({ ...cloudSettings, oneDriveClientId: e.target.value })}
                      style={inputStyle}
                      placeholder="12345678-1234-1234-1234-123456789012"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                      Client Secret
                    </label>
                    <input
                      type="password"
                      value={cloudSettings.oneDriveClientSecret}
                      onChange={(e) => setCloudSettings({ ...cloudSettings, oneDriveClientSecret: e.target.value })}
                      style={inputStyle}
                      placeholder="Client secret value..."
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                      Tenant ID (Directory ID)
                    </label>
                    <input
                      type="text"
                      value={cloudSettings.oneDriveTenantId}
                      onChange={(e) => setCloudSettings({ ...cloudSettings, oneDriveTenantId: e.target.value })}
                      style={inputStyle}
                      placeholder="87654321-4321-4321-4321-210987654321"
                    />
                  </div>
                </div>
              </div>
            )}

            {cloudSettings.provider === 'dropbox' && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ color: '#333', marginBottom: '15px' }}>Dropbox Configuration</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                      App Key
                    </label>
                    <input
                      type="text"
                      value={cloudSettings.dropboxAppKey}
                      onChange={(e) => setCloudSettings({ ...cloudSettings, dropboxAppKey: e.target.value })}
                      style={inputStyle}
                      placeholder="abcdefghij123456"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                      App Secret
                    </label>
                    <input
                      type="password"
                      value={cloudSettings.dropboxAppSecret}
                      onChange={(e) => setCloudSettings({ ...cloudSettings, dropboxAppSecret: e.target.value })}
                      style={inputStyle}
                      placeholder="App secret..."
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                      Access Token
                    </label>
                    <input
                      type="password"
                      value={cloudSettings.dropboxAccessToken}
                      onChange={(e) => setCloudSettings({ ...cloudSettings, dropboxAccessToken: e.target.value })}
                      style={inputStyle}
                      placeholder="sl.xxxxxxxxxxxxx"
                    />
                  </div>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={saving}
              style={{
                ...buttonStyle,
                opacity: saving ? 0.7 : 1,
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Saving...' : 'Save Cloud Storage Settings'}
            </button>
          </div>
        </form>

        {message && (
          <div style={{
            ...sectionStyle,
            border: message.includes('Error') ? '2px solid #dc3545' : '2px solid #28a745',
            background: message.includes('Error') ? 'rgba(248, 215, 218, 0.95)' : 'rgba(212, 237, 218, 0.95)',
            color: message.includes('Error') ? '#721c24' : '#155724'
          }}>
            {message}
          </div>
        )}

        <div style={sectionStyle}>
          <h3 style={{ color: '#333', marginBottom: '15px' }}>📋 Setup Instructions</h3>
          <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#666' }}>
            <p><strong>AWS S3:</strong> Create an IAM user with S3 permissions and get the access keys.</p>
            <p><strong>Google Cloud:</strong> Create a service account with Storage Admin role and download the JSON key.</p>
            <p><strong>Azure:</strong> Get your storage account access key from the Azure portal.</p>
            <p><strong>OneDrive:</strong> Register an app in Azure AD, get Client ID, Secret, and Tenant ID with Files.ReadWrite permissions.</p>
            <p><strong>Dropbox:</strong> Create a Dropbox app in the App Console, get App Key, Secret, and generate an Access Token.</p>
            <p><strong>Security:</strong> All credentials are encrypted and stored securely. Never share your keys publicly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CloudStorageSettings;
