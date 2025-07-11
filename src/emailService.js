
import jsPDF from 'jspdf';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase.js';

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
    
    // Check if user has cloud storage configured
    const user = require('./firebase.js').auth.currentUser;
    if (user) {
      const cloudStorageQuery = query(
        collection(db, 'cloudStorage'), 
        where('userId', '==', user.uid),
        where('isConnected', '==', true)
      );
      const cloudStorageSnapshot = await getDocs(cloudStorageQuery);
      
      if (!cloudStorageSnapshot.empty) {
        // Upload to cloud storage and get link
        const cloudData = cloudStorageSnapshot.docs[0].data();
        const uploadResult = await uploadToCloudStorage(doc, invoice, cloudData);
        
        if (uploadResult.success) {
          // Send email with cloud link
          const subject = `Invoice ${invoice.invoiceNumber} from ${companySettings.companyName || 'Your Company'}`;
          const body = `Dear ${invoice.clientName},

Please find your invoice attached via the following link:
${uploadResult.url}

Invoice Details:
- Invoice Number: ${invoice.invoiceNumber}
- Amount: £${Number(invoice.amount).toFixed(2)}
- Due Date: ${invoice.dueDate || 'N/A'}

Thank you for your business!

Best regards,
${companySettings.contactName || companySettings.companyName || 'Your Company'}`;

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
      
      const subject = `Invoice ${invoice.invoiceNumber} from ${companySettings.companyName || 'Your Company'}`;
      const body = `Dear ${invoice.clientName},

Please find your invoice attached.

Invoice Details:
- Invoice Number: ${invoice.invoiceNumber}
- Amount: £${Number(invoice.amount).toFixed(2)}
- Due Date: ${invoice.dueDate || 'N/A'}

Thank you for your business!

Best regards,
${companySettings.contactName || companySettings.companyName || 'Your Company'}`;

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
    // Generate quote PDF (similar to invoice)
    const doc = await generateQuotePDF(quote, companySettings);
    
    const pdfBlob = doc.output('blob');
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const base64 = e.target.result.split(',')[1];
      
      const subject = `Quote ${quote.quoteNumber || quote.id} from ${companySettings.companyName || 'Your Company'}`;
      const body = `Dear ${quote.clientName},

Please find your quote attached.

Quote Details:
- Quote Number: ${quote.quoteNumber || quote.id}
- Amount: £${Number(quote.amount).toFixed(2)}
- Valid Until: ${quote.validUntil || 'N/A'}

Thank you for considering our services!

Best regards,
${companySettings.contactName || companySettings.companyName || 'Your Company'}`;

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

const uploadToCloudStorage = async (doc, invoice, cloudData) => {
  // This is a placeholder for cloud storage upload
  // In a real implementation, you would:
  // 1. Convert PDF to blob/buffer
  // 2. Use the cloud provider's API to upload
  // 3. Return the shareable URL
  
  console.log('Note: In production, expired file cleanup should be handled by Cloud Functions');
  
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock URL - in production this would be the actual cloud storage URL
  return {
    success: true,
    url: `https://your-cloud-storage.com/invoices/${invoice.invoiceNumber}.pdf`
  };
};
