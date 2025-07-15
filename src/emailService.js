import { getDoc, doc, query, collection, where, getDocs } from 'firebase/firestore';
import { db, auth } from './firebase.js';

// Get company settings for current user
const getCompanySettings = async () => {
  try {
    if (!auth.currentUser) return null;
    const q = query(collection(db, 'companySettings'), where('userId', '==', auth.currentUser.uid));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return snapshot.docs[0].data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching company settings:', error);
    return null;
  }
};

// Get email settings
const getEmailSettings = async () => {
  try {
    if (!auth.currentUser) return null;
    const q = query(collection(db, 'emailSettings'), where('userId', '==', auth.currentUser.uid));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return snapshot.docs[0].data();
    }
    return {
      invoiceSubject: 'Invoice {invoiceNumber} from {companyName}',
      invoiceTemplate: `Dear {clientName},

Invoice {invoiceNumber} for the amount of £{totalAmount} is ready.

Payment is due by {dueDate}.

Thank you for your business!

Best regards,
{senderName}
{companyName}`,
      quoteSubject: 'Quote {quoteNumber} from {companyName}',
      quoteTemplate: `Dear {clientName},

Quote {quoteNumber} for the amount of £{totalAmount} is ready.

This quote is valid until {validUntil}.

We look forward to working with you!

Best regards,
{senderName}
{companyName}`,
      statementSubject: 'Account Statement from {companyName}',
      statementTemplate: `Dear {clientName},

Your account statement for the period: {period} is ready.

Statement Summary:
- Total Invoices: {totalInvoices}
- Total Amount: £{totalAmount}
- Paid Amount: £{paidAmount}
- Outstanding Amount: £{unpaidAmount}

If you have any questions about your account, please don't hesitate to contact us.

Best regards,
{senderName}
{companyName}`,
      defaultSenderName: '',
      defaultSenderEmail: ''
    };
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return null;
  }
};

// Replace template variables
const replaceTemplateVariables = (template, data) => {
  if (!template || typeof template !== 'string') return template;

  let result = template;
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, data[key] || '');
  });

  return result;
};

// Send invoice via email (without PDF)
const sendInvoiceViaEmail = async (invoice, companySettings) => {
  try {
    const emailSettings = await getEmailSettings();

    const totalAmount = invoice.selectedProducts && invoice.selectedProducts.length > 0 
      ? invoice.selectedProducts.reduce((sum, product) => sum + ((product.price || 0) * (product.quantity || 1)), 0)
      : parseFloat(invoice.amount) || 0;

    const vatRate = parseFloat(invoice.vat) || 0;
    const vatAmount = totalAmount * (vatRate / 100);
    const finalAmount = totalAmount + vatAmount;

    const templateData = {
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      totalAmount: finalAmount.toFixed(2),
      dueDate: invoice.dueDate || 'Upon receipt',
      senderName: emailSettings?.defaultSenderName || companySettings?.contactName || 'Your Name',
      companyName: companySettings?.companyName || 'Your Company'
    };

    const subject = emailSettings?.invoiceSubject || 'Invoice {invoiceNumber} from {companyName}';
    const body = emailSettings?.invoiceTemplate || `Dear {clientName},

Invoice {invoiceNumber} for the amount of £{totalAmount} is ready.

Payment is due by {dueDate}.

Thank you for your business!

Best regards,
{senderName}
{companyName}`;

    const finalSubject = replaceTemplateVariables(subject, templateData);
    const finalBody = replaceTemplateVariables(body, templateData);

    const mailtoLink = `mailto:${invoice.clientEmail || ''}?subject=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(finalBody)}`;
    window.location.href = mailtoLink;

  } catch (error) {
    console.error('Error creating invoice email:', error);
    alert('Error creating email: ' + (error.message || 'Unknown error occurred'));
  }
};

// Send quote via email (without PDF)
const sendQuoteViaEmail = async (quote, companySettings) => {
  try {
    const emailSettings = await getEmailSettings();

    const subtotal = parseFloat(quote.amount) || 0;
    const vatRate = parseFloat(quote.vat) || 0;
    const vatAmount = subtotal * (vatRate / 100);
    const totalAmount = subtotal + vatAmount;

    const templateData = {
      quoteNumber: quote.quoteNumber,
      clientName: quote.clientName,
      totalAmount: totalAmount.toFixed(2),
      validUntil: quote.validUntil || 'Upon acceptance',
      senderName: emailSettings?.defaultSenderName || companySettings?.contactName || 'Your Name',
      companyName: companySettings?.companyName || 'Your Company'
    };

    const subject = emailSettings?.quoteSubject || 'Quote {quoteNumber} from {companyName}';
    const body = emailSettings?.quoteTemplate || `Dear {clientName},

Quote {quoteNumber} for the amount of £{totalAmount} is ready.

This quote is valid until {validUntil}.

We look forward to working with you!

Best regards,
{senderName}
{companyName}`;

    const finalSubject = replaceTemplateVariables(subject, templateData);
    const finalBody = replaceTemplateVariables(body, templateData);

    const mailtoLink = `mailto:${quote.clientEmail || ''}?subject=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(finalBody)}`;
    window.location.href = mailtoLink;

  } catch (error) {
    console.error('Error creating quote email:', error);
    alert('Error creating email: ' + (error.message || 'Unknown error occurred'));
  }
};

// Send client statement via email (without PDF)
const sendClientStatementViaEmail = async (client, invoices, companySettings, period = 'full') => {
  try {
    const emailSettings = await getEmailSettings();

    const totalAmount = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const paidAmount = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const unpaidAmount = invoices.filter(inv => inv.status === 'Unpaid').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

    const templateData = {
      clientName: client.name,
      period: period === 'full' ? 'All Time' : period,
      totalInvoices: invoices.length,
      totalAmount: totalAmount.toFixed(2),
      paidAmount: paidAmount.toFixed(2),
      unpaidAmount: unpaidAmount.toFixed(2),
      statementDate: new Date().toLocaleDateString(),
      senderName: emailSettings?.defaultSenderName || companySettings?.contactName || 'Your Name',
      companyName: companySettings?.companyName || 'Your Company'
    };

    const subject = emailSettings?.statementSubject || 'Account Statement from {companyName}';
    const body = emailSettings?.statementTemplate || `Dear {clientName},

Your account statement for the period: {period} is ready.

Statement Summary:
- Total Invoices: {totalInvoices}
- Total Amount: £{totalAmount}
- Paid Amount: £{paidAmount}
- Outstanding Amount: £{unpaidAmount}

If you have any questions about your account, please don't hesitate to contact us.

Best regards,
{senderName}
{companyName}`;

    const finalSubject = replaceTemplateVariables(subject, templateData);
    const finalBody = replaceTemplateVariables(body, templateData);

    const mailtoLink = `mailto:${client.email}?subject=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(finalBody)}`;
    window.location.href = mailtoLink;

  } catch (error) {
    console.error('Error creating statement email:', error);
    alert('Error creating email: ' + (error.message || 'Unknown error occurred'));
  }
};

export { 
  sendInvoiceViaEmail, 
  sendQuoteViaEmail,
  sendClientStatementViaEmail
};