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

Please find attached invoice {invoiceNumber} for the amount of £{totalAmount}.

Payment is due by {dueDate}.

Thank you for your business!

Best regards,
{senderName}
{companyName}`,
      quoteSubject: 'Quote {quoteNumber} from {companyName}',
      quoteTemplate: `Dear {clientName},

Please find attached quote {quoteNumber} for the amount of £{totalAmount}.

This quote is valid until {validUntil}.

We look forward to working with you!

Best regards,
{senderName}
{companyName}`,
      statementSubject: 'Account Statement from {companyName}',
      statementTemplate: `Dear {clientName},

Please find attached your account statement for the period: {period}.

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

// Show email instructions popup
const showEmailInstructions = (documentType, documentNumber, downloadFunction, emailFunction) => {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    backdrop-filter: blur(4px);
  `;

  const popup = document.createElement('div');
  popup.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    max-width: 500px;
    width: 90%;
    text-align: center;
    border: 2px solid #667eea;
  `;

  popup.innerHTML = `
    <div style="font-size: 48px; margin-bottom: 20px;">📧✨</div>
    <h2 style="color: #333; margin-bottom: 15px; font-size: 1.5rem;">Email ${documentType.charAt(0).toUpperCase() + documentType.slice(1)}</h2>
    <p style="color: #666; margin-bottom: 25px; line-height: 1.5;">
      Ready to send ${documentType} ${documentNumber}? Follow these simple steps:
    </p>

    <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 25px; text-align: left;">
      <h3 style="margin: 0 0 15px 0; color: #555; font-size: 1.1rem;">📋 Steps to Send:</h3>
      <ol style="margin: 0; padding-left: 20px; color: #666; line-height: 1.6;">
        <li><strong>Download the PDF</strong> - Click the button below to save the ${documentType}</li>
        <li><strong>Open your email</strong> - Click "Open Email" to launch your default email client</li>
        <li><strong>Attach the PDF</strong> - Attach the downloaded PDF file to your email</li>
        <li><strong>Send</strong> - Review and send your professional ${documentType}!</li>
      </ol>
    </div>

    <div style="display: flex; gap: 15px; justify-content: center; margin-bottom: 20px;">
      <button onclick="downloadPDF()" style="
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        color: white;
        border: none;
        padding: 12px 25px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        📄 Download PDF
      </button>
      <button onclick="openEmail()" style="
        background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
        color: white;
        border: none;
        padding: 12px 25px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        📧 Open Email
      </button>
    </div>

    <button onclick="closeModal()" style="
      background: #6c757d;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
    ">
      Close
    </button>
  `;

  modal.appendChild(popup);
  document.body.appendChild(modal);

  // Add global functions for the popup
  window.downloadPDF = downloadFunction;
  window.openEmail = emailFunction;
  window.closeModal = () => {
    document.body.removeChild(modal);
    delete window.downloadPDF;
    delete window.openEmail;
    delete window.closeModal;
  };

  // Close on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      window.closeModal();
    }
  });
};

// Send invoice via email
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

Please find attached invoice {invoiceNumber} for the amount of £{totalAmount}.

Payment is due by {dueDate}.

Thank you for your business!

Best regards,
{senderName}
{companyName}`;

    const finalSubject = replaceTemplateVariables(subject, templateData);
    const finalBody = replaceTemplateVariables(body, templateData);

    const downloadPDF = async () => {
      try {
        console.log('Starting invoice PDF generation');
        const { generateInvoicePDF } = await import('./simplePdfService.js');
        const doc = generateInvoicePDF(invoice, companySettings);
        const fileName = `invoice_${invoice.invoiceNumber}_${invoice.clientName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        console.log('PDF generation completed successfully');
        doc.save(fileName);
      } catch (error) {
        console.error('Error generating invoice PDF:', error);
        alert('Error generating PDF: ' + (error.message || 'Unknown error occurred'));
      }
    };

    const openEmailClient = () => {
      const mailtoLink = `mailto:${invoice.clientEmail || ''}?subject=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(finalBody)}`;
      window.location.href = mailtoLink;
    };

    showEmailInstructions('invoice', invoice.invoiceNumber, downloadPDF, openEmailClient);

  } catch (error) {
    console.error('Error creating invoice email:', error);
    alert('Error creating email: ' + (error.message || 'Unknown error occurred'));
  }
};

// Send quote via email
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

Please find attached quote {quoteNumber} for the amount of £{totalAmount}.

This quote is valid until {validUntil}.

We look forward to working with you!

Best regards,
{senderName}
{companyName}`;

    const finalSubject = replaceTemplateVariables(subject, templateData);
    const finalBody = replaceTemplateVariables(body, templateData);

    const downloadPDF = async () => {
      try {
        console.log('Starting quote PDF generation');
        const { generateQuotePDF } = await import('./simplePdfService.js');
        const doc = generateQuotePDF(quote, companySettings);
        const fileName = `quote_${quote.quoteNumber}_${quote.clientName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        console.log('PDF generation completed successfully');
        doc.save(fileName);
      } catch (error) {
        console.error('Error generating quote PDF:', error);
        alert('Error generating PDF: ' + (error.message || 'Unknown error occurred'));
      }
    };

    const openEmailClient = () => {
      const mailtoLink = `mailto:${quote.clientEmail || ''}?subject=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(finalBody)}`;
      window.location.href = mailtoLink;
    };

    showEmailInstructions('quote', quote.quoteNumber, downloadPDF, openEmailClient);

  } catch (error) {
    console.error('Error creating quote email:', error);
    alert('Error creating email: ' + (error.message || 'Unknown error occurred'));
  }
};

// Send client statement via email
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

Please find attached your account statement for the period: {period}.

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

    const downloadPDF = async () => {
      try {
        console.log('Starting statement PDF generation');
        const { generateStatementPDF } = await import('./simplePdfService.js');
        const doc = generateStatementPDF(client, invoices, companySettings, period);
        const fileName = `statement_${client.name.replace(/[^a-zA-Z0-9]/g, '_')}_${period}_${new Date().toISOString().split('T')[0]}.pdf`;
        console.log('PDF generation completed successfully');
        doc.save(fileName);
      } catch (error) {
        console.error('Error generating statement PDF:', error);
        alert('Error generating PDF: ' + (error.message || 'Unknown error occurred'));
      }
    };

    const openEmailClient = () => {
      const mailtoLink = `mailto:${client.email}?subject=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(finalBody)}`;
      window.location.href = mailtoLink;
    };

    showEmailInstructions('statement', `${client.name}_${period}`, downloadPDF, openEmailClient);

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