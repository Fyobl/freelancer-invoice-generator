import React, { useState, useEffect } from 'react';
import { db } from './firebase.js';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where
} from 'firebase/firestore';
import { useDarkMode } from './DarkModeContext.js';

function CompanySettings({ user }) {
  const { isDarkMode } = useDarkMode();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [companyData, setCompanyData] = useState({
    companyName: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    taxNumber: '',
    registrationNumber: ''
  });

  useEffect(() => {
    if (user) {
      fetchCompanySettings();
    }
  }, [user]);

  const fetchCompanySettings = async () => {
    if (!user) return;

    try {
      const q = query(collection(db, 'companySettings'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setCompanyData(data);
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const q = query(collection(db, 'companySettings'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      const dataToSave = {
        ...companyData,
        userId: user.uid,
        updatedAt: new Date()
      };

      if (snapshot.empty) {
        // Create new document
        await addDoc(collection(db, 'companySettings'), dataToSave);
      } else {
        // Update existing document
        const docId = snapshot.docs[0].id;
        await updateDoc(doc(db, 'companySettings', docId), dataToSave);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      alert('Error saving company settings: ' + error.message);
    }
    setLoading(false);
  };

  const containerStyle = {
    minHeight: '100vh',
    background: isDarkMode 
      ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' 
      : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
    fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    paddingLeft: '20px',
    paddingRight: '20px',
    paddingTop: '80px',
    paddingBottom: '40px',
    color: isDarkMode ? '#f8fafc' : '#1e293b'
  };

  const contentStyle = {
    maxWidth: '800px',
    margin: '0 auto'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '40px',
    color: isDarkMode ? '#f1f5f9' : '#1e293b'
  };

  const formStyle = {
    background: isDarkMode 
      ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' 
      : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: isDarkMode 
      ? '0 20px 40px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.3)' 
      : '0 20px 40px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.05)',
    border: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0'
  };

  const inputStyle = {
    width: '100%',
    padding: '15px',
    marginBottom: '20px',
    borderRadius: '8px',
    border: isDarkMode ? '1px solid #475569' : '1px solid #cbd5e1',
    background: isDarkMode ? '#374151' : '#ffffff',
    color: isDarkMode ? '#f1f5f9' : '#1e293b',
    fontSize: '16px'
  };

  const buttonStyle = {
    background: saved ? '#28a745' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '15px 30px',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
    transition: 'all 0.3s ease',
    width: '100%'
  };

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '300' }}>
            ⚙️ Company Settings
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
            Configure your company information for invoices and reports
          </p>
        </div>

        <form style={formStyle} onSubmit={saveSettings}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Company Name *
              </label>
              <input
                type="text"
                value={companyData.companyName}
                onChange={(e) => setCompanyData({...companyData, companyName: e.target.value})}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Email Address *
              </label>
              <input
                type="email"
                value={companyData.email}
                onChange={(e) => setCompanyData({...companyData, email: e.target.value})}
                style={inputStyle}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Address
            </label>
            <textarea
              value={companyData.address}
              onChange={(e) => setCompanyData({...companyData, address: e.target.value})}
              style={{ ...inputStyle, minHeight: '100px' }}
              placeholder="Full company address..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={companyData.phone}
                onChange={(e) => setCompanyData({...companyData, phone: e.target.value})}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Website
              </label>
              <input
                type="url"
                value={companyData.website}
                onChange={(e) => setCompanyData({...companyData, website: e.target.value})}
                style={inputStyle}
                placeholder="https://..."
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Tax Number
              </label>
              <input
                type="text"
                value={companyData.taxNumber}
                onChange={(e) => setCompanyData({...companyData, taxNumber: e.target.value})}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Registration Number
              </label>
              <input
                type="text"
                value={companyData.registrationNumber}
                onChange={(e) => setCompanyData({...companyData, registrationNumber: e.target.value})}
                style={inputStyle}
              />
            </div>
          </div>

          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? 'Saving...' : saved ? '✅ Settings Saved!' : '💾 Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CompanySettings;
import React, { useState } from 'react';
import { useDarkMode } from './DarkModeContext.js';

function CompanySettings({ user }) {
  const { isDarkMode } = useDarkMode();
  const [settings, setSettings] = useState({
    companyName: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    currency: 'GBP'
  });

  const containerStyle = {
    minHeight: '100vh',
    background: isDarkMode 
      ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' 
      : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
    fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    paddingLeft: '20px',
    paddingRight: '20px',
    paddingTop: '80px',
    paddingBottom: '40px',
    color: isDarkMode ? '#f8fafc' : '#1e293b'
  };

  const contentStyle = {
    maxWidth: '800px',
    margin: '0 auto'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '40px',
    color: isDarkMode ? '#f1f5f9' : '#1e293b'
  };

  const formStyle = {
    background: isDarkMode 
      ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' 
      : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: isDarkMode 
      ? '0 20px 40px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.3)' 
      : '0 20px 40px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.05)',
    border: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    marginBottom: '20px',
    borderRadius: '8px',
    border: isDarkMode ? '1px solid #475569' : '1px solid #cbd5e1',
    background: isDarkMode ? '#374151' : '#ffffff',
    color: isDarkMode ? '#f1f5f9' : '#1e293b',
    fontSize: '16px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: isDarkMode ? '#f1f5f9' : '#374151'
  };

  const buttonStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '15px 30px',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
    transition: 'all 0.3s ease'
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Settings saved:', settings);
    alert('Settings saved successfully!');
  };

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '300' }}>
            ⚙️ Company Settings
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
            Configure your company details and preferences
          </p>
        </div>

        <form style={formStyle} onSubmit={handleSubmit}>
          <div>
            <label style={labelStyle}>Company Name</label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => setSettings({...settings, companyName: e.target.value})}
              style={inputStyle}
              placeholder="Enter your company name"
            />
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({...settings, email: e.target.value})}
              style={inputStyle}
              placeholder="company@example.com"
            />
          </div>

          <div>
            <label style={labelStyle}>Phone</label>
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) => setSettings({...settings, phone: e.target.value})}
              style={inputStyle}
              placeholder="+44 20 1234 5678"
            />
          </div>

          <div>
            <label style={labelStyle}>Address</label>
            <textarea
              value={settings.address}
              onChange={(e) => setSettings({...settings, address: e.target.value})}
              style={{...inputStyle, height: '80px', resize: 'vertical'}}
              placeholder="Enter your company address"
            />
          </div>

          <div>
            <label style={labelStyle}>Tax ID / VAT Number</label>
            <input
              type="text"
              value={settings.taxId}
              onChange={(e) => setSettings({...settings, taxId: e.target.value})}
              style={inputStyle}
              placeholder="GB123456789"
            />
          </div>

          <div>
            <label style={labelStyle}>Currency</label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings({...settings, currency: e.target.value})}
              style={inputStyle}
            >
              <option value="GBP">GBP (£)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>

          <button type="submit" style={buttonStyle}>
            Save Settings
          </button>
        </form>
      </div>
    </div>
  );
}

export default CompanySettings;
