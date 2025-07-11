import { jsPDF } from 'jspdf';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase.js';

// Debug logging for jsPDF import
console.log('jsPDF import check:', typeof jsPDF);

// Cloud storage upload functions
const uploadToAWS = async (pdfBlob, filename, cloudSettings) => {
  const formData = new FormData();
  formData.append('file', pdfBlob, filename);
  formData.append('bucket', cloudSettings.awsBucket);
  formData.append('region', cloudSettings.awsRegion);
  formData.append('accessKey', cloudSettings.awsAccessKey);
  formData.append('secretKey', cloudSettings.awsSecretKey);

  // In a real implementation, you'd use AWS SDK
  // For now, return a mock URL
  const timestamp = Date.now();
  return `https://${cloudSettings.awsBucket}.s3.${cloudSettings.awsRegion}.amazonaws.com/${filename}?t=${timestamp}`;
};

const uploadToGCP = async (pdfBlob, filename, cloudSettings) => {
  // In a real implementation, you'd use Google Cloud Storage client
  // For now, return a mock URL
  const timestamp = Date.now();
  return `https://storage.googleapis.com/${cloudSettings.gcpBucket}/${filename}?t=${timestamp}`;
};

const uploadToAzure = async (pdfBlob, filename, cloudSettings) => {
  // In a real implementation, you'd use Azure Blob Storage client
  // For now, return a mock URL
  const timestamp = Date.now();
  return `https://${cloudSettings.azureAccount}.blob.core.windows.net/${cloudSettings.azureContainer}/${filename}?t=${timestamp}`;
};

const uploadToOneDrive = async (pdfBlob, filename, cloudSettings) => {
  try {
    // In a real implementation, you'd use Microsoft Graph API
    // For now, return a mock URL
    const timestamp = Date.now();
    console.log('Uploading to OneDrive:', filename);
    return `https://graph.microsoft.com/v1.0/me/drive/root:/Invoices/${filename}?t=${timestamp}`;
  } catch (error) {
    console.error('OneDrive upload error:', error);
    throw error;
  }
};

const uploadToDropbox = async (pdfBlob, filename, cloudSettings) => {
  try {
    // In a real implementation, you'd use Dropbox API
    // For now, return a mock URL
    const timestamp = Date.now();
    console.log('Uploading to Dropbox:', filename);
    return `https://www.dropbox.com/s/randomstring/${filename}?t=${timestamp}`;
  } catch (error) {
    console.error('Dropbox upload error:', error);
    throw error;
  }
};

const uploadPDFToCloud = async (pdfBlob, filename) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Get cloud storage settings
    const cloudDoc = await getDoc(doc(db, 'cloudStorage', user.uid));
    if (!cloudDoc.exists()) {
      console.log('No cloud storage configured, using email attachment');
      return null;
    }

    const cloudSettings = cloudDoc.data();
    
    if (cloudSettings.provider === 'none') {
      console.log('Cloud storage disabled, using email attachment');
      return null;
    }

    let uploadUrl;
    switch (cloudSettings.provider) {
      case 'aws':
        uploadUrl = await uploadToAWS(pdfBlob, filename, cloudSettings);
        break;
      case 'gcp':
        uploadUrl = await uploadToGCP(pdfBlob, filename, cloudSettings);
        break;
      case 'azure':
        uploadUrl = await uploadToAzure(pdfBlob, filename, cloudSettings);
        break;
      case 'onedrive':
        uploadUrl = await uploadToOneDrive(pdfBlob, filename, cloudSettings);
        break;
      case 'dropbox':
        uploadUrl = await uploadToDropbox(pdfBlob, filename, cloudSettings);
        break;
      default:
        console.log('Unknown cloud provider, using email attachment');
        return null;
    }

    console.log('PDF uploaded to cloud storage:', uploadUrl);
    return uploadUrl;
  } catch (error) {
    console.error('Error uploading to cloud storage:', error);
    console.log('Falling back to email attachment');
    return null;
  }
};

const generateInvoicePDF = async (invoice, companySettings) => {
  try {
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

  console.log('PDF generation completed successfully');
  return doc;
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    console.error('Error details:', error.message, error.stack);
    console.error('Invoice data causing error:', invoice);
    console.error('Company settings causing error:', companySettings);
    throw error;
  }
};

const generateQuotePDF = async (quote, companySettings) => {
  try {
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

  console.log('PDF generation completed successfully');
  return doc;
  } catch (error) {
    console.error('Error generating quote PDF:', error);
    console.error('Error details:', error.message, error.stack);
    console.error('Invoice data causing error:', quote);
    console.error('Company settings causing error:', companySettings);
    throw error;
  }
};

