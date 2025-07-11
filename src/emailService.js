import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase.js';

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

// Send email using user's own SMTP (this would require a backend service)
export const sendEmailWithUserSMTP = async (emailConfig, emailData) => {
  // Note: This is a placeholder. In a real implementation, you would need:
  // 1. A backend service (Node.js with nodemailer, Python with smtplib, etc.)
  // 2. To send the email data to your backend
  // 3. The backend would use the user's SMTP settings to send the email

  const emailPayload = {
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
  };

  // This would be sent to your backend API endpoint
  console.log('Would send to backend:', emailPayload);

  // For now, return a mock response
  return {
    success: true,
    message: 'Email configuration ready - backend SMTP service needed for actual sending'
  };
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

  // Use user's own SMTP settings
  const emailData = {
    from: userEmailConfig.email,
    to: recipientEmail,
    subject: `Quote ${quote.quoteNumber} from ${companyName || senderName}`,
    html: `
      <h2>Quote Details</h2>
      <p><strong>Quote Number:</strong> ${quote.quoteNumber}</p>
      <p><strong>Client Name:</strong> ${quote.clientName}</p>
      <p><strong>Amount:</strong> £${parseFloat(quote.amount).toFixed(2)}</p>
      <p><strong>VAT:</strong> ${quote.vat || 0}%</p>
      <p><strong>Total:</strong> £${(parseFloat(quote.amount) * (1 + (quote.vat || 0) / 100)).toFixed(2)}</p>
      <p><strong>Valid Until:</strong> ${quote.validUntil}</p>
      <p><strong>Status:</strong> ${quote.status}</p>
      <p><strong>Notes:</strong> ${quote.notes || 'N/A'}</p>
      <br>
      <p>Best regards,<br>${senderName || companyName}</p>
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

  // Use user's own SMTP settings
  const emailData = {
    from: userEmailConfig.email,
    to: recipientEmail,
    subject: `Invoice ${invoice.invoiceNumber} from ${companyName || senderName}`,
    html: `
      <h2>Invoice Details</h2>
      <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
      <p><strong>Client Name:</strong> ${invoice.clientName}</p>
      <p><strong>Amount:</strong> £${parseFloat(invoice.amount).toFixed(2)}</p>
      <p><strong>VAT:</strong> ${invoice.vat || 0}%</p>
      <p><strong>Total:</strong> £${(parseFloat(invoice.amount) * (1 + (invoice.vat || 0) / 100)).toFixed(2)}</p>
      <p><strong>Due Date:</strong> ${invoice.dueDate}</p>
      <p><strong>Status:</strong> ${invoice.status}</p>
      <p><strong>Notes:</strong> ${invoice.notes || 'N/A'}</p>
      <br>
      <p>Payment is due by ${invoice.dueDate}.</p>
      <p>Best regards,<br>${senderName || companyName}</p>
    `
  };

  return await sendEmailWithUserSMTP(userEmailConfig, emailData);
};