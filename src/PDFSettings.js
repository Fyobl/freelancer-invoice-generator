
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase.js';
import Navigation from './Navigation.js';

function PDFSettings() {
  const [pdfConfig, setPdfConfig] = useState({
    // Theme Configuration
    theme: {
      colors: {
        primary: [99, 102, 241],
        secondary: [75, 85, 99],
        dark: [17, 24, 39],
        light: [107, 114, 128],
        background: [250, 251, 252],
        border: [229, 231, 235]
      },
      fonts: {
        title: { size: 20, weight: 'bold' },
        heading: { size: 14, weight: 'bold' },
        normal: { size: 10, weight: 'normal' },
        small: { size: 8, weight: 'normal' },
        tiny: { size: 7, weight: 'normal' }
      },
      spacing: {
        headerHeight: 50,
        contentStart: 63,
        sectionGap: 15,
        footerOffset: 15
      }
    },
    // Brand Customization
    brandColors: {
      primary: '#6366f1',
      secondary: '#4b5563',
      accent: '#059669'
    },
    // Template Styles
    templateStyle: 'modern', // modern, classic, minimal
    // Watermark Settings
    watermark: {
      enabled: false,
      text: 'DRAFT',
      opacity: 0.1,
      fontSize: 60,
      color: '#cccccc'
    },
    // Logo Settings
    logo: {
      maxWidth: 70,
      maxHeight: 40,
      positioning: 'top-left' // top-left, top-center, top-right
    }
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userData, setUserData] = useState(null);

  const user = auth.currentUser;

  useEffect(() => {
    fetchPDFSettings();
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

  const fetchPDFSettings = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, 'pdfSettings', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPdfConfig(prev => ({ ...prev, ...docSnap.data() }));
      }
    } catch (error) {
      console.error('Error fetching PDF settings:', error);
    }
  };

  const savePDFSettings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await setDoc(doc(db, 'pdfSettings', user.uid), {
        ...pdfConfig,
        userId: user.uid,
        updatedAt: new Date()
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      alert('Error saving PDF settings: ' + error.message);
    }
    setLoading(false);
  };

  const updateConfig = (path, value) => {
    setPdfConfig(prev => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current = newConfig;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
    setSaved(false);
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  };

  const rgbToHex = (rgb) => {
    return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
  };

  // Styles
  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
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
    transition: 'border-color 0.3s ease',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    boxSizing: 'border-box'
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

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#333',
    fontSize: '14px'
  };

  return (
    <div style={containerStyle}>
      <Navigation user={user} />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', paddingTop: '100px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '300', color: 'white' }}>
            🎨 PDF Settings
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0, color: 'white' }}>
            Hello {userData?.firstName || user?.email?.split('@')[0]}! Customize your PDF themes and styling
          </p>
        </div>

        {/* Theme Configuration */}
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
          <h3 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '1.5rem' }}>
            🎨 Theme Colors
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Primary Color</label>
              <input
                type="color"
                value={rgbToHex(pdfConfig.theme.colors.primary)}
                onChange={(e) => updateConfig('theme.colors.primary', hexToRgb(e.target.value))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Secondary Color</label>
              <input
                type="color"
                value={rgbToHex(pdfConfig.theme.colors.secondary)}
                onChange={(e) => updateConfig('theme.colors.secondary', hexToRgb(e.target.value))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Background Color</label>
              <input
                type="color"
                value={rgbToHex(pdfConfig.theme.colors.background)}
                onChange={(e) => updateConfig('theme.colors.background', hexToRgb(e.target.value))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Border Color</label>
              <input
                type="color"
                value={rgbToHex(pdfConfig.theme.colors.border)}
                onChange={(e) => updateConfig('theme.colors.border', hexToRgb(e.target.value))}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Template Styles */}
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
          <h3 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '1.5rem' }}>
            📄 Template Styles
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            {['modern', 'classic', 'minimal'].map(style => (
              <div 
                key={style}
                style={{
                  padding: '20px',
                  border: pdfConfig.templateStyle === style ? '3px solid #667eea' : '2px solid #e9ecef',
                  borderRadius: '12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: pdfConfig.templateStyle === style ? '#f8f9ff' : '#fff',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => updateConfig('templateStyle', style)}
              >
                <h4 style={{ margin: '0 0 10px 0', textTransform: 'capitalize' }}>{style}</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                  {style === 'modern' && 'Clean, contemporary design'}
                  {style === 'classic' && 'Traditional, professional look'}
                  {style === 'minimal' && 'Simple, clean layout'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Watermark Settings */}
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
          <h3 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '1.5rem' }}>
            💧 Watermark Settings
          </h3>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                checked={pdfConfig.watermark.enabled}
                onChange={(e) => updateConfig('watermark.enabled', e.target.checked)}
              />
              <span style={{ fontWeight: 'bold' }}>Enable Watermark</span>
            </label>
          </div>
          {pdfConfig.watermark.enabled && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Watermark Text</label>
                <input
                  type="text"
                  value={pdfConfig.watermark.text}
                  onChange={(e) => updateConfig('watermark.text', e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Opacity (0.1 - 1.0)</label>
                <input
                  type="number"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={pdfConfig.watermark.opacity}
                  onChange={(e) => updateConfig('watermark.opacity', parseFloat(e.target.value))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Font Size</label>
                <input
                  type="number"
                  min="20"
                  max="100"
                  value={pdfConfig.watermark.fontSize}
                  onChange={(e) => updateConfig('watermark.fontSize', parseInt(e.target.value))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Color</label>
                <input
                  type="color"
                  value={pdfConfig.watermark.color}
                  onChange={(e) => updateConfig('watermark.color', e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          )}
        </div>

        {/* Font Settings */}
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
          <h3 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '1.5rem' }}>
            🔤 Font Settings
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {Object.entries(pdfConfig.theme.fonts).map(([fontType, font]) => (
              <div key={fontType}>
                <label style={labelStyle}>{fontType.charAt(0).toUpperCase() + fontType.slice(1)} Size</label>
                <input
                  type="number"
                  min="6"
                  max="24"
                  value={font.size}
                  onChange={(e) => updateConfig(`theme.fonts.${fontType}.size`, parseInt(e.target.value))}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Logo Settings */}
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
          <h3 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '1.5rem' }}>
            🏢 Logo Settings
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Max Width (px)</label>
              <input
                type="number"
                min="50"
                max="200"
                value={pdfConfig.logo.maxWidth}
                onChange={(e) => updateConfig('logo.maxWidth', parseInt(e.target.value))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Max Height (px)</label>
              <input
                type="number"
                min="25"
                max="100"
                value={pdfConfig.logo.maxHeight}
                onChange={(e) => updateConfig('logo.maxHeight', parseInt(e.target.value))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Position</label>
              <select
                value={pdfConfig.logo.positioning}
                onChange={(e) => updateConfig('logo.positioning', e.target.value)}
                style={inputStyle}
              >
                <option value="top-left">Top Left</option>
                <option value="top-center">Top Center</option>
                <option value="top-right">Top Right</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <button
            onClick={savePDFSettings}
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
            {loading ? '⏳ Saving...' : '💾 Save PDF Settings'}
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
                ✅ PDF settings saved successfully!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PDFSettings;
