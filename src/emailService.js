import jsPDF from 'jspdf';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase.js';
import { auth } from './firebase.js';

console.log('jsPDF import check:', typeof jsPDF);

export const generateInvoicePDF = async (invoice, companySettings) => {
  console.log('PDF generation started');

  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPosition = 30;

    // Company Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(companySettings.companyName || 'Your Company', margin, yPosition);

    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    if (companySettings.address) {
      doc.text(companySettings.address, margin, yPosition);
      yPosition += 5;
    }
    if (companySettings.phone) {
      doc.text(`Phone: ${companySettings.phone}`, margin, yPosition);
      yPosition += 5;
    }
    if (companySettings.email) {
      doc.text(`Email: ${companySettings.email}`, margin, yPosition);
      yPosition += 5;
    }

    // Invoice Title and Number
    yPosition += 15;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth - margin - 30, yPosition, { align: 'right' });

    yPosition += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, pageWidth - margin - 50, yPosition, { align: 'right' });

    yPosition += 6;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin - 40, yPosition, { align: 'right' });

    if (invoice.dueDate) {
      yPosition += 6;
      doc.text(`Due Date: ${invoice.dueDate}`, pageWidth - margin - 45, yPosition, { align: 'right' });
    }

    // Bill To Section
    yPosition += 20;
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', margin, yPosition);

    yPosition += 8;
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.clientName, margin, yPosition);

    // Invoice Items Header
    yPosition += 30;
    doc.setFont('helvetica', 'bold');
    doc.text('Description', margin, yPosition);
    doc.text('Amount', pageWidth - margin - 40, yPosition, { align: 'right' });

    // Line under header
    yPosition += 3;
    doc.line(margin, yPosition, pageWidth - margin, yPosition);

    // Invoice Items
    yPosition += 15;
    doc.setFont('helvetica', 'normal');
    doc.text('Professional Services', margin, yPosition);
    doc.text(`£${Number(invoice.amount).toFixed(2)}`, pageWidth - margin - 40, yPosition, { align: 'right' });

    // VAT if applicable
    if (invoice.vat && invoice.vat > 0) {
      yPosition += 8;
      const vatAmount = (invoice.amount * invoice.vat) / 100;
      doc.text(`VAT (${invoice.vat}%)`, margin, yPosition);
      doc.text(`£${vatAmount.toFixed(2)}`, pageWidth - margin - 40, yPosition, { align: 'right' });
    }

    // Total
    yPosition += 15;
    doc.line(pageWidth - margin - 80, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
    doc.setFont('helvetica', 'bold');
    const totalAmount = invoice.vat ? invoice.amount + (invoice.amount * invoice.vat / 100) : invoice.amount;
    doc.text('Total:', pageWidth - margin - 60, yPosition, { align: 'right' });
    doc.text(`£${totalAmount.toFixed(2)}`, pageWidth - margin - 20, yPosition, { align: 'right' });

    // Notes
    if (invoice.notes) {
      yPosition += 30;
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', margin, yPosition);
      yPosition += 8;
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - (margin * 2));
      doc.text(splitNotes, margin, yPosition);
    }

    console.log('PDF generation completed successfully');
    return doc;
  } catch (error) {
    console.error('Error in PDF generation:', error);
    throw error;
  }
};

