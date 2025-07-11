
import emailjs from 'emailjs-com';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase.js';

// Initialize EmailJS with your public key (fallback option)
const SERVICE_ID = 'your_service_id';
const TEMPLATE_ID = 'your_template_id';
const PUBLIC_KEY = 'your_public_key';

export const initEmailJS = () => {
  emailjs.init(PUBLIC_KEY);
};

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
    message: 'Email would be sent via your backend SMTP service'
  };
};

export const sendQuoteEmail = async (quote, recipientEmail, senderName, companyName) => {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  // Try to get user's email configuration first
  const userEmailConfig = await getUserEmailConfig(user.uid);
  
  if (userEmailConfig && userEmailConfig.email && userEmailConfig.password) {
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
  } else {
    // Fallback to EmailJS if no user SMTP config
    const templateParams = {
      to_email: recipientEmail,
      from_name: senderName || companyName || 'Your Company',
      quote_number: quote.quoteNumber,
      client_name: quote.clientName,
      amount: parseFloat(quote.amount).toFixed(2),
      vat: quote.vat || 0,
      total: (parseFloat(quote.amount) * (1 + (quote.vat || 0) / 100)).toFixed(2),
      valid_until: quote.validUntil,
      notes: quote.notes || 'N/A',
      status: quote.status,
      created_date: quote.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString(),
      message: `Please find your quote ${quote.quoteNumber} details below.`
    };

    try {
      const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
      return { success: true, response };
    } catch (error) {
      console.error('EmailJS send failed:', error);
      return { success: false, error };
    }
  }
};

export const sendInvoiceEmail = async (invoice, recipientEmail, senderName, companyName) => {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  // Try to get user's email configuration first
  const userEmailConfig = await getUserEmailConfig(user.uid);
  
  if (userEmailConfig && userEmailConfig.email && userEmailConfig.password) {
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
  } else {
    // Fallback to EmailJS if no user SMTP config
    const templateParams = {
      to_email: recipientEmail,
      from_name: senderName || companyName || 'Your Company',
      invoice_number: invoice.invoiceNumber,
      client_name: invoice.clientName,
      amount: parseFloat(invoice.amount).toFixed(2),
      vat: invoice.vat || 0,
      total: (parseFloat(invoice.amount) * (1 + (invoice.vat || 0) / 100)).toFixed(2),
      due_date: invoice.dueDate,
      notes: invoice.notes || 'N/A',
      status: invoice.status,
      created_date: invoice.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString(),
      message: `Please find your invoice ${invoice.invoiceNumber} details below. Payment is due by ${invoice.dueDate}.`
    };

    try {
      const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
      return { success: true, response };
    } catch (error) {
      console.error('EmailJS send failed:', error);
      return { success: false, error };
    }
  }
};
