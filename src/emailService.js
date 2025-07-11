
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase.js';

// Backend API URL - adjust if needed
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api' 
  : `${window.location.protocol}//${window.location.hostname}:5000/api`;

// Get user's email configuration
export const getUserEmailConfig = async (userId) => {
  try {
    const configDoc = await getDoc(doc(db, 'emailConfigs', userId));
    if (configDoc.exists()) {
      return configDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching email config:', error);
    return null;
  }
};

// Send email using user's own SMTP via backend
export const sendEmailWithUserSMTP = async (emailConfig, emailData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        smtpConfig: {
          host: emailConfig.smtp,
          port: emailConfig.port,
          secure: emailConfig.secure,
          auth: {
            user: emailConfig.email,
            pass: emailConfig.password
          }
        },
        emailData: emailData
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to send email');
    }

    return {
      success: true,
      message: result.message,
      messageId: result.messageId
    };

  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email'
    };
  }
};

// Test email configuration via backend
export const testEmailConfig = async (emailConfig) => {
  try {
    const response = await fetch(`${API_BASE_URL}/test-email-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        smtpConfig: {
          host: emailConfig.smtp,
          port: emailConfig.port,
          secure: emailConfig.secure,
          auth: {
            user: emailConfig.email,
            pass: emailConfig.password
          }
        }
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Configuration test failed');
    }

    return {
      success: true,
      message: result.message
    };

  } catch (error) {
    console.error('Email config test error:', error);
    
    // Better error handling for common issues
    if (error.message && error.message.includes('Unexpected token')) {
      return {
        success: false,
        error: 'Backend server not responding. Please make sure the backend is running on port 5000.'
      };
    }
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Cannot connect to backend server. Please check if the server is running.'
      };
    }
    
    return {
      success: false,
      error: error.message || 'Configuration test failed'
    };
  }
};

export const sendQuoteEmail = async (quote, recipientEmail, senderName, companyName) => {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  // Get user's email configuration
  const userEmailConfig = await getUserEmailConfig(user.uid);

  if (!userEmailConfig || !userEmailConfig.email || !userEmailConfig.password) {
    return { 
      success: false, 
      error: 'No email configuration found. Please set up your email in Email Setup.' 
    };
  }

  // Prepare email data
  const emailData = {
    from: userEmailConfig.email,
    fromName: companyName || senderName,
    to: recipientEmail,
    subject: `Quote ${quote.quoteNumber} from ${companyName || senderName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Quote Details</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Quote Number:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${quote.quoteNumber}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Client Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${quote.clientName}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Amount:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">£${parseFloat(quote.amount).toFixed(2)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>VAT:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${quote.vat || 0}%</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Total:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">£${(parseFloat(quote.amount) * (1 + (quote.vat || 0) / 100)).toFixed(2)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Valid Until:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${quote.validUntil}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Status:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${quote.status}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Notes:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${quote.notes || 'N/A'}</td></tr>
        </table>
        <p style="margin-top: 30px;">Best regards,<br/><strong>${senderName || companyName}</strong></p>
      </div>
    `
  };

  return await sendEmailWithUserSMTP(userEmailConfig, emailData);
};

export const sendInvoiceEmail = async (invoice, recipientEmail, senderName, companyName) => {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  // Get user's email configuration
  const userEmailConfig = await getUserEmailConfig(user.uid);

  if (!userEmailConfig || !userEmailConfig.email || !userEmailConfig.password) {
    return { 
      success: false, 
      error: 'No email configuration found. Please set up your email in Email Setup.' 
    };
  }

  // Prepare email data
  const emailData = {
    from: userEmailConfig.email,
    fromName: companyName || senderName,
    to: recipientEmail,
    subject: `Invoice ${invoice.invoiceNumber} from ${companyName || senderName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Invoice Details</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Invoice Number:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${invoice.invoiceNumber}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Client Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${invoice.clientName}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Amount:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">£${parseFloat(invoice.amount).toFixed(2)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>VAT:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${invoice.vat || 0}%</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Total:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">£${(parseFloat(invoice.amount) * (1 + (invoice.vat || 0) / 100)).toFixed(2)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Due Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${invoice.dueDate}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Status:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${invoice.status}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Notes:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${invoice.notes || 'N/A'}</td></tr>
        </table>
        <p style="color: #d73527; font-weight: bold;">Payment is due by ${invoice.dueDate}.</p>
        <p style="margin-top: 30px;">Best regards,<br/><strong>${senderName || companyName}</strong></p>
      </div>
    `
  };

  return await sendEmailWithUserSMTP(userEmailConfig, emailData);
};
