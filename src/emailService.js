import { jsPDF } from 'jspdf';
import { getDoc, doc } from 'firebase/firestore';
import { db, auth } from './firebase.js';

// Debug logging for jsPDF import
console.log('jsPDF import check:', typeof jsPDF);

// Default PDF Theme Configuration
const DEFAULT_PDF_THEME = {
  colors: {
    primary: [99, 102, 241],        // Purple accent
    secondary: [75, 85, 99],        // Gray text
    dark: [17, 24, 39],            // Dark text
    light: [107, 114, 128],        // Light gray
    background: [250, 251, 252],    // Light background
    border: [229, 231, 235]         // Border color
  },
  fonts: {
    title: { size: 20, weight: 'bold' },
    heading: { size: 14, weight: 'bold' },
    normal: { size: 10, weight: 'normal' },
    small: { size: 8, weight: 'normal' },
    tiny: { size: 7, weight: 'normal' }
  },
  spacing: {
    headerHeight: 50,
    contentStart: 70,
    sectionGap: 15,
    footerOffset: 20
  }
};

// Fetch user's PDF settings
const fetchPDFSettings = async () => {
  try {
    if (!auth.currentUser) return DEFAULT_PDF_THEME;
    return DEFAULT_PDF_THEME;
  } catch (error) {
    console.error('Error fetching PDF settings:', error);
    return DEFAULT_PDF_THEME;
  }
};

// Universal PDF Header - Works for all document types
const drawHeader = (doc, companySettings, documentType, theme) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Gradient background for header
  doc.setFillColor(...theme.colors.background);
  doc.rect(0, 0, pageWidth, theme.spacing.headerHeight, 'F');

  // Top accent stripe
  doc.setFillColor(...theme.colors.primary);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Company logo (if available) - positioned based on PDF settings
  if (companySettings && companySettings.logo) {
    try {
      const logoWidth = theme.logo?.maxWidth || 60;
      const logoHeight = theme.logo?.maxHeight || 30;
      let logoX = 20; // default to left

      // Position logo based on settings
      if (theme.logo?.positioning === 'top-center') {
        logoX = (pageWidth - logoWidth) / 2;
      } else if (theme.logo?.positioning === 'top-right') {
        logoX = pageWidth - logoWidth - 20;
      }

      doc.addImage(companySettings.logo, 'JPEG', logoX, 12, logoWidth, logoHeight);
    } catch (error) {
      console.log('Error adding logo to PDF:', error);
    }
  }

  // Document type title (center)
  doc.setTextColor(...theme.colors.primary);
  doc.setFontSize(theme.fonts.title.size);
  doc.setFont(undefined, theme.fonts.title.weight);
  doc.text(documentType, pageWidth / 2, 25, { align: 'center' });

  // Company name and details (top right)
  doc.setTextColor(...theme.colors.dark);
  doc.setFontSize(theme.fonts.heading.size);
  doc.setFont(undefined, theme.fonts.heading.weight);
  doc.text(companySettings?.name || companySettings?.companyName || 'Your Company', pageWidth - 20, 18, { align: 'right' });

  // Company contact details
  doc.setFontSize(theme.fonts.small.size);
  doc.setFont(undefined, theme.fonts.small.weight);
  doc.setTextColor(...theme.colors.secondary);
  let detailY = 26;

  if (companySettings?.email) {
    doc.text(companySettings.email, pageWidth - 20, detailY, { align: 'right' });
    detailY += 5;
  }
  if (companySettings?.phone) {
    doc.text(companySettings.phone, pageWidth - 20, detailY, { align: 'right' });
    detailY += 5;
  }

  // Address line
  const addressParts = [
    companySettings?.address, 
    companySettings?.city, 
    companySettings?.postcode
  ].filter(Boolean);

  if (addressParts.length > 0) {
    doc.text(addressParts.join(', '), pageWidth - 20, detailY, { align: 'right' });
  }

  // Bottom border
  doc.setDrawColor(...theme.colors.border);
  doc.setLineWidth(1);
  doc.line(20, theme.spacing.headerHeight - 5, pageWidth - 20, theme.spacing.headerHeight - 5);

  return theme.spacing.contentStart;
};

// Universal PDF Footer - Works for all document types
const drawFooter = (doc, companySettings, currentY, theme, thankYouMessage) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = Math.max(currentY + theme.spacing.footerOffset, pageHeight - 40);

  // Footer separator line
  doc.setDrawColor(...theme.colors.border);
  doc.setLineWidth(0.5);
  doc.line(20, footerY - 10, pageWidth - 20, footerY - 10);

  // Company registration details
  doc.setFontSize(theme.fonts.tiny.size);
  doc.setFont(undefined, theme.fonts.tiny.weight);
  doc.setTextColor(...theme.colors.light);

  let footerText = [];
  if (companySettings?.companyNumber) {
    footerText.push(`Company No: ${companySettings.companyNumber}`);
  }
  if (companySettings?.vatNumber) {
    footerText.push(`VAT: ${companySettings.vatNumber}`);
  }

  if (footerText.length > 0) {
    doc.text(footerText.join(' • '), pageWidth / 2, footerY, { align: 'center' });
  }

  // Thank you message
  doc.setTextColor(...theme.colors.primary);
  doc.setFontSize(theme.fonts.small.size);
  doc.setFont(undefined, theme.fonts.small.weight);
  doc.text(thankYouMessage, pageWidth / 2, footerY + 8, { align: 'center' });

  // Website footer
  if (companySettings?.website) {
    doc.setTextColor(...theme.colors.light);
    doc.setFontSize(theme.fonts.tiny.size);
    doc.text(companySettings.website, pageWidth / 2, footerY + 16, { align: 'center' });
  }
};

// These functions are deprecated - using template system instead

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
        // Use new template system
        const { generateInvoicePDFFromTemplate } = await import('./pdfTemplateService.js');
        const doc = await generateInvoicePDFFromTemplate(invoice, companySettings);
        const fileName = `invoice_${invoice.invoiceNumber}_${invoice.clientName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
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
        // Use new template system
        const { generateQuotePDFFromTemplate } = await import('./pdfTemplateService.js');
        const doc = await generateQuotePDFFromTemplate(quote, companySettings);
        const fileName = `quote_${quote.quoteNumber}_${quote.clientName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
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
        // Use new template system
        const { generateStatementPDFFromTemplate } = await import('./pdfTemplateService.js');
        const doc = await generateStatementPDFFromTemplate(client, invoices, companySettings, period);
        const fileName = `statement_${client.name.replace(/[^a-zA-Z0-9]/g, '_')}_${period}_${new Date().toISOString().split('T')[0]}.pdf`;
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
  sendClientStatementViaEmail,
  drawHeader,
  drawFooter
};