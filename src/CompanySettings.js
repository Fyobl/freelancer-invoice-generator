import React, { useState, useEffect, useContext } from 'react';
import { auth, db } from './firebase.js';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  setDoc
} from 'firebase/firestore';
import Navigation from './Navigation.js';
import { DarkModeContext } from './DarkModeContext.js';

function CompanySettings() {
  const [companyData, setCompanyData] = useState({
    name: '',
    address: '',
    city: '',
    postcode: '',
    country: '',
    phone: '',
    email: '',
    website: '',
    vatNumber: '',
    companyNumber: '',
    logo: ''
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const { isDarkMode } = useContext(DarkModeContext);

  const user = auth.currentUser;

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
    if (!user) return;

    const q = query(collection(db, 'companySettings'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      setCompanyData(data);
    }
  };

  const handleInputChange = (field, value) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: value
    }));
    setSaved(false);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCompanyData(prev => ({
          ...prev,
          logo: event.target.result
        }));
        setSaved(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveCompanySettings = async () => {
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

  // Styles
  const containerStyle = {
    minHeight: '100vh',
    background: isDarkMode ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: isDarkMode ? 'white' : 'black'
  };

  const contentStyle = {
    padding: '30px',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const headerStyle = {
    color: isDarkMode ? '#f0f0f0' : 'white',
    textAlign: 'center',
    marginBottom: '40px'
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
    backgroundColor: isDarkMode ? '#333' : '#fff',
    color: isDarkMode ? 'white' : 'black',
    boxSizing: 'border-box',
    outline: 'none',
    height: '44px',
    lineHeight: '20px',
    verticalAlign: 'top'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: isDarkMode ? '#ddd' : '#333',
    fontSize: '14px'
  };

  const sectionStyle = {
    background: isDarkMode ? 'rgba(40,40,40,0.95)' : 'rgba(255,255,255,0.95)',
    padding: '30px',
    marginBottom: '30px',
    borderRadius: '16px',
    border: '2px solid #f8f9fa',
    backdropFilter: 'blur(15px)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    color: isDarkMode ? 'white' : 'black'
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

  const previewStyle = {
    border: '2px solid #e9ecef',
    borderRadius: '12px',
    padding: '25px',
    backgroundColor: isDarkMode ? '#222' : '#f8f9fa',
    color: isDarkMode ? 'white' : 'black',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
  };

  const fileInputStyle = {
    padding: '10px',
    border: '2px dashed #667eea',
    borderRadius: '8px',
    backgroundColor: '#f8f9fa',
    cursor: 'pointer',
    transition: 'border-color 0.3s ease'
  };

  return (
    <div style={containerStyle}>
      <Navigation user={user} />
      <div style={contentStyle}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '300' }}>
            🏢 Company Settings
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
            Customize your company information to appear on invoices and branding
          </p>
        </div>

        {/* Company Logo Section */}
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
          <h3 style={{ margin: '0 0 25px 0', color: isDarkMode ? '#eee' : '#333', fontSize: '1.5rem' }}>
            🎨 Company Logo
          </h3>
          <div style={{ marginBottom: '20px' }}>
            {companyData.logo && (
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <img 
                  src={companyData.logo} 
                  alt="Company Logo" 
                  style={{ 
                    maxWidth: '250px', 
                    maxHeight: '125px', 
                    border: '2px solid #e9ecef', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              style={fileInputStyle}
            />
            <p style={{ fontSize: '12px', color: '#666', margin: '10px 0 0 0', textAlign: 'center' }}>
              📸 Upload your company logo (PNG, JPG, GIF). Recommended size: 250x125px
            </p>
          </div>
        </div>

        {/* Basic Information Section */}
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
          <h3 style={{ margin: '0 0 25px 0', color: isDarkMode ? '#eee' : '#333', fontSize: '1.5rem' }}>
            ℹ️ Basic Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Company Name *</label>
              <input
                type="text"
                placeholder="Enter company name"
                value={companyData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                placeholder="company@example.com"
                value={companyData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Phone Number</label>
              <input
                type="tel"
                placeholder="+44 20 1234 5678"
                value={companyData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Website</label>
              <input
                type="url"
                placeholder="https://www.company.com"
                value={companyData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Address Section */}
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
          <h3 style={{ margin: '0 0 25px 0', color: isDarkMode ? '#eee' : '#333', fontSize: '1.5rem' }}>
            📍 Address
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Street Address</label>
              <input
                type="text"
                placeholder="123 Main Street"
                value={companyData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>City</label>
              <input
                type="text"
                placeholder="London"
                value={companyData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Postcode</label>
              <input
                type="text"
                placeholder="SW1A 1AA"
                value={companyData.postcode}
                onChange={(e) => handleInputChange('postcode', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Country</label>
              <input
                type="text"
                placeholder="United Kingdom"
                value={companyData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Business Registration Section */}
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
          <h3 style={{ margin: '0 0 25px 0', color: isDarkMode ? '#eee' : '#333', fontSize: '1.5rem' }}>
            🏛️ Business Registration
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div>
              <label style={labelStyle}>VAT Number</label>
              <input
                type="text"
                placeholder="GB123456789"
                value={companyData.vatNumber}
                onChange={(e) => handleInputChange('vatNumber', e.target.value)}
                style={inputStyle}
              />
              <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
                💼 Your VAT registration number (if applicable)
              </p>
            </div>
            <div>
              <label style={labelStyle}>Company Registration Number</label>
              <input
                type="text"
                placeholder="12345678"
                value={companyData.companyNumber}
                onChange={(e) => handleInputChange('companyNumber', e.target.value)}
                style={inputStyle}
              />
              <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
                🏢 Your company registration number
              </p>
            </div>
          </div>
        </div>

        {/* Preview Section */}
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
          <h3 style={{ margin: '0 0 25px 0', color: isDarkMode ? '#eee' : '#333', fontSize: '1.5rem' }}>
            👁️ Preview
          </h3>
          <div style={previewStyle}>
            {companyData.logo && (
              <img 
                src={companyData.logo} 
                alt="Company Logo" 
                style={{ 
                  maxWidth: '200px', 
                  maxHeight: '100px', 
                  marginBottom: '20px',
                  display: 'block'
                }}
              />
            )}
            <h4 style={{ margin: '0 0 15px 0', color: isDarkMode ? '#eee' : '#333', fontSize: '1.3rem' }}>
              {companyData.name || 'Your Company Name'}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              <div>
                {companyData.address && <p style={{ margin: '3px 0', fontSize: '14px', color: isDarkMode ? '#ddd' : 'black' }}>📍 {companyData.address}</p>}
                {companyData.city && <p style={{ margin: '3px 0', fontSize: '14px', color: isDarkMode ? '#ddd' : 'black' }}>🏙️ {companyData.city}, {companyData.postcode}</p>}
                {companyData.country && <p style={{ margin: '3px 0', fontSize: '14px', color: isDarkMode ? '#ddd' : 'black' }}>🌍 {companyData.country}</p>}
              </div>
              <div>
                {companyData.email && <p style={{ margin: '3px 0', fontSize: '14px', color: isDarkMode ? '#ddd' : 'black' }}>📧 {companyData.email}</p>}
                {companyData.phone && <p style={{ margin: '3px 0', fontSize: '14px', color: isDarkMode ? '#ddd' : 'black' }}>📱 {companyData.phone}</p>}
                {companyData.website && <p style={{ margin: '3px 0', fontSize: '14px', color: isDarkMode ? '#ddd' : 'black' }}>🌐 {companyData.website}</p>}
                {companyData.vatNumber && <p style={{ margin: '3px 0', fontSize: '14px', color: isDarkMode ? '#ddd' : 'black' }}>💼 VAT: {companyData.vatNumber}</p>}
                {companyData.companyNumber && <p style={{ margin: '3px 0', fontSize: '14px', color: isDarkMode ? '#ddd' : 'black' }}>🏢 Company No: {companyData.companyNumber}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <button
            onClick={saveCompanySettings}
            disabled={loading}
            style={{
              ...buttonStyle,
              backgroundColor: loading ? '#ccc' : undefined,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
              }
            }}
          >
            {loading ? '⏳ Saving...' : '💾 Save Company Settings'}
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
                ✅ Company settings saved successfully!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CompanySettings;