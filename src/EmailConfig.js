
import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase.js';
import Navigation from './Navigation.js';

const EMAIL_PROVIDERS = {
  gmail: {
    name: 'Gmail',
    smtp: 'smtp.gmail.com',
    port: 587,
    secure: false,
    instructions: 'You need to use an App Password. Go to Google Account settings > Security > App passwords to generate one.'
  },
  outlook: {
    name: 'Outlook/Hotmail',
    smtp: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    instructions: 'Use your regular Outlook password or create an app password in account settings.'
  },
  yahoo: {
    name: 'Yahoo',
    smtp: 'smtp.mail.yahoo.com',
    port: 587,
    secure: false,
    instructions: 'You need to generate an app password. Go to Yahoo Account Security > Generate app password.'
  },
  custom: {
    name: 'Custom SMTP',
    smtp: '',
    port: 587,
    secure: false,
    instructions: 'Enter your custom SMTP server details.'
  }
};

function EmailConfig({ user }) {
  const [selectedProvider, setSelectedProvider] = useState('gmail');
  const [emailConfig, setEmailConfig] = useState({
    email: '',
    password: '',
    smtp: '',
    port: 587,
    secure: false,
    provider: 'gmail'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  useEffect(() => {
    loadEmailConfig();
  }, [user]);

  useEffect(() => {
    if (selectedProvider !== 'custom') {
      const provider = EMAIL_PROVIDERS[selectedProvider];
      setEmailConfig(prev => ({
        ...prev,
        smtp: provider.smtp,
        port: provider.port,
        secure: provider.secure,
        provider: selectedProvider
      }));
    }
  }, [selectedProvider]);

  const loadEmailConfig = async () => {
    if (!user) return;
    try {
      const configDoc = await getDoc(doc(db, 'emailConfigs', user.uid));
      if (configDoc.exists()) {
        const config = configDoc.data();
        setEmailConfig(config);
        setSelectedProvider(config.provider || 'gmail');
      }
    } catch (error) {
      console.error('Error loading email config:', error);
    }
  };

  const saveEmailConfig = async () => {
    if (!user) return;
    setLoading(true);
    setMessage('');

    try {
      await setDoc(doc(db, 'emailConfigs', user.uid), emailConfig);
      setMessage('✅ Email configuration saved successfully!');
    } catch (error) {
      console.error('Error saving email config:', error);
      setMessage('❌ Error saving email configuration: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testEmailConfig = async () => {
    setIsTestingEmail(true);
    setMessage('');

    try {
      if (!emailConfig.email || !emailConfig.password || !emailConfig.smtp) {
        throw new Error('Please fill in all required fields');
      }

      // Import the test function
      const { testEmailConfig: testConfig } = await import('./emailService.js');
      const result = await testConfig(emailConfig);

      if (result.success) {
        setMessage('✅ ' + result.message);
      } else {
        setMessage('❌ ' + result.error);
      }
    } catch (error) {
      setMessage('❌ Configuration test failed: ' + error.message);
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleChange = (field, value) => {
    setEmailConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  };

  const contentStyle = {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
    paddingTop: '100px'
  };

  const cardStyle = {
    background: 'rgba(255,255,255,0.95)',
    padding: '30px',
    borderRadius: '16px',
    marginBottom: '20px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    backdropFilter: 'blur(15px)'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    margin: '8px 0',
    border: '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '16px',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  };

  const selectStyle = {
    ...inputStyle,
    appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 1rem center',
    backgroundSize: '1rem',
    paddingRight: '3rem'
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
    marginRight: '10px',
    marginTop: '10px'
  };

  const testButtonStyle = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)'
  };

  return (
    <div style={containerStyle}>
      <Navigation user={user} />
      <div style={contentStyle}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '300', color: 'white' }}>
            📧 Email Configuration
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0, color: 'white' }}>
            Set up your own email to send quotes and invoices
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, color: '#333' }}>Choose Your Email Provider</h2>
          
          <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '5px' }}>
            Email Provider
          </label>
          <select
            style={selectStyle}
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
          >
            {Object.entries(EMAIL_PROVIDERS).map(([key, provider]) => (
              <option key={key} value={key}>{provider.name}</option>
            ))}
          </select>

          <div style={{ 
            background: '#e3f2fd', 
            padding: '15px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            border: '1px solid #2196f3'
          }}>
            <strong>Instructions:</strong><br />
            {EMAIL_PROVIDERS[selectedProvider].instructions}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '5px' }}>
                Email Address *
              </label>
              <input
                type="email"
                style={inputStyle}
                value={emailConfig.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="your-email@gmail.com"
              />
            </div>

            <div>
              <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '5px' }}>
                Password / App Password *
              </label>
              <input
                type="password"
                style={inputStyle}
                value={emailConfig.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Your app password"
              />
            </div>

            {selectedProvider === 'custom' && (
              <>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '5px' }}>
                    SMTP Server *
                  </label>
                  <input
                    type="text"
                    style={inputStyle}
                    value={emailConfig.smtp}
                    onChange={(e) => handleChange('smtp', e.target.value)}
                    placeholder="smtp.yourprovider.com"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '5px' }}>
                    Port
                  </label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={emailConfig.port}
                    onChange={(e) => handleChange('port', parseInt(e.target.value))}
                    placeholder="587"
                  />
                </div>
              </>
            )}
          </div>

          <div style={{ marginTop: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={emailConfig.secure}
                onChange={(e) => handleChange('secure', e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Use SSL/TLS (recommended for port 465)
            </label>
          </div>

          <div style={{ marginTop: '30px' }}>
            <button
              onClick={saveEmailConfig}
              disabled={loading}
              style={buttonStyle}
            >
              {loading ? '💾 Saving...' : '💾 Save Configuration'}
            </button>

            <button
              onClick={testEmailConfig}
              disabled={isTestingEmail}
              style={testButtonStyle}
            >
              {isTestingEmail ? '🧪 Testing...' : '🧪 Test Configuration'}
            </button>
          </div>

          {message && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              borderRadius: '8px',
              background: message.includes('✅') ? '#d4edda' : '#f8d7da',
              border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
              color: message.includes('✅') ? '#155724' : '#721c24'
            }}>
              {message}
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, color: '#333' }}>🔒 Security Notes</h3>
          <ul style={{ color: '#666', lineHeight: '1.6' }}>
            <li><strong>App Passwords:</strong> Most providers require app-specific passwords instead of your regular password</li>
            <li><strong>Two-Factor Authentication:</strong> You may need to enable 2FA to create app passwords</li>
            <li><strong>Data Security:</strong> Your email credentials are encrypted and stored securely</li>
            <li><strong>Gmail Users:</strong> Enable "Less secure app access" or use App Passwords</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default EmailConfig;
