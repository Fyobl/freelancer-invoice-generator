
import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  updateDoc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db, auth } from './firebase.js';
import Navigation from './Navigation.js';

function EmailSettings() {
  const [emailSettings, setEmailSettings] = useState({
    invoiceSubject: 'Invoice {invoiceNumber} from {companyName}',
    invoiceTemplate: `Dear {clientName},

Please find attached invoice {invoiceNumber} for the amount of £{totalAmount}.

Payment is due by {dueDate}.

Thank you for your business!

Best regards,
{senderName}
{companyName}`,
    quoteSubject: 'Quote {quoteNumber} from {companyName}',
    quoteTemplate: `Dear {clientName},

Please find attached quote {quoteNumber} for the amount of £{totalAmount}.

This quote is valid until {validUntil}.

We look forward to working with you!

Best regards,
{senderName}
{companyName}`,
    defaultSenderName: '',
    defaultSenderEmail: ''
  });

  const [userData, setUserData] = useState(null);
  const [companySettings, setCompanySettings] = useState({});
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      fetchEmailSettings();
      fetchUserData();
      fetchCompanySettings();
    }
  }, [user]);

  const fetchEmailSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'emailSettings', user.uid));
      if (settingsDoc.exists()) {
        setEmailSettings(prev => ({ ...prev, ...settingsDoc.data() }));
      }
    } catch (error) {
      console.error('Error fetching email settings:', error);
    }
  };

  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const companyDoc = await getDoc(doc(db, 'companySettings', user.uid));
      if (companyDoc.exists()) {
        setCompanySettings(companyDoc.data());
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
    }
  };

  const saveEmailSettings = async () => {
    try {
      await setDoc(doc(db, 'emailSettings', user.uid), emailSettings);
      alert('Email settings saved successfully!');
    } catch (error) {
      console.error('Error saving email settings:', error);
      alert('Error saving email settings. Please try again.');
    }
  };

  const resetToDefaults = () => {
    setEmailSettings({
      invoiceSubject: 'Invoice {invoiceNumber} from {companyName}',
      invoiceTemplate: `Dear {clientName},

Please find attached invoice {invoiceNumber} for the amount of £{totalAmount}.

Payment is due by {dueDate}.

Thank you for your business!

Best regards,
{senderName}
{companyName}`,
      quoteSubject: 'Quote {quoteNumber} from {companyName}',
      quoteTemplate: `Dear {clientName},

Please find attached quote {quoteNumber} for the amount of £{totalAmount}.

This quote is valid until {validUntil}.

We look forward to working with you!

Best regards,
{senderName}
{companyName}`,
      defaultSenderName: emailSettings.defaultSenderName,
      defaultSenderEmail: emailSettings.defaultSenderEmail
    });
  };

  // Styles
  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '40px',
    color: 'white',
    paddingTop: '100px'
  };

  const cardStyle = {
    background: 'white',
    borderRadius: '15px',
    padding: '30px',
    marginBottom: '30px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    border: 'none'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 15px',
    border: '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '15px',
    transition: 'border-color 0.3s ease',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    outline: 'none'
  };

  const textareaStyle = {
    ...inputStyle,
    height: '150px',
    resize: 'vertical',
    fontFamily: 'monospace'
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
    transition: 'transform 0.2s ease',
    marginRight: '10px'
  };

  return (
    <div style={containerStyle}>
      <Navigation user={user} />
      <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '300' }}>
            📧 Email Settings
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
            Customize your email templates and settings
          </p>
        </div>

        {/* Sender Information */}
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, color: '#333', fontSize: '1.5rem' }}>
            👤 Sender Information
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                Default Sender Name
              </label>
              <input
                style={inputStyle}
                placeholder="Your name"
                value={emailSettings.defaultSenderName}
                onChange={(e) => setEmailSettings(prev => ({ ...prev, defaultSenderName: e.target.value }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                Default Sender Email
              </label>
              <input
                style={inputStyle}
                type="email"
                placeholder="your.email@example.com"
                value={emailSettings.defaultSenderEmail}
                onChange={(e) => setEmailSettings(prev => ({ ...prev, defaultSenderEmail: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Invoice Template */}
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, color: '#333', fontSize: '1.5rem' }}>
            📄 Invoice Email Template
          </h2>
          
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
            Subject Line
          </label>
          <input
            style={inputStyle}
            placeholder="Email subject"
            value={emailSettings.invoiceSubject}
            onChange={(e) => setEmailSettings(prev => ({ ...prev, invoiceSubject: e.target.value }))}
          />

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
            Email Body
          </label>
          <textarea
            style={textareaStyle}
            placeholder="Email template body"
            value={emailSettings.invoiceTemplate}
            onChange={(e) => setEmailSettings(prev => ({ ...prev, invoiceTemplate: e.target.value }))}
          />

          <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginTop: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>Available Variables:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '12px', color: '#666' }}>
              <span><code>{'{invoiceNumber}'}</code> - Invoice number</span>
              <span><code>{'{clientName}'}</code> - Client name</span>
              <span><code>{'{totalAmount}'}</code> - Total amount</span>
              <span><code>{'{dueDate}'}</code> - Due date</span>
              <span><code>{'{senderName}'}</code> - Sender name</span>
              <span><code>{'{companyName}'}</code> - Company name</span>
            </div>
          </div>
        </div>

        {/* Quote Template */}
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, color: '#333', fontSize: '1.5rem' }}>
            💰 Quote Email Template
          </h2>
          
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
            Subject Line
          </label>
          <input
            style={inputStyle}
            placeholder="Email subject"
            value={emailSettings.quoteSubject}
            onChange={(e) => setEmailSettings(prev => ({ ...prev, quoteSubject: e.target.value }))}
          />

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
            Email Body
          </label>
          <textarea
            style={textareaStyle}
            placeholder="Email template body"
            value={emailSettings.quoteTemplate}
            onChange={(e) => setEmailSettings(prev => ({ ...prev, quoteTemplate: e.target.value }))}
          />

          <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginTop: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>Available Variables:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '12px', color: '#666' }}>
              <span><code>{'{quoteNumber}'}</code> - Quote number</span>
              <span><code>{'{clientName}'}</code> - Client name</span>
              <span><code>{'{totalAmount}'}</code> - Total amount</span>
              <span><code>{'{validUntil}'}</code> - Valid until date</span>
              <span><code>{'{senderName}'}</code> - Sender name</span>
              <span><code>{'{companyName}'}</code> - Company name</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={cardStyle}>
          <button
            onClick={saveEmailSettings}
            style={buttonStyle}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            💾 Save Settings
          </button>
          <button
            onClick={resetToDefaults}
            style={{
              ...buttonStyle,
              background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            🔄 Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailSettings;
