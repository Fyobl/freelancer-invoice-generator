import { auth, db } from './firebase.js';
import { doc, getDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';

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

const generateInvoicePDF = async (invoice, companySettings) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 20;

  // Professional header
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Company logo
  if (companySettings.logo) {
    try {
      doc.addImage(companySettings.logo, 'JPEG', 15, 8, 30, 15);
    } catch (error) {
      console.log('Error adding logo to PDF:', error);
    }
  }

  // Company name in header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text(companySettings.companyName || 'Your Company', pageWidth - 20, 20, { align: 'right' });

  // Company details in header
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  if (companySettings.address) {
    doc.text(companySettings.address, pageWidth - 20, 28, { align: 'right' });
  }
  if (companySettings.email) {
    doc.text(companySettings.email, pageWidth - 20, 33, { align: 'right' });
  }

  currentY = 60;
  doc.setTextColor(0, 0, 0);

  // Invoice title
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text('INVOICE', 20, currentY);

  // Invoice details
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 20, currentY + 15);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, currentY + 25);
  doc.text(`Due Date: ${invoice.dueDate}`, pageWidth - 120, currentY + 25);
  doc.text(`Status: ${invoice.status}`, pageWidth - 120, currentY + 35);

  currentY += 60;

  // Bill To section
  doc.setFillColor(248, 249, 250);
  doc.rect(20, currentY, pageWidth - 40, 25, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(20, currentY, pageWidth - 40, 25);

  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Bill To:', 25, currentY + 12);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text(invoice.clientName, 25, currentY + 20);

  currentY += 45;

  // Items table header
  doc.setFillColor(41, 128, 185);
  doc.rect(20, currentY, pageWidth - 40, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('Description', 25, currentY + 10);
  doc.text('Amount', pageWidth - 60, currentY + 10, { align: 'right' });

  currentY += 15;
  doc.setTextColor(0, 0, 0);

  // Service line
  doc.setFillColor(255, 255, 255);
  doc.rect(20, currentY, pageWidth - 40, 15, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(20, currentY, pageWidth - 40, 15);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(invoice.productName || 'Service', 25, currentY + 10);
  doc.text(`£${Number(invoice.amount).toFixed(2)}`, pageWidth - 60, currentY + 10, { align: 'right' });

  currentY += 35;

  // Totals section
  const amount = parseFloat(invoice.amount) || 0;
  const vatRate = parseFloat(invoice.vat) || 0;
  const vatAmount = amount * (vatRate / 100);
  const total = amount + vatAmount;

  doc.setFillColor(248, 249, 250);
  doc.rect(pageWidth - 120, currentY, 100, 45, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(pageWidth - 120, currentY, 100, 45);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Subtotal:', pageWidth - 115, currentY + 10);
  doc.text(`£${amount.toFixed(2)}`, pageWidth - 25, currentY + 10, { align: 'right' });

  doc.text(`VAT (${vatRate}%):`, pageWidth - 115, currentY + 20);
  doc.text(`£${vatAmount.toFixed(2)}`, pageWidth - 25, currentY + 20, { align: 'right' });

  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.text('Total:', pageWidth - 115, currentY + 35);
  doc.text(`£${total.toFixed(2)}`, pageWidth - 25, currentY + 35, { align: 'right' });

  // Notes section
  if (invoice.notes) {
    currentY += 70;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Notes:', 20, currentY);
    doc.setFont(undefined, 'normal');
    doc.text(invoice.notes, 20, currentY + 10);
  }

  // Footer
  const footerY = 250;
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(128, 128, 128);

  let footerText = [];
  if (companySettings.companyNumber) {
    footerText.push(`Company Registration: ${companySettings.companyNumber}`);
  }
  if (companySettings.vatNumber) {
    footerText.push(`VAT Number: ${companySettings.vatNumber}`);
  }

  if (footerText.length > 0) {
    doc.text(footerText.join(' | '), pageWidth / 2, footerY + 10, { align: 'center' });
  }

  doc.setTextColor(41, 128, 185);
  doc.setFontSize(10);
  doc.setFont(undefined, 'italic');
  doc.text('Thank you for your business!', pageWidth / 2, footerY + 20, { align: 'center' });

  return doc;
};

const generateQuotePDF = async (quote, companySettings) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 20;

  // Professional header
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Company logo
  if (companySettings.logo) {
    try {
      doc.addImage(companySettings.logo, 'JPEG', 15, 8, 30, 15);
    } catch (error) {
      console.log('Error adding logo to PDF:', error);
    }
  }

  // Company name in header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text(companySettings.companyName || 'Your Company', pageWidth - 20, 20, { align: 'right' });

  // Company details in header
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  if (companySettings.address) {
    doc.text(companySettings.address, pageWidth - 20, 28, { align: 'right' });
  }
  if (companySettings.email) {
    doc.text(companySettings.email, pageWidth - 20, 33, { align: 'right' });
  }

  currentY = 60;
  doc.setTextColor(0, 0, 0);

  // Quote title
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text('QUOTE', 20, currentY);

  // Quote details
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`Quote Number: ${quote.quoteNumber}`, 20, currentY + 15);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, currentY + 25);
  doc.text(`Valid Until: ${quote.validUntil}`, pageWidth - 120, currentY + 25);
  doc.text(`Status: ${quote.status}`, pageWidth - 120, currentY + 35);

  currentY += 60;

  // Quote To section
  doc.setFillColor(248, 249, 250);
  doc.rect(20, currentY, pageWidth - 40, 25, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(20, currentY, pageWidth - 40, 25);

  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Quote To:', 25, currentY + 12);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text(quote.clientName, 25, currentY + 20);

  currentY += 45;

  // Items table header
  doc.setFillColor(41, 128, 185);
  doc.rect(20, currentY, pageWidth - 40, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('Description', 25, currentY + 10);
  doc.text('Amount', pageWidth - 60, currentY + 10, { align: 'right' });

  currentY += 15;
  doc.setTextColor(0, 0, 0);

  // Service line
  doc.setFillColor(255, 255, 255);
  doc.rect(20, currentY, pageWidth - 40, 15, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(20, currentY, pageWidth - 40, 15);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(quote.productName || 'Service', 25, currentY + 10);
  doc.text(`£${Number(quote.amount).toFixed(2)}`, pageWidth - 60, currentY + 10, { align: 'right' });

  currentY += 35;

  // Totals section
  const amount = parseFloat(quote.amount) || 0;
  const vatRate = parseFloat(quote.vat) || 0;
  const vatAmount = amount * (vatRate / 100);
  const total = amount + vatAmount;

  doc.setFillColor(248, 249, 250);
  doc.rect(pageWidth - 120, currentY, 100, 45, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(pageWidth - 120, currentY, 100, 45);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Subtotal:', pageWidth - 115, currentY + 10);
  doc.text(`£${amount.toFixed(2)}`, pageWidth - 25, currentY + 10, { align: 'right' });

  doc.text(`VAT (${vatRate}%):`, pageWidth - 115, currentY + 20);
  doc.text(`£${vatAmount.toFixed(2)}`, pageWidth - 25, currentY + 20, { align: 'right' });

  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.text('Total:', pageWidth - 115, currentY + 35);
  doc.text(`£${total.toFixed(2)}`, pageWidth - 25, currentY + 35, { align: 'right' });

  // Notes section
  if (quote.notes) {
    currentY += 70;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Notes:', 20, currentY);
    doc.setFont(undefined, 'normal');
    doc.text(quote.notes, 20, currentY + 10);
  }

  // Footer
  const footerY = 250;
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(128, 128, 128);

  let footerText = [];
  if (companySettings.companyNumber) {
    footerText.push(`Company Registration: ${companySettings.companyNumber}`);
  }
  if (companySettings.vatNumber) {
    footerText.push(`VAT Number: ${companySettings.vatNumber}`);
  }

  if (footerText.length > 0) {
    doc.text(footerText.join(' | '), pageWidth / 2, footerY + 10, { align: 'center' });
  }

  doc.setTextColor(41, 128, 185);
  doc.setFontSize(10);
  doc.setFont(undefined, 'italic');
  doc.text('Thank you for considering our services!', pageWidth / 2, footerY + 20, { align: 'center' });

  return doc;
};

export const sendQuoteEmail = async (quote, recipientEmail, senderName, companyName, companySettings) => {
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

    // Generate and download PDF first
    const pdfDoc = await generateQuotePDF(quote, companySettings || {});
    const pdfFileName = `${quote.quoteNumber}_${quote.clientName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    pdfDoc.save(pdfFileName);

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
    let body = replaceVariables(emailTemplates.quoteBody, variables);

    // Add PDF attachment instructions to the email body
    body += `\n\n--- IMPORTANT ---\nThe quote PDF (${pdfFileName}) has been automatically downloaded to your computer. Please attach this file to your email before sending.\n\nSteps to attach:\n1. Click the attachment/paperclip icon in your email client\n2. Select the downloaded PDF file: ${pdfFileName}\n3. Attach it to this email\n4. Send the email\n\nThe PDF should be in your Downloads folder.`;

    // Create mailto URL
    const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Show user notification about PDF download
    setTimeout(() => {
      alert(`📎 Quote PDF downloaded!\n\nFile: ${pdfFileName}\nLocation: Downloads folder\n\nPlease attach this PDF to your email before sending.`);
    }, 1000);

    // Try to open user's email client
    try {
      // First try using window.location.href for better compatibility
      window.location.href = mailtoUrl;

      return { success: true, message: 'PDF downloaded and email client opened. Please attach the PDF before sending.' };
    } catch (error) {
      // Fallback to window.open
      try {
        window.open(mailtoUrl, '_blank');
        return { success: true, message: 'PDF downloaded and email client opened. Please attach the PDF before sending.' };
      } catch (fallbackError) {
        console.error('Failed to open email client:', fallbackError);
        return { 
          success: false, 
          error: 'PDF was downloaded, but unable to open email client. Please manually create your email and attach the downloaded PDF.' 
        };
      }
    }
  } catch (error) {
    console.error('Error creating quote email:', error);
    return { success: false, error: 'Failed to process quote email' };
  }
};

export const sendInvoiceEmail = async (invoice, recipientEmail, senderName, companyName, companySettings) => {
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

    // Generate and download PDF first
    const pdfDoc = await generateInvoicePDF(invoice, companySettings || {});
    const pdfFileName = `${invoice.invoiceNumber}_${invoice.clientName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    pdfDoc.save(pdfFileName);

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
    let body = replaceVariables(emailTemplates.invoiceBody, variables);

    // Add PDF attachment instructions to the email body
    body += `\n\n--- IMPORTANT ---\nThe invoice PDF (${pdfFileName}) has been automatically downloaded to your computer. Please attach this file to your email before sending.\n\nSteps to attach:\n1. Click the attachment/paperclip icon in your email client\n2. Select the downloaded PDF file: ${pdfFileName}\n3. Attach it to this email\n4. Send the email\n\nThe PDF should be in your Downloads folder.`;

    // Create mailto URL
    const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Show user notification about PDF download
    setTimeout(() => {
      alert(`📎 Invoice PDF downloaded!\n\nFile: ${pdfFileName}\nLocation: Downloads folder\n\nPlease attach this PDF to your email before sending.`);
    }, 1000);

    // Try to open user's email client
    try {
      // First try using window.location.href for better compatibility
      window.location.href = mailtoUrl;

      return { success: true, message: 'PDF downloaded and email client opened. Please attach the PDF before sending.' };
    } catch (error) {
      // Fallback to window.open
      try {
        window.open(mailtoUrl, '_blank');
        return { success: true, message: 'PDF downloaded and email client opened. Please attach the PDF before sending.' };
      } catch (fallbackError) {
        console.error('Failed to open email client:', fallbackError);
        return { 
          success: false, 
          error: 'PDF was downloaded, but unable to open email client. Please manually create your email and attach the downloaded PDF.' 
        };
      }
    }
  } catch (error) {
    console.error('Error creating invoice email:', error);
    return { success: false, error: 'Failed to process invoice email' };
  }
};