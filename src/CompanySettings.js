
import React, { useState, useEffect } from 'react';
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

  const inputStyle = {
    width: '100%',
    padding: '10px',
    margin: '5px 0',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  };

  const sectionStyle = {
    background: 'white',
    padding: '20px',
    marginBottom: '20px',
    borderRadius: '8px',
    border: '1px solid #ddd'
  };

  return (
    <div>
      <Navigation user={user} />
      <div style={{ padding: '30px', fontFamily: 'Arial', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <h2>Company Settings</h2>
        <p>Customize your company information to appear on invoices and branding.</p>

        <div style={sectionStyle}>
          <h3>Company Logo</h3>
          <div style={{ marginBottom: '20px' }}>
            {companyData.logo && (
              <div style={{ marginBottom: '15px' }}>
                <img 
                  src={companyData.logo} 
                  alt="Company Logo" 
                  style={{ maxWidth: '200px', maxHeight: '100px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              style={{ padding: '5px' }}
            />
            <p style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>
              Upload your company logo (PNG, JPG, GIF). Recommended size: 200x100px
            </p>
          </div>
        </div>

        <div style={sectionStyle}>
          <h3>Basic Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div>
              <label>Company Name *</label>
              <input
                type="text"
                placeholder="Enter company name"
                value={companyData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label>Email Address</label>
              <input
                type="email"
                placeholder="company@example.com"
                value={companyData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label>Phone Number</label>
              <input
                type="tel"
                placeholder="+44 20 1234 5678"
                value={companyData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label>Website</label>
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

        <div style={sectionStyle}>
          <h3>Address</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Street Address</label>
              <input
                type="text"
                placeholder="123 Main Street"
                value={companyData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label>City</label>
              <input
                type="text"
                placeholder="London"
                value={companyData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label>Postcode</label>
              <input
                type="text"
                placeholder="SW1A 1AA"
                value={companyData.postcode}
                onChange={(e) => handleInputChange('postcode', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label>Country</label>
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

        <div style={sectionStyle}>
          <h3>Business Registration</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div>
              <label>VAT Number</label>
              <input
                type="text"
                placeholder="GB123456789"
                value={companyData.vatNumber}
                onChange={(e) => handleInputChange('vatNumber', e.target.value)}
                style={inputStyle}
              />
              <p style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>
                Your VAT registration number (if applicable)
              </p>
            </div>
            <div>
              <label>Company Registration Number</label>
              <input
                type="text"
                placeholder="12345678"
                value={companyData.companyNumber}
                onChange={(e) => handleInputChange('companyNumber', e.target.value)}
                style={inputStyle}
              />
              <p style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>
                Your company registration number
              </p>
            </div>
          </div>
        </div>

        <div style={sectionStyle}>
          <h3>Preview</h3>
          <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '20px', backgroundColor: '#f9f9f9' }}>
            {companyData.logo && (
              <img 
                src={companyData.logo} 
                alt="Company Logo" 
                style={{ maxWidth: '150px', maxHeight: '75px', marginBottom: '15px' }}
              />
            )}
            <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>{companyData.name || 'Your Company Name'}</h4>
            {companyData.address && <p style={{ margin: '2px 0', fontSize: '14px' }}>{companyData.address}</p>}
            {companyData.city && <p style={{ margin: '2px 0', fontSize: '14px' }}>{companyData.city}, {companyData.postcode}</p>}
            {companyData.country && <p style={{ margin: '2px 0', fontSize: '14px' }}>{companyData.country}</p>}
            {companyData.email && <p style={{ margin: '2px 0', fontSize: '14px' }}>Email: {companyData.email}</p>}
            {companyData.phone && <p style={{ margin: '2px 0', fontSize: '14px' }}>Phone: {companyData.phone}</p>}
            {companyData.website && <p style={{ margin: '2px 0', fontSize: '14px' }}>Website: {companyData.website}</p>}
            {companyData.vatNumber && <p style={{ margin: '2px 0', fontSize: '14px' }}>VAT: {companyData.vatNumber}</p>}
            {companyData.companyNumber && <p style={{ margin: '2px 0', fontSize: '14px' }}>Company No: {companyData.companyNumber}</p>}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button
            onClick={saveCompanySettings}
            disabled={loading}
            style={{
              padding: '12px 30px',
              backgroundColor: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Saving...' : 'Save Company Settings'}
          </button>
          
          {saved && (
            <p style={{ color: '#28a745', marginTop: '10px', fontSize: '14px' }}>
              ✅ Company settings saved successfully!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CompanySettings;
