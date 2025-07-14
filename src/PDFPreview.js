
import React, { useState, useEffect } from 'react';
import { getDefaultTemplate } from './pdfTemplateService.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from './firebase.js';

const PDFPreview = () => {
  const [templates, setTemplates] = useState({
    invoice: null,
    quote: null,
    statement: null
  });
  const [companySettings, setCompanySettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplatesAndSettings();
  }, []);

  const loadTemplatesAndSettings = async () => {
    try {
      // Load templates
      const invoiceTemplate = await getDefaultTemplate('invoice');
      const quoteTemplate = await getDefaultTemplate('quote');
      const statementTemplate = await getDefaultTemplate('statement');

      setTemplates({
        invoice: invoiceTemplate,
        quote: quoteTemplate,
        statement: statementTemplate
      });

      // Load company settings
      if (auth.currentUser) {
        const q = query(collection(db, 'companySettings'), where('userId', '==', auth.currentUser.uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setCompanySettings(snapshot.docs[0].data());
        }
      }
    } catch (error) {
      console.error('Error loading templates and settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSampleData = (type) => {
    const baseData = {
      companyName: companySettings?.name || 'Your Company Name',
      companyAddress: companySettings?.address || '123 Business Street',
      companyCity: companySettings?.city || 'Business City',
      companyPostcode: companySettings?.postcode || 'BC1 2DE',
      companyPhone: companySettings?.phone || '01234 567890',
      companyEmail: companySettings?.email || 'info@yourcompany.com',
      companyNumber: companySettings?.companyNumber || '12345678',
      vatNumber: companySettings?.vatNumber || 'GB123456789',
      clientName: 'Sample Client Ltd'
    };

    switch (type) {
      case 'invoice':
        return {
          ...baseData,
          invoiceNumber: 'INV-001',
          createdDate: new Date().toLocaleDateString(),
          dueDate: 'Upon receipt',
          status: 'Unpaid',
          amount: '1,250.00'
        };
      case 'quote':
        return {
          ...baseData,
          quoteNumber: 'QUO-001',
          createdDate: new Date().toLocaleDateString(),
          validUntil: '30 days',
          status: 'Pending',
          amount: '1,250.00'
        };
      case 'statement':
        return {
          ...baseData,
          statementDate: new Date().toLocaleDateString(),
          period: 'January 2024',
          totalInvoices: '5',
          totalAmount: '6,250.00',
          paidAmount: '3,750.00',
          unpaidAmount: '2,500.00'
        };
      default:
        return baseData;
    }
  };

  const renderPreview = (template, type) => {
    if (!template) return <div>No template found</div>;

    const sampleData = getSampleData(type);
    
    return (
      <div style={{
        width: '595px',
        height: '842px',
        backgroundColor: 'white',
        border: '1px solid #ddd',
        position: 'relative',
        margin: '0 auto',
        transform: 'scale(0.6)',
        transformOrigin: 'top center'
      }}>
        {template.elements.map((element, index) => {
          let content = element.content;
          
          // Replace variables with sample data
          Object.keys(sampleData).forEach(key => {
            const regex = new RegExp(`\\{${key}\\}`, 'g');
            content = content.replace(regex, sampleData[key] || '');
          });

          const elementStyle = {
            position: 'absolute',
            left: `${element.x}px`,
            top: `${element.y}px`,
            width: element.width ? `${element.width}px` : 'auto',
            height: element.height ? `${element.height}px` : 'auto',
            fontSize: element.fontSize ? `${element.fontSize}px` : '12px',
            fontWeight: element.fontWeight || 'normal',
            color: element.color || '#000000',
            whiteSpace: 'pre-line'
          };

          if (element.type === 'image' && element.content === '{companyLogo}') {
            return (
              <div key={index} style={{
                ...elementStyle,
                border: '2px dashed #ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f9f9f9',
                fontSize: '10px',
                color: '#666'
              }}>
                {companySettings?.logo ? (
                  <img 
                    src={companySettings.logo} 
                    alt="Company Logo" 
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                  />
                ) : (
                  'Company Logo'
                )}
              </div>
            );
          }

          if (element.type === 'line') {
            return (
              <div key={index} style={{
                position: 'absolute',
                left: `${element.x}px`,
                top: `${element.y}px`,
                width: `${element.width}px`,
                height: `${element.height || 1}px`,
                backgroundColor: element.color || '#000000'
              }} />
            );
          }

          if (element.type === 'rectangle') {
            return (
              <div key={index} style={{
                position: 'absolute',
                left: `${element.x}px`,
                top: `${element.y}px`,
                width: `${element.width}px`,
                height: `${element.height}px`,
                backgroundColor: element.color || '#667eea'
              }} />
            );
          }

          return (
            <div key={index} style={elementStyle}>
              {content}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading PDF Templates...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>PDF Template Designs</h2>
      
      <div style={{ marginBottom: '50px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#667eea' }}>Invoice Template</h3>
        {renderPreview(templates.invoice, 'invoice')}
      </div>

      <div style={{ marginBottom: '50px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#667eea' }}>Quote Template</h3>
        {renderPreview(templates.quote, 'quote')}
      </div>

      <div style={{ marginBottom: '50px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#667eea' }}>Statement Template</h3>
        {renderPreview(templates.statement, 'statement')}
      </div>

      <div style={{
        textAlign: 'center',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        marginTop: '30px'
      }}>
        <p style={{ margin: '0', color: '#666' }}>
          These are the default PDF templates that will be used for all your invoices, quotes, and statements.
          The designs feature your company branding and follow a clean, professional layout.
        </p>
      </div>
    </div>
  );
};

export default PDFPreview;