export const sendInvoicePDFViaEmail = async (invoice, companySettings, recipientEmail) => {
  try {
    console.log('Calling sendInvoiceEmail with:', {
      invoiceNumber: invoice.invoiceNumber,
      recipientEmail: recipientEmail,
      senderName: companySettings.contactName || 'N/A',
      companyName: companySettings.companyName || 'N/A'
    });

    // Generate PDF
    const doc = await generateInvoicePDF(invoice, companySettings);

    // Get email template
    const user = auth.currentUser;
    let emailTemplate = {
      subject: 'Invoice {invoiceNumber} from {companyName}',
      body: `Dear {clientName},

Please find your invoice attached via the following link:
{downloadLink}

Invoice Details:
- Invoice Number: {invoiceNumber}
- Amount: £{amount}
- Due Date: {dueDate}

Thank you for your business!

Best regards,
{contactName}`
    };

    if (user) {
      try {
        const emailDoc = await require('firebase/firestore').getDoc(require('firebase/firestore').doc(db, 'emailSettings', user.uid));
        if (emailDoc.exists()) {
          emailTemplate = emailDoc.data().templates.invoice;
        }
      } catch (error) {
        console.log('Using default email template');
      }

      // Check if user has cloud storage configured
      const cloudStorageQuery = query(
        collection(db, 'cloudStorage'), 
        where('userId', '==', user.uid),
        where('isConnected', '==', true)
      );
      const cloudStorageSnapshot = await getDocs(cloudStorageQuery);

      if (!cloudStorageSnapshot.empty) {
        // Upload to cloud storage and get link
        const cloudData = cloudStorageSnapshot.docs[0].data();
        const uploadResult = await uploadToCloudStorage(doc, invoice, cloudData, 'invoice');

        if (uploadResult.success) {
          // Replace template variables
          const subject = replaceTemplateVariables(emailTemplate.subject, {
            invoiceNumber: invoice.invoiceNumber,
            clientName: invoice.clientName,
            amount: Number(invoice.amount).toFixed(2),
            dueDate: invoice.dueDate || 'N/A',
            downloadLink: uploadResult.url,
            companyName: companySettings.companyName || 'Your Company',
            contactName: companySettings.contactName || companySettings.companyName || 'Your Company'
          });

          const body = replaceTemplateVariables(emailTemplate.body, {
            invoiceNumber: invoice.invoiceNumber,
            clientName: invoice.clientName,
            amount: Number(invoice.amount).toFixed(2),
            dueDate: invoice.dueDate || 'N/A',
            downloadLink: uploadResult.url,
            companyName: companySettings.companyName || 'Your Company',
            contactName: companySettings.contactName || companySettings.companyName || 'Your Company'
          });

          const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          window.open(mailtoLink, '_blank');
          return;
        }
      }
    }

    // Fallback to PDF attachment (original method)
    const pdfBlob = doc.output('blob');
    const reader = new FileReader();

    reader.onload = function(e) {
      const base64 = e.target.result.split(',')[1];

      const subject = replaceTemplateVariables(emailTemplate.subject, {
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        amount: Number(invoice.amount).toFixed(2),
        dueDate: invoice.dueDate || 'N/A',
        downloadLink: 'PDF attached',
        companyName: companySettings.companyName || 'Your Company',
        contactName: companySettings.contactName || companySettings.companyName || 'Your Company'
      });

      const body = replaceTemplateVariables(emailTemplate.body.replace('{downloadLink}', 'Please find your invoice attached.'), {
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        amount: Number(invoice.amount).toFixed(2),
        dueDate: invoice.dueDate || 'N/A',
        downloadLink: 'PDF attached',
        companyName: companySettings.companyName || 'Your Company',
        contactName: companySettings.contactName || companySettings.companyName || 'Your Company'
      });

      const filename = `invoice_${invoice.invoiceNumber}.pdf`;
      const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}&attachment=${filename}:${base64}`;

      window.open(mailtoLink, '_blank');
    };

    reader.readAsDataURL(pdfBlob);

  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw error;
  }
};

export const sendQuotePDFViaEmail = async (quote, companySettings, recipientEmail) => {
  try {
    // Generate quote PDF
    const doc = await generateQuotePDF(quote, companySettings);

    // Get email template
    const user = auth.currentUser;
    let emailTemplate = {
      subject: 'Quote {quoteNumber} from {companyName}',
      body: `Dear {clientName},

Please find your quote attached via the following link:
{downloadLink}

Quote Details:
- Quote Number: {quoteNumber}
- Amount: £{amount}
- Valid Until: {validUntil}

Thank you for considering our services!

Best regards,
{contactName}`
    };

    if (user) {
      try {
        const emailDoc = await require('firebase/firestore').getDoc(require('firebase/firestore').doc(db, 'emailSettings', user.uid));
        if (emailDoc.exists()) {
          emailTemplate = emailDoc.data().templates.quote;
        }
      } catch (error) {
        console.log('Using default email template');
      }

      // Check if user has cloud storage configured
      const cloudStorageQuery = query(
        collection(db, 'cloudStorage'), 
        where('userId', '==', user.uid),
        where('isConnected', '==', true)
      );
      const cloudStorageSnapshot = await getDocs(cloudStorageQuery);

      if (!cloudStorageSnapshot.empty) {
        // Upload to cloud storage and get link
        const cloudData = cloudStorageSnapshot.docs[0].data();
        const uploadResult = await uploadToCloudStorage(doc, quote, cloudData, 'quote');

        if (uploadResult.success) {
          // Replace template variables
          const subject = replaceTemplateVariables(emailTemplate.subject, {
            quoteNumber: quote.quoteNumber || quote.id,
            clientName: quote.clientName,
            amount: Number(quote.amount).toFixed(2),
            validUntil: quote.validUntil || 'N/A',
            downloadLink: uploadResult.url,
            companyName: companySettings.companyName || 'Your Company',
            contactName: companySettings.contactName || companySettings.companyName || 'Your Company'
          });

          const body = replaceTemplateVariables(emailTemplate.body, {
            quoteNumber: quote.quoteNumber || quote.id,
            clientName: quote.clientName,
            amount: Number(quote.amount).toFixed(2),
            validUntil: quote.validUntil || 'N/A',
            downloadLink: uploadResult.url,
            companyName: companySettings.companyName || 'Your Company',
            contactName: companySettings.contactName || companySettings.companyName || 'Your Company'
          });

          const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          window.open(mailtoLink, '_blank');
          return;
        }
      }
    }

    // Fallback to PDF attachment
    const pdfBlob = doc.output('blob');
    const reader = new FileReader();

    reader.onload = function(e) {
      const base64 = e.target.result.split(',')[1];

      const subject = replaceTemplateVariables(emailTemplate.subject, {
        quoteNumber: quote.quoteNumber || quote.id,
        clientName: quote.clientName,
        amount: Number(quote.amount).toFixed(2),
        validUntil: quote.validUntil || 'N/A',
        downloadLink: 'PDF attached',
        companyName: companySettings.companyName || 'Your Company',
        contactName: companySettings.contactName || companySettings.companyName || 'Your Company'
      });

      const body = replaceTemplateVariables(emailTemplate.body.replace('{downloadLink}', 'Please find your quote attached.'), {
        quoteNumber: quote.quoteNumber || quote.id,
        clientName: quote.clientName,
        amount: Number(quote.amount).toFixed(2),
        validUntil: quote.validUntil || 'N/A',
        downloadLink: 'PDF attached',
        companyName: companySettings.companyName || 'Your Company',
        contactName: companySettings.contactName || companySettings.companyName || 'Your Company'
      });

      const filename = `quote_${quote.quoteNumber || quote.id}.pdf`;
      const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}&attachment=${filename}:${base64}`;

      window.open(mailtoLink, '_blank');
    };

    reader.readAsDataURL(pdfBlob);

  } catch (error) {
    console.error('Error sending quote email:', error);
    throw error;
  }
};

