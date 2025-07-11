import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase.js';

function EmailConfig({ user }) {
  const [emailTemplates, setEmailTemplates] = useState({
    quoteSubject: 'Quote #{quoteNumber} from {companyName}',
    quoteBody: 'Dear {clientName},\n\nPlease find attached quote #{quoteNumber} for your consideration.\n\nQuote Details:\n- Amount: £{amount}\n- VAT: {vat}%\n- Total: £{total}\n- Valid Until: {validUntil}\n\nNotes: {notes}\n\nPlease let us know if you have any questions.\n\nBest regards,\n{companyName}',
    invoiceSubject: 'Invoice #{invoiceNumber} from {companyName}',
    invoiceBody: 'Dear {clientName},\n\nPlease find attached invoice #{invoiceNumber} for payment.\n\nInvoice Details:\n- Amount: £{amount}\n- VAT: {vat}%\n- Total: £{total}\n- Due Date: {dueDate}\n\nNotes: {notes}\n\nPlease process payment by the due date. Thank you for your business.\n\nBest regards,\n{companyName}'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadEmailTemplates();
  }, [user]);

  const loadEmailTemplates = async () => {
    if (!user) return;
    try {
      const configDoc = await getDoc(doc(db, 'emailTemplates', user.uid));
      if (configDoc.exists()) {
        const templates = configDoc.data();
        setEmailTemplates(templates);
      }
    } catch (error) {
      console.error('Error loading email templates:', error);
    }
  };

  const saveEmailTemplates = async () => {
    if (!user) return;
    setLoading(true);
    setMessage('');

    try {
      await setDoc(doc(db, 'emailTemplates', user.uid), emailTemplates);
      setMessage('✅ Email templates saved successfully!');
    } catch (error) {
      console.error('Error saving email templates:', error);
      setMessage('❌ Error saving email templates: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setEmailTemplates(prev => ({
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

  const textareaStyle = {
    ...inputStyle,
    minHeight: '120px',
    resize: 'vertical',
    fontFamily: 'monospace'
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
    marginTop: '10px'
  };

  const labelStyle = {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#666',
    display: 'block',
    marginBottom: '5px'
  };

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '300', color: 'white' }}>
            📧 Email Templates
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0, color: 'white' }}>
            Configure email templates for quotes and invoices
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, color: '#333' }}>📄 Quote Email Template</h2>

          <label style={labelStyle}>
            Quote Email Subject
          </label>
          <input
            type="text"
            style={inputStyle}
            value={emailTemplates.quoteSubject}
            onChange={(e) => handleChange('quoteSubject', e.target.value)}
            placeholder="Quote #{quoteNumber} from {companyName}"
          />

          <label style={labelStyle}>
            Quote Email Body
          </label>
          <textarea
            style={textareaStyle}
            value={emailTemplates.quoteBody}
            onChange={(e) => handleChange('quoteBody', e.target.value)}
            placeholder="Enter your quote email template..."
          />

          <div style={{ 
            background: '#e3f2fd', 
            padding: '15px', 
            borderRadius: '8px', 
            marginTop: '15px',
            border: '1px solid #2196f3'
          }}>
            <strong>Available Variables for Quotes:</strong><br />
            <code>{'{quoteNumber}'}</code>, <code>{'{clientName}'}</code>, <code>{'{companyName}'}</code>, <code>{'{amount}'}</code>, <code>{'{vat}'}</code>, <code>{'{total}'}</code>, <code>{'{validUntil}'}</code>, <code>{'{notes}'}</code>
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, color: '#333' }}>🧾 Invoice Email Template</h2>

          <label style={labelStyle}>
            Invoice Email Subject
          </label>
          <input
            type="text"
            style={inputStyle}
            value={emailTemplates.invoiceSubject}
            onChange={(e) => handleChange('invoiceSubject', e.target.value)}
            placeholder="Invoice #{invoiceNumber} from {companyName}"
          />

          <label style={labelStyle}>
            Invoice Email Body
          </label>
          <textarea
            style={textareaStyle}
            value={emailTemplates.invoiceBody}
            onChange={(e) => handleChange('invoiceBody', e.target.value)}
            placeholder="Enter your invoice email template..."
          />

          <div style={{ 
            background: '#e3f2fd', 
            padding: '15px', 
            borderRadius: '8px', 
            marginTop: '15px',
            border: '1px solid #2196f3'
          }}>
            <strong>Available Variables for Invoices:</strong><br />
            <code>{'{invoiceNumber}'}</code>, <code>{'{clientName}'}</code>, <code>{'{companyName}'}</code>, <code>{'{amount}'}</code>, <code>{'{vat}'}</code>, <code>{'{total}'}</code>, <code>{'{dueDate}'}</code>, <code>{'{notes}'}</code>
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, color: '#333' }}>ℹ️ How It Works</h3>
          <ul style={{ color: '#666', lineHeight: '1.6' }}>
            <li><strong>Click Email Button:</strong> Opens your default email application</li>
            <li><strong>Pre-filled Email:</strong> Subject and body are automatically filled with your template</li>
            <li><strong>Recipient:</strong> Client email address is automatically added</li>
            <li><strong>Customize:</strong> You can edit the email before sending</li>
            <li><strong>Variables:</strong> Use curly braces like <code>{'{clientName}'}</code> to insert dynamic values</li>
          </ul>
        </div>

        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <button
            onClick={saveEmailTemplates}
            disabled={loading}
            style={buttonStyle}
          >
            {loading ? '💾 Saving...' : '💾 Save Templates'}
          </button>

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
      </div>
    </div>
  );
}

export default EmailConfig;