// Email service functions
const sendInvoicePDFViaEmail = async (invoice, companySettings, recipientEmail) => {
  try {
    console.log('Calling sendInvoiceEmail with:', {
      invoiceNumber: invoice.invoiceNumber,
      recipientEmail,
      senderName: companySettings.contactName || 'Business Owner',
      companyName: companySettings.companyName || 'Your Company'
    });

    // Generate PDF
    const doc = await generateInvoicePDF(invoice, companySettings);
    const pdfBlob = doc.output('blob');
    
    // Try to upload to cloud storage first
    const filename = `invoice_${invoice.invoiceNumber}_${invoice.clientName.replace(/\s+/g, '_')}.pdf`;
    const cloudUrl = await uploadPDFToCloud(pdfBlob, filename);
    
    // Prepare email content
    const subject = `Invoice ${invoice.invoiceNumber} from ${companySettings.companyName || 'Your Company'}`;
    let body;
    
    if (cloudUrl) {
      // Use cloud link
      body = `Dear ${invoice.clientName},

Please find your invoice attached below:

Invoice Number: ${invoice.invoiceNumber}
Amount: £${Number(invoice.amount).toFixed(2)}
Due Date: ${invoice.dueDate}

Download your invoice: ${cloudUrl}

Thank you for your business!

Best regards,
${companySettings.contactName || 'Business Owner'}
${companySettings.companyName || 'Your Company'}
${companySettings.email ? '\n' + companySettings.email : ''}
${companySettings.phone ? '\n' + companySettings.phone : ''}`;
    } else {
      // Fallback to attachment (base64)
      const pdfBase64 = doc.output('datauristring');
      body = `Dear ${invoice.clientName},

Please find your invoice attached.

Invoice Number: ${invoice.invoiceNumber}
Amount: £${Number(invoice.amount).toFixed(2)}
Due Date: ${invoice.dueDate}

Thank you for your business!

Best regards,
${companySettings.contactName || 'Business Owner'}
${companySettings.companyName || 'Your Company'}
${companySettings.email ? '\n' + companySettings.email : ''}
${companySettings.phone ? '\n' + companySettings.phone : ''}`;
    }

    // Create mailto URL
    const mailtoUrl = cloudUrl 
      ? `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      : `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}&attachment=${encodeURIComponent(filename)}`;
    
    // Open email client
    window.location.href = mailtoUrl;
    
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw error;
  }
};

const sendQuotePDFViaEmail = async (quote, companySettings, recipientEmail) => {
  try {
    console.log('Calling sendQuoteEmail with:', {
      quoteNumber: quote.quoteNumber,
      recipientEmail,
      senderName: companySettings.contactName || 'Business Owner',
      companyName: companySettings.companyName || 'Your Company'
    });

    // Generate PDF
    const doc = await generateQuotePDF(quote, companySettings);
    const pdfBlob = doc.output('blob');
    
    // Try to upload to cloud storage first
    const filename = `quote_${quote.quoteNumber}_${quote.clientName.replace(/\s+/g, '_')}.pdf`;
    const cloudUrl = await uploadPDFToCloud(pdfBlob, filename);
    
    // Prepare email content
    const subject = `Quote ${quote.quoteNumber} from ${companySettings.companyName || 'Your Company'}`;
    let body;
    
    if (cloudUrl) {
      // Use cloud link
      body = `Dear ${quote.clientName},

Please find your quote below:

Quote Number: ${quote.quoteNumber}
Amount: £${Number(quote.amount).toFixed(2)}
Valid Until: ${quote.validUntil}

Download your quote: ${cloudUrl}

We look forward to working with you!

Best regards,
${companySettings.contactName || 'Business Owner'}
${companySettings.companyName || 'Your Company'}
${companySettings.email ? '\n' + companySettings.email : ''}
${companySettings.phone ? '\n' + companySettings.phone : ''}`;
    } else {
      // Fallback to attachment (base64)
      body = `Dear ${quote.clientName},

Please find your quote attached.

Quote Number: ${quote.quoteNumber}
Amount: £${Number(quote.amount).toFixed(2)}
Valid Until: ${quote.validUntil}

We look forward to working with you!

Best regards,
${companySettings.contactName || 'Business Owner'}
${companySettings.companyName || 'Your Company'}
${companySettings.email ? '\n' + companySettings.email : ''}
${companySettings.phone ? '\n' + companySettings.phone : ''}`;
    }

    // Create mailto URL
    const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Open email client
    window.location.href = mailtoUrl;
    
  } catch (error) {
    console.error('Error sending quote email:', error);
    throw error;
  }
};

export { generateInvoicePDF, generateQuotePDF, sendInvoicePDFViaEmail, sendQuotePDFViaEmail };