const generateQuotePDF = async (quote, companySettings) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let yPosition = 30;

  // Company Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(companySettings.companyName || 'Your Company', margin, yPosition);

  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  if (companySettings.address) {
    doc.text(companySettings.address, margin, yPosition);
    yPosition += 5;
  }
  if (companySettings.phone) {
    doc.text(`Phone: ${companySettings.phone}`, margin, yPosition);
    yPosition += 5;
  }
  if (companySettings.email) {
    doc.text(`Email: ${companySettings.email}`, margin, yPosition);
    yPosition += 5;
  }

  // Quote Title and Number
  yPosition += 15;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('QUOTE', pageWidth - margin - 30, yPosition, { align: 'right' });

  yPosition += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Quote #: ${quote.quoteNumber || quote.id}`, pageWidth - margin - 50, yPosition, { align: 'right' });

  yPosition += 6;
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin - 40, yPosition, { align: 'right' });

  if (quote.validUntil) {
    yPosition += 6;
    doc.text(`Valid Until: ${quote.validUntil}`, pageWidth - margin - 45, yPosition, { align: 'right' });
  }

  // Quote To Section
  yPosition += 20;
  doc.setFont('helvetica', 'bold');
  doc.text('Quote For:', margin, yPosition);

  yPosition += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(quote.clientName, margin, yPosition);

  // Quote Items
  yPosition += 30;
  doc.setFont('helvetica', 'bold');
  doc.text('Description', margin, yPosition);
  doc.text('Amount', pageWidth - margin - 40, yPosition, { align: 'right' });

  yPosition += 3;
  doc.line(margin, yPosition, pageWidth - margin, yPosition);

  yPosition += 15;
  doc.setFont('helvetica', 'normal');
  doc.text(quote.description || 'Professional Services', margin, yPosition);
  doc.text(`£${Number(quote.amount).toFixed(2)}`, pageWidth - margin - 40, yPosition, { align: 'right' });

  // Total
  yPosition += 15;
  doc.line(pageWidth - margin - 80, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', pageWidth - margin - 60, yPosition, { align: 'right' });
  doc.text(`£${Number(quote.amount).toFixed(2)}`, pageWidth - margin - 20, yPosition, { align: 'right' });

  return doc;
};

const replaceTemplateVariables = (template, variables) => {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{${key}}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
};

const uploadToCloudStorage = async (doc, item, cloudData, type) => {
  // This is a placeholder for cloud storage upload
  // In a real implementation, you would:
  // 1. Convert PDF to blob/buffer
  // 2. Use the cloud provider's API to upload
  // 3. Return the shareable URL

  console.log('Note: In production, expired file cleanup should be handled by Cloud Functions');

  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Generate filename based on type
  const filename = type === 'invoice' ? 
    `${item.invoiceNumber}.pdf` : 
    `${item.quoteNumber || item.id}.pdf`;

  // For testing with OneDrive, you can use your test link here
  // In production, this would be the actual cloud storage URL
  return {
    success: true,
    url: `https://1drv.ms/b/c/your-onedrive-link/${filename}` // Replace with your actual OneDrive structure
  };
};