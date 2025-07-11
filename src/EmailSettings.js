
import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { auth, db } from './firebase.js';
import Navigation from './Navigation.js';

function EmailSettings() {
  const [emailTemplates, setEmailTemplates] = useState({
    invoice: {
      subject: 'Invoice {invoiceNumber} from {companyName}',
      body: `Dear {clientName},

Please find your invoice attached via the following link:
{downloadLink}

Invoice Details:
- Invoice Number: {invoiceNumber}
- Amount: £{amount}
- Due Date: {dueDate}

Thank you for your business!

Best regards,
{contactName}`
    },
    quote: {
      subject: 'Quote {quoteNumber} from {companyName}',
      body: `Dear {clientName},

Please find your quote attached via the following link:
{downloadLink}

Quote Details:
- Quote Number: {quoteNumber}
- Amount: £{amount}
- Valid Until: {validUntil}

Thank you for considering our services!

Best regards,
{contactName}`
    }
  });
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const user = auth.currentUser;

  useEffect(() => {
    fetchEmailSettings();
    fetchUserData();
  }, []);

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

  const fetchEmailSettings = async () => {
    if (!user) return;

    try {
      const emailDoc = await getDoc(doc(db, 'emailSettings', user.uid));
      if (emailDoc.exists()) {
        setEmailTemplates(emailDoc.data().templates);
      }
    } catch (error) {
      console.error('Error fetching email settings:', error);
    }
  };

  const handleTemplateChange = (type, field, value) => {
    setEmailTemplates(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
    setSaved(false);
  };

  const resetToDefault = (type) => {
    const defaultTemplates = {
      invoice: {
        subject: 'Invoice {invoiceNumber} from {companyName}',
        body: `Dear {clientName},

Please find your invoice attached via the following link:
{downloadLink}

Invoice Details:
- Invoice Number: {invoiceNumber}
- Amount: £{amount}
- Due Date: {dueDate}

Thank you for your business!

Best regards,
{contactName}`
      },
      quote: {
        subject: 'Quote {quoteNumber} from {companyName}',
        body: `Dear {clientName},

Please find your quote attached via the following link:
{downloadLink}

Quote Details:
- Quote Number: {quoteNumber}
- Amount: £{amount}
- Valid Until: {validUntil}

Thank you for considering our services!

Best regards,
{contactName}`
      }
    };

    setEmailTemplates(prev => ({
      ...prev,
      [type]: defaultTemplates[type]
    }));
    setSaved(false);
  };

  const saveEmailSettings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await setDoc(doc(db, 'emailSettings', user.uid), {
        templates: emailTemplates,
        userId: user.uid,
        updatedAt: new Date()
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      alert('Error saving email settings: ' + error.message);
    }
    setLoading(false);
  };

  // Styles
  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  };

  const headerStyle = {
    color: 'white',
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
    outline: 'none'
  };

  const textareaStyle = {
    ...inputStyle,
    height: '200px',
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
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    marginRight: '10px'
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
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', paddingTop: '100px' }}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '300' }}>
            📧 Email Settings
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
            Hello {userData?.firstName || user?.email?.split('@')[0]}! Customize your email templates for invoices and quotes
          </p>
        </div>

        {/* Available Variables Info */}
        <div style={sectionStyle}>
          <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '1.3rem' }}>
            📝 Available Variables
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <strong>Invoice Variables:</strong>
              <ul style={{ margin: '10px 0', paddingLeft: '20px', fontSize: '13px' }}>
                <li>{'{invoiceNumber}'}</li>
                <li>{'{clientName}'}</li>
                <li>{'{amount}'}</li>
                <li>{'{dueDate}'}</li>
                <li>{'{downloadLink}'}</li>
                <li>{'{companyName}'}</li>
                <li>{'{contactName}'}</li>
              </ul>
            </div>
            <div>
              <strong>Quote Variables:</strong>
              <ul style={{ margin: '10px 0', paddingLeft: '20px', fontSize: '13px' }}>
                <li>{'{quoteNumber}'}</li>
                <li>{'{clientName}'}</li>
                <li>{'{amount}'}</li>
                <li>{'{validUntil}'}</li>
                <li>{'{downloadLink}'}</li>
                <li>{'{companyName}'}</li>
                <li>{'{contactName}'}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Invoice Email Template */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#333', fontSize: '1.3rem' }}>
              📄 Invoice Email Template
            </h3>
            <button
              onClick={() => resetToDefault('invoice')}
              style={{
                ...buttonStyle,
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                fontSize: '12px',
                padding: '8px 16px'
              }}
            >
              🔄 Reset to Default
            </button>
          </div>

          <label style={labelStyle}>Subject Line:</label>
          <input
            style={inputStyle}
            value={emailTemplates.invoice.subject}
            onChange={(e) => handleTemplateChange('invoice', 'subject', e.target.value)}
            placeholder="Email subject..."
          />

          <label style={labelStyle}>Email Body:</label>
          <textarea
            style={textareaStyle}
            value={emailTemplates.invoice.body}
            onChange={(e) => handleTemplateChange('invoice', 'body', e.target.value)}
            placeholder="Email body content..."
          />
        </div>

        {/* Quote Email Template */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#333', fontSize: '1.3rem' }}>
              💰 Quote Email Template
            </h3>
            <button
              onClick={() => resetToDefault('quote')}
              style={{
                ...buttonStyle,
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                fontSize: '12px',
                padding: '8px 16px'
              }}
            >
              🔄 Reset to Default
            </button>
          </div>

          <label style={labelStyle}>Subject Line:</label>
          <input
            style={inputStyle}
            value={emailTemplates.quote.subject}
            onChange={(e) => handleTemplateChange('quote', 'subject', e.target.value)}
            placeholder="Email subject..."
          />

          <label style={labelStyle}>Email Body:</label>
          <textarea
            style={textareaStyle}
            value={emailTemplates.quote.body}
            onChange={(e) => handleTemplateChange('quote', 'body', e.target.value)}
            placeholder="Email body content..."
          />
        </div>

        {/* Save Button */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <button
            onClick={saveEmailSettings}
            disabled={loading}
            style={{
              ...buttonStyle,
              backgroundColor: loading ? '#ccc' : undefined,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              fontSize: '16px',
              padding: '15px 30px'
            }}
          >
            {loading ? '⏳ Saving...' : '💾 Save Email Templates'}
          </button>

          {saved && (
            <div style={{ 
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#d4edda',
              color: '#155724',
              borderRadius: '8px',
              border: '1px solid #c3e6cb',
              display: 'inline-block'
            }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
                ✅ Email templates saved successfully!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmailSettings;
