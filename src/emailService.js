import { auth, db } from './firebase.js';
import { doc, getDoc } from 'firebase/firestore';

const getUserEmailTemplates = async (userId) => {
  try {
    const configDoc = await getDoc(doc(db, 'emailTemplates', userId));
    if (configDoc.exists()) {
      return configDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return null;
  }
};

const replaceVariables = (template, variables) => {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{${key}}`, 'g');
    result = result.replace(regex, value || '');
  }
  return result;
};

export const sendQuoteEmail = async (quote, recipientEmail, senderName, companyName) => {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    // Get user's email templates
    const emailTemplates = await getUserEmailTemplates(user.uid);

    if (!emailTemplates) {
      return { 
        success: false, 
        error: 'No email templates found. Please configure your email templates in Email Setup.' 
      };
    }

    // Calculate total amount
    const amount = parseFloat(quote.amount) || 0;
    const vat = parseFloat(quote.vat) || 0;
    const total = amount * (1 + vat / 100);

    // Prepare variables for template replacement
    const variables = {
      quoteNumber: quote.quoteNumber,
      clientName: quote.clientName,
      companyName: companyName || 'Your Company',
      amount: amount.toFixed(2),
      vat: vat.toFixed(1),
      total: total.toFixed(2),
      validUntil: quote.validUntil,
      notes: quote.notes || 'No additional notes'
    };

    // Replace variables in templates
    const subject = replaceVariables(emailTemplates.quoteSubject, variables);
    const body = replaceVariables(emailTemplates.quoteBody, variables);

    // Create mailto URL
    const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Try to open user's email client
    try {
      // First try using window.location.href for better compatibility
      window.location.href = mailtoUrl;

      return { success: true, message: 'Email client opened successfully' };
    } catch (error) {
      // Fallback to window.open
      try {
        window.open(mailtoUrl, '_blank');
        return { success: true, message: 'Email client opened successfully' };
      } catch (fallbackError) {
        console.error('Failed to open email client:', fallbackError);
        return { 
          success: false, 
          error: 'Unable to open email client. Please copy the email details manually or check your browser settings.' 
        };
      }
    }
  } catch (error) {
    console.error('Error creating quote email:', error);
    return { success: false, error: 'Failed to open email client' };
  }
};

export const sendInvoiceEmail = async (invoice, recipientEmail, senderName, companyName) => {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    // Get user's email templates
    const emailTemplates = await getUserEmailTemplates(user.uid);

    if (!emailTemplates) {
      return { 
        success: false, 
        error: 'No email templates found. Please configure your email templates in Email Setup.' 
      };
    }

    // Calculate total amount
    const amount = parseFloat(invoice.amount) || 0;
    const vat = parseFloat(invoice.vat) || 0;
    const total = amount * (1 + vat / 100);

    // Prepare variables for template replacement
    const variables = {
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      companyName: companyName || 'Your Company',
      amount: amount.toFixed(2),
      vat: vat.toFixed(1),
      total: total.toFixed(2),
      dueDate: invoice.dueDate,
      notes: invoice.notes || 'No additional notes'
    };

    // Replace variables in templates
    const subject = replaceVariables(emailTemplates.invoiceSubject, variables);
    const body = replaceVariables(emailTemplates.invoiceBody, variables);

    // Create mailto URL
    const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Try to open user's email client
    try {
      // First try using window.location.href for better compatibility
      window.location.href = mailtoUrl;

      return { success: true, message: 'Email client opened successfully' };
    } catch (error) {
      // Fallback to window.open
      try {
        window.open(mailtoUrl, '_blank');
        return { success: true, message: 'Email client opened successfully' };
      } catch (fallbackError) {
        console.error('Failed to open email client:', fallbackError);
        return { 
          success: false, 
          error: 'Unable to open email client. Please copy the email details manually or check your browser settings.' 
        };
      }
    }
  } catch (error) {
    console.error('Error creating invoice email:', error);
    return { success: false, error: 'Failed to open email client' };
  }
};