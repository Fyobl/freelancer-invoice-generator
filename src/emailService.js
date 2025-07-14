import { jsPDF } from 'jspdf';
import { getDoc, doc } from 'firebase/firestore';
import { db, auth } from './firebase.js';

// Debug logging for jsPDF import
console.log('jsPDF import check:', typeof jsPDF);

// PDF Theme Configuration
const PDF_THEME = {
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
    contentStart: 63,
    sectionGap: 15,
    footerOffset: 15
  }
};

// Shared PDF header function for consistent design
const addPDFHeader = (doc, companySettings, documentType) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Modern minimal header with subtle background
  doc.setFillColor(250, 251, 252);
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Accent line at top
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, pageWidth, 3, 'F');

  // Company logo (larger and better positioned)
  if (companySettings && companySettings.logo) {
    try {
      doc.addImage(companySettings.logo, 'JPEG', 20, 8, 70, 40);
    } catch (error) {
      console.log('Error adding logo to PDF:', error);
    }
  }

  // Company name in header (top right)
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(companySettings?.name || companySettings?.companyName || 'Your Company', pageWidth - 20, 18, { align: 'right' });

  // Document type title in header (centered)
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text(documentType, pageWidth / 2, 25, { align: 'center' });

  // Company details (top right, below company name)
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(75, 85, 99);
  let companyY = 26;

  const fullAddress = [companySettings?.address, companySettings?.city, companySettings?.postcode].filter(Boolean).join(', ');
  if (fullAddress) {
    doc.text(fullAddress, pageWidth - 20, companyY, { align: 'right' });
    companyY += 6;
  }
  if (companySettings?.email) {
    doc.text(companySettings.email, pageWidth - 20, companyY, { align: 'right' });
    companyY += 6;
  }
  if (companySettings?.phone) {
    doc.text(companySettings.phone, pageWidth - 20, companyY, { align: 'right' });
  }

  // Subtle divider line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(1);
  doc.line(20, 55, pageWidth - 20, 55);

  return 63; // Return the Y position where content should start
};

// Shared PDF footer function for consistent design
const addPDFFooter = (doc, companySettings, currentY, thankYouMessage = 'Thank you for your business!') => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Modern footer with clean layout
  const footerY = Math.max(currentY + 15, 250);

  // Subtle divider
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(20, footerY - 10, pageWidth - 20, footerY - 10);

  doc.setFontSize(7);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(107, 114, 128);

  let footerText = [];
  if (companySettings?.companyNumber) {
    footerText.push(`Company Registration: ${companySettings.companyNumber}`);
  }
  if (companySettings?.vatNumber) {
    footerText.push(`VAT Number: ${companySettings.vatNumber}`);
  }

  if (footerText.length > 0) {
    doc.text(footerText.join(' • '), pageWidth / 2, footerY, { align: 'center' });
  }

  doc.setTextColor(99, 102, 241);
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.text(thankYouMessage, pageWidth / 2, footerY + 8, { align: 'center' });
};

// Shared PDF footer function with theme configuration
const addThemedPDFFooter = (doc, companySettings, currentY, theme = PDF_THEME, thankYouMessage = 'Thank you for your business!') => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const footerY = Math.max(currentY + theme.spacing.footerOffset, 250);

    // Divider line
    doc.setDrawColor(...theme.colors.border);
    doc.setLineWidth(0.5);
    doc.line(20, footerY - 10, pageWidth - 20, footerY - 10);

    // Footer text
    doc.setFontSize(theme.fonts.tiny.size);
    doc.setFont(undefined, theme.fonts.tiny.weight);
    doc.setTextColor(...theme.colors.light);

    let footerText = [];
    if (companySettings?.companyNumber) {
        footerText.push(`Company Registration: ${companySettings.companyNumber}`);
    }
    if (companySettings?.vatNumber) {
        footerText.push(`VAT Number: ${companySettings.vatNumber}`);
    }

    if (footerText.length > 0) {
        doc.text(footerText.join(' • '), pageWidth / 2, footerY, { align: 'center' });
    }

    // Thank you message
    doc.setTextColor(...theme.colors.primary);
    doc.setFontSize(theme.fonts.small.size);
    doc.setFont(undefined, theme.fonts.small.weight);
    doc.text(thankYouMessage, pageWidth / 2, footerY + 8, { align: 'center' });
};

const generateInvoicePDF = async (invoice, companySettings) => {
  try {
    console.log('Starting invoice PDF generation');

    // Validate input data
    if (!invoice) {
      throw new Error('Invoice data is required');
    }

    if (!companySettings) {
      console.warn('Company settings not provided, using defaults');
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const theme = PDF_THEME;

    let currentY = addPDFHeader(doc, companySettings, 'INVOICE');

    // Bill To section with modern card design - moved to top
    doc.setFillColor(255, 255, 255);
    doc.rect(20, currentY, pageWidth - 40, 20, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(1);
    doc.rect(20, currentY, pageWidth - 40, 20);

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(99, 102, 241);
    doc.text('BILL TO: ', 25, currentY + 13);

    // Client name in black
    doc.setFont(undefined, 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(invoice.clientName, 55, currentY + 13);

    currentY += 28;

    // Invoice details in clean grid layout - reduced height
    doc.setFillColor(249, 250, 251);
    doc.rect(20, currentY, pageWidth - 40, 24, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.rect(20, currentY, pageWidth - 40, 24);

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(75, 85, 99);

    // Left column - centered in left half
    const leftCenterX = 20 + (pageWidth - 40) / 4;
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`, leftCenterX, currentY + 10, { align: 'center' });
    doc.setFont(undefined, 'bold');
    doc.setTextColor(17, 24, 39);

    doc.setFont(undefined, 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text(`Issue Date: ${new Date().toLocaleDateString()}`, leftCenterX, currentY + 18, { align: 'center' });
    doc.setFont(undefined, 'bold');
    doc.setTextColor(17, 24, 39);

    // Right column - centered in right half
    const rightCenterX = 20 + (3 * (pageWidth - 40)) / 4;
    doc.setFont(undefined, 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text(`Due Date: ${invoice.dueDate || 'Upon receipt'}`, rightCenterX, currentY + 10, { align: 'center' });
    doc.setFont(undefined, 'bold');
    doc.setTextColor(17, 24, 39);

    doc.setFont(undefined, 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text('Status: ', rightCenterX, currentY + 18, { align: 'center' });
    doc.setFont(undefined, 'bold');

    // Status with color coding
    if (invoice.status === 'Paid') {
      doc.setTextColor(34, 197, 94);
    } else if (invoice.status === 'Overdue') {
      doc.setTextColor(239, 68, 68);
    } else {
      doc.setTextColor(245, 158, 11);
    }
    doc.text(invoice.status, rightCenterX + 10, currentY + 18, { align: 'center' });

    currentY += 32;

    // Items section with modern table design
    doc.setFillColor(17, 24, 39);
    doc.rect(20, currentY, pageWidth - 40, 12, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('DESCRIPTION', 25, currentY + 8);
    doc.text('QTY', pageWidth - 120, currentY + 8, { align: 'center' });
    doc.text('RATE', pageWidth - 80, currentY + 8, { align: 'center' });
    doc.text('AMOUNT', pageWidth - 35, currentY + 8, { align: 'center' });

    currentY += 15;

    // Display items
    doc.setTextColor(17, 24, 39);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);

    if (invoice.selectedProducts && invoice.selectedProducts.length > 0) {
      invoice.selectedProducts.forEach((product, index) => {
        try {
          const isEven = index % 2 === 0;
          if (isEven) {
            doc.setFillColor(249, 250, 251);
            doc.rect(20, currentY - 2, pageWidth - 40, 12, 'F');
          }

          const productName = product.name || 'Product';
          const quantity = product.quantity || 1;
          const price = parseFloat(product.price) || 0;
          const total = price * quantity;

          doc.setTextColor(17, 24, 39);
          doc.text(productName, 25, currentY + 6);
          doc.text(quantity.toString(), pageWidth - 120, currentY + 6, { align: 'center' });
          doc.text(`£${price.toFixed(2)}`, pageWidth - 80, currentY + 6, { align: 'center' });
          doc.text(`£${total.toFixed(2)}`, pageWidth - 35, currentY + 6, { align: 'center' });

          currentY += 12;
        } catch (error) {
          console.error('Error rendering product:', product, error);
          // Skip this product and continue
        }
      });
    } else {
      // Single service line
      const amount = parseFloat(invoice.amount) || 0;
      doc.setTextColor(17, 24, 39);
      doc.text('Service/Product', 25, currentY + 6);
      doc.text('1', pageWidth - 120, currentY + 6, { align: 'center' });
      doc.text(`£${amount.toFixed(2)}`, pageWidth - 80, currentY + 6, { align: 'center' });
      doc.text(`£${amount.toFixed(2)}`, pageWidth - 35, currentY + 6, { align: 'center' });
      currentY += 12;
    }

  // Calculate totals
    const subtotal = invoice.selectedProducts && invoice.selectedProducts.length > 0 
      ? invoice.selectedProducts.reduce((sum, product) => sum + ((product.price || 0) * (product.quantity || 1)), 0)
      : parseFloat(invoice.amount) || 0;

    const vatRate = parseFloat(invoice.vat) || 0;
    const vatAmount = subtotal * (vatRate / 100);
    const totalAmount = subtotal + vatAmount;

    // Modern totals section with clean design
    currentY += 10;
    const totalsStartX = pageWidth - 90;
    const totalsWidth = 70;

    // Subtotal row
    doc.setFillColor(249, 250, 251);
    doc.rect(totalsStartX, currentY, totalsWidth, 9, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.rect(totalsStartX, currentY, totalsWidth, 9);

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text('Subtotal:', totalsStartX + 5, currentY + 6);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(`£${subtotal.toFixed(2)}`, pageWidth - 30, currentY + 6, { align: 'right' });

    // VAT row (if applicable)
    if (vatRate > 0) {
      currentY += 9;
      doc.setFillColor(255, 255, 255);
      doc.rect(totalsStartX, currentY, totalsWidth, 9, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.rect(totalsStartX, currentY, totalsWidth, 9);

      doc.setFont(undefined, 'normal');
      doc.setTextColor(75, 85, 99);
      doc.text(`VAT (${vatRate}%):`, totalsStartX + 5, currentY + 6);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text(`£${vatAmount.toFixed(2)}`, pageWidth - 30, currentY + 6, { align: 'right' });
    }

    // Total row with emphasis
    currentY += 9;
    doc.setFillColor(17, 24, 39);
    doc.rect(totalsStartX, currentY, totalsWidth, 12, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL:', totalsStartX + 5, currentY + 8);
    doc.setFontSize(11);
    doc.text(`£${totalAmount.toFixed(2)}`, pageWidth - 30, currentY + 8, { align: 'right' });

    doc.setTextColor(17, 24, 39);

    // Notes section with modern card design
    if (invoice.notes) {
      currentY += 15;
      doc.setFillColor(255, 255, 255);
      doc.rect(20, currentY, pageWidth - 40, 20, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(1);
      doc.rect(20, currentY, pageWidth - 40, 20);

      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(99, 102, 241);
      doc.text('NOTES & TERMS', 25, currentY + 8);

      doc.setTextColor(17, 24, 39);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(7);
      const notes = doc.splitTextToSize(invoice.notes, pageWidth - 50);
      doc.text(notes, 25, currentY + 14);
      currentY += 25;
    }

    addThemedPDFFooter(doc, companySettings, currentY, theme, 'Thank you for your business!');

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
    const theme = PDF_THEME;

    let currentY = addPDFHeader(doc, companySettings, 'QUOTE');

    // Quote To section with modern card design - moved to top
    doc.setFillColor(255, 255, 255);
    doc.rect(20, currentY, pageWidth - 40, 20, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(1);
    doc.rect(20, currentY, pageWidth - 40, 20);

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(99, 102, 241);
    doc.text('QUOTE TO: ', 25, currentY + 13);

    // Client name in black
    doc.setFont(undefined, 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(quote.clientName, 60, currentY + 13);

    currentY += 28;

    // Quote details in clean grid layout - reduced height
    doc.setFillColor(249, 250, 251);
    doc.rect(20, currentY, pageWidth - 40, 24, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.rect(20, currentY, pageWidth - 40, 24);

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(75, 85, 99);

    // Left column - centered in left half
    const leftCenterX = 20 + (pageWidth - 40) / 4;
    doc.text(`Quote Number: ${quote.quoteNumber}`, leftCenterX, currentY + 10, { align: 'center' });
    doc.setFont(undefined, 'bold');
    doc.setTextColor(17, 24, 39);

    doc.setFont(undefined, 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text(`Issue Date: ${new Date().toLocaleDateString()}`, leftCenterX, currentY + 18, { align: 'center' });
    doc.setFont(undefined, 'bold');
    doc.setTextColor(17, 24, 39);

    // Right column - centered in right half
    const rightCenterX = 20 + (3 * (pageWidth - 40)) / 4;
    doc.setFont(undefined, 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text(`Valid Until: ${quote.validUntil || 'Upon acceptance'}`, rightCenterX, currentY + 10, { align: 'center' });
    doc.setFont(undefined, 'bold');
    doc.setTextColor(17, 24, 39);

    doc.setFont(undefined, 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text('Status: ', rightCenterX, currentY + 18, { align: 'center' });
    doc.setFont(undefined, 'bold');

    // Status with color coding
    if (quote.status === 'Accepted') {
      doc.setTextColor(34, 197, 94);
    } else if (quote.status === 'Rejected') {
      doc.setTextColor(239, 68, 68);
    } else {
      doc.setTextColor(245, 158, 11);
    }
    doc.text(quote.status, rightCenterX + 10, currentY + 18, { align: 'center' });

    currentY += 32;

    // Items section with modern table design
    doc.setFillColor(17, 24, 39);
    doc.rect(20, currentY, pageWidth - 40, 12, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('DESCRIPTION', 25, currentY + 8);
    doc.text('QTY', pageWidth - 120, currentY + 8, { align: 'center' });
    doc.text('RATE', pageWidth - 80, currentY + 8, { align: 'center' });
    doc.text('AMOUNT', pageWidth - 30, currentY + 8, { align: 'right' });

    currentY += 12;
    doc.setTextColor(17, 24, 39);

    // Service line
    doc.setFillColor(249, 250, 251);
    doc.rect(20, currentY, pageWidth - 40, 10, 'F');

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(quote.productName || 'Professional Services', 25, currentY + 7);
    doc.text('1', pageWidth - 120, currentY + 7, { align: 'center' });
    doc.text(`£${Number(quote.amount).toFixed(2)}`, pageWidth - 80, currentY + 7, { align: 'center' });
    doc.text(`£${Number(quote.amount).toFixed(2)}`, pageWidth - 30, currentY + 7, { align: 'right' });

    currentY += 10;

    // Calculate totals
    const subtotal = parseFloat(quote.amount) || 0;
    const vatRate = parseFloat(quote.vat) || 0;
    const vatAmount = subtotal * (vatRate / 100);
    const totalAmount = subtotal + vatAmount;

    // Modern totals section with clean design
    currentY += 10;
    const totalsStartX = pageWidth - 90;
    const totalsWidth = 70;

    // Subtotal row
    doc.setFillColor(249, 250, 251);
    doc.rect(totalsStartX, currentY, totalsWidth, 9, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.rect(totalsStartX, currentY, totalsWidth, 9);

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text('Subtotal:', totalsStartX + 5, currentY + 6);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(`£${subtotal.toFixed(2)}`, pageWidth - 30, currentY + 6, { align: 'right' });

    // VAT row (if applicable)
    if (vatRate > 0) {
      currentY += 9;
      doc.setFillColor(255, 255, 255);
      doc.rect(totalsStartX, currentY, totalsWidth, 9, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.rect(totalsStartX, currentY, totalsWidth, 9);

      doc.setFont(undefined, 'normal');
      doc.setTextColor(75, 85, 99);
      doc.text(`VAT (${vatRate}%):`, totalsStartX + 5, currentY + 6);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text(`£${vatAmount.toFixed(2)}`, pageWidth - 30, currentY + 6, { align: 'right' });
    }

    // Total row with emphasis
    currentY += 9;
    doc.setFillColor(17, 24, 39);
    doc.rect(totalsStartX, currentY, totalsWidth, 12, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL:', totalsStartX + 5, currentY + 8);
    doc.setFontSize(11);
    doc.text(`£${totalAmount.toFixed(2)}`, pageWidth - 30, currentY + 8, { align: 'right' });

    doc.setTextColor(17, 24, 39);

    // Notes section with modern card design
    if (quote.notes) {
      currentY += 15;
      doc.setFillColor(255, 255, 255);
      doc.rect(20, currentY, pageWidth - 40, 20, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(1);
      doc.rect(20, currentY, pageWidth - 40, 20);

      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(99, 102, 241);
      doc.text('NOTES & TERMS', 25, currentY + 8);

      doc.setTextColor(17, 24, 39);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(7);
      const notes = doc.splitTextToSize(quote.notes, pageWidth - 50);
      doc.text(notes, 25, currentY + 14);
      currentY += 25;
    }
    addThemedPDFFooter(doc, companySettings, currentY, theme, 'Thank you for considering our services!');

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

// Generate client statement PDF
const generateStatementPDF = async (client, invoices, companySettings, period = 'full') => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const theme = PDF_THEME;

    let currentY = addPDFHeader(doc, companySettings, 'STATEMENT');

    // Statement To section with modern card design - moved to top
    doc.setFillColor(255, 255, 255);
    doc.rect(20, currentY, pageWidth - 40, 20, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(1);
    doc.rect(20, currentY, pageWidth - 40, 20);

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(99, 102, 241);
    doc.text('STATEMENT FOR: ', 25, currentY + 13);

    // Client name in black
    doc.setFont(undefined, 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(client.name, 85, currentY + 13);

    currentY += 28;

    // Statement details in clean grid layout - reduced height
    doc.setFillColor(249, 250, 251);
    doc.rect(20, currentY, pageWidth - 40, 24, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.rect(20, currentY, pageWidth - 40, 24);

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(75, 85, 99);

    // Left column - centered in left half
    const leftCenterX = 20 + (pageWidth - 40) / 4;
    doc.text(`Period: ${period === 'full' ? 'All Time' : period}`, leftCenterX, currentY + 10, { align: 'center' });
    doc.setFont(undefined, 'bold');
    doc.setTextColor(17, 24, 39);

    doc.setFont(undefined, 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text(`Statement Date: ${new Date().toLocaleDateString()}`, leftCenterX, currentY + 18, { align: 'center' });
    doc.setFont(undefined, 'bold');
    doc.setTextColor(17, 24, 39);

    // Right column - centered in right half
    const rightCenterX = 20 + (3 * (pageWidth - 40)) / 4;
    doc.setFont(undefined, 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text(`Total Invoices: ${invoices.length}`, rightCenterX, currentY + 10, { align: 'center' });
    doc.setFont(undefined, 'bold');
    doc.setTextColor(17, 24, 39);

    doc.setFont(undefined, 'normal');
    doc.setTextColor(75, 85, 99);
    if (client.email) {
      doc.text(`Email: ${client.email}`, rightCenterX, currentY + 18, { align: 'center' });
    }

    currentY += 32;

    // Summary totals section
    const totalAmount = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);const paidAmount = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const unpaidAmount = invoices.filter(inv => inv.status === 'Unpaid').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const overdueAmount = invoices.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

    // Modern totals section with clean design
    const totalsStartX = 20;
    const totalsWidth = pageWidth - 40;

    // Header row
    doc.setFillColor(17, 24, 39);
    doc.rect(totalsStartX, currentY, totalsWidth, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('ACCOUNT SUMMARY', totalsStartX + 10, currentY + 8);

    currentY += 12;

    // Total Amount row
    doc.setFillColor(249, 250, 251);
    doc.rect(totalsStartX, currentY, totalsWidth, 9, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.rect(totalsStartX, currentY, totalsWidth, 9);

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text('Total Amount:', totalsStartX + 10, currentY + 6);
    doc.setFont(undefined, 'bold');doc.setTextColor(17, 24, 39);
    doc.text(`£${totalAmount.toFixed(2)}`, pageWidth - 30, currentY + 6, { align: 'right' });

    // Paid Amount row
    currentY += 9;
    doc.setFillColor(255, 255, 255);
    doc.rect(totalsStartX, currentY, totalsWidth, 9, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.rect(totalsStartX, currentY, totalsWidth, 9);

    doc.setFont(undefined, 'normal');
    doc.setTextColor(34, 197, 94);
    doc.text('Paid:', totalsStartX + 10, currentY + 6);
    doc.setFont(undefined, 'bold');
    doc.text(`£${paidAmount.toFixed(2)}`, pageWidth - 30, currentY + 6, { align: 'right' });

    // Unpaid Amount row
    currentY += 9;
    doc.setFillColor(249, 250, 251);
    doc.rect(totalsStartX, currentY, totalsWidth, 9, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.rect(totalsStartX, currentY, totalsWidth, 9);

    doc.setFont(undefined, 'normal');
    doc.setTextColor(245, 158, 11);
    doc.text('Unpaid:', totalsStartX + 10, currentY + 6);
    doc.setFont(undefined, 'bold');
    doc.text(`£${unpaidAmount.toFixed(2)}`, pageWidth - 30, currentY + 6, { align: 'right' });

    // Overdue Amount row (if any)
    if (overdueAmount > 0) {
      currentY += 9;
      doc.setFillColor(255, 255, 255);
      doc.rect(totalsStartX, currentY, totalsWidth, 9, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.rect(totalsStartX, currentY, totalsWidth, 9);

      doc.setFont(undefined, 'normal');
      doc.setTextColor(239, 68, 68);
      doc.text('Overdue:', totalsStartX + 10, currentY + 6);
      doc.setFont(undefined, 'bold');
      doc.text(`£${overdueAmount.toFixed(2)}`, pageWidth - 30, currentY + 6, { align: 'right' });
    }

    currentY += 20;

    // Invoices table header
    doc.setFillColor(17, 24, 39);
    doc.rect(20, currentY, pageWidth - 40, 12, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('INVOICE #', 25, currentY + 8);
    doc.text('DATE', 75, currentY + 8);
    doc.text('DUE DATE', 115, currentY + 8);
    doc.text('STATUS', 155, currentY + 8);
    doc.text('AMOUNT', pageWidth - 30, currentY + 8, { align: 'right' });

    currentY += 12;
    doc.setTextColor(17, 24, 39);

    // Invoice rows
    invoices.forEach((invoice, index) => {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      const bgColor = index % 2 === 0 ? 249 : 255;
      doc.setFillColor(bgColor, bgColor === 249 ? 250 : 255, bgColor === 249 ? 251 : 255);
      doc.rect(20, currentY, pageWidth - 40, 10, 'F');

      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(17, 24, 39);
      doc.text(invoice.invoiceNumber || 'N/A', 25, currentY + 7);
      doc.text(invoice.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A', 75, currentY + 7);
      doc.text(invoice.dueDate || 'N/A', 115, currentY + 7);

      // Status with color
      if (invoice.status === 'Paid') {
        doc.setTextColor(34, 197, 94);
      } else if (invoice.status === 'Overdue') {
        doc.setTextColor(239, 68, 68);
      } else {
        doc.setTextColor(245, 158, 11);
      }
      doc.text(invoice.status || 'Unpaid', 155, currentY + 7);

      doc.setTextColor(17, 24, 39);
      doc.text(`£${(parseFloat(invoice.amount) || 0).toFixed(2)}`, pageWidth - 30, currentY + 7, { align: 'right' });

      currentY += 10;
    });

    addThemedPDFFooter(doc, companySettings, currentY, theme, 'Thank you for your continued business!');

    console.log('Client statement PDF generation completed successfully');
    return doc;
  } catch (error) {
    console.error('Error generating client statement PDF:', error);
    throw error;
  }
};

// Helper function to get email settings from Firestore
const getEmailSettings = async () => {
  try {
    if (!auth.currentUser) return null;
    const docRef = doc(db, 'emailSettings', auth.currentUser.uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return null;
  }
};

// Helper function to replace template variables
const replaceTemplateVariables = (template, data) => {
  let result = template;
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, data[key] || '');
  });
  return result;
};

// Helper function to show email instructions
const showEmailInstructions = (type, fileName, downloadCallback, emailCallback) => {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;

  modal.innerHTML = `
    <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; text-align: center;">
      <h3 style="margin-top: 0; color: #333;">📧 Send ${type.charAt(0).toUpperCase() + type.slice(1)} via Email</h3>
      <p style="margin: 20px 0; color: #666; line-height: 1.5;">
        To send this ${type} via email:
      </p>
      <ol style="text-align: left; color: #666; line-height: 1.6; margin: 20px 0;">
        <li>Click "Download PDF" to save the ${type}</li>
        <li>Click "Open Email" to create a pre-filled email</li>
        <li>Attach the downloaded PDF to your email</li>
        <li>Send the email</li>
      </ol>
      <div style="margin: 25px 0;">
        <button onclick="downloadPDF()" style="background: #28a745; color: white; border: none; padding: 12px 20px; border-radius: 8px; margin: 5px; cursor: pointer; font-size: 14px;">
          📥 Download PDF
        </button>
        <button onclick="openEmail()" style="background: #007bff; color: white; border: none; padding: 12px 20px; border-radius: 8px; margin: 5px; cursor: pointer; font-size: 14px;">
          📧 Open Email
        </button>
      </div>
      <button onclick="closeModal()" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">
        Close
      </button>
    </div>
  `;

  // Add functions to global scope for the modal
  window.downloadPDF = downloadCallback;
  window.openEmail = emailCallback;
  window.closeModal = () => {
    document.body.removeChild(modal);
    delete window.downloadPDF;
    delete window.openEmail;
    delete window.closeModal;
  };

  document.body.appendChild(modal);
};

// Send invoice via email
const sendInvoiceViaEmail = async (invoice, companySettings) => {
  try {
    // Get email settings
    const emailSettings = await getEmailSettings();

    // Calculate total amount
    const totalAmount = invoice.selectedProducts && invoice.selectedProducts.length > 0 
      ? invoice.selectedProducts.reduce((sum, product) => sum + ((product.price || 0) * (product.quantity || 1)), 0)
      : parseFloat(invoice.amount) || 0;

    // Add VAT if applicable
    const vatRate = parseFloat(invoice.vat) || 0;
    const vatAmount = totalAmount * (vatRate / 100);
    const finalAmount = totalAmount + vatAmount;

    // Prepare template data
    const templateData = {
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      totalAmount: finalAmount.toFixed(2),
      dueDate: invoice.dueDate || 'Upon receipt',
      senderName: emailSettings?.defaultSenderName || companySettings?.contactName || 'Your Name',
      companyName: companySettings?.companyName || 'Your Company'
    };

    // Get templates (use default if no custom template exists)
    const subject = emailSettings?.invoiceSubject || 'Invoice {invoiceNumber} from {companyName}';
    const body = emailSettings?.invoiceTemplate || `Dear {clientName},

Please find attached invoice {invoiceNumber} for the amount of £{totalAmount}.

Payment is due by {dueDate}.

Thank you for your business!

Best regards,
{senderName}
{companyName}`;

    // Replace variables
    const finalSubject = replaceTemplateVariables(subject, templateData);
    const finalBody = replaceTemplateVariables(body, templateData);

    // Function to download PDF
    const downloadPDF = async () => {
      try {
        const doc = await generateInvoicePDF(invoice, companySettings);
        const fileName = `invoice_${invoice.invoiceNumber}_${invoice.clientName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        doc.save(fileName);
      } catch (error) {
        console.error('Error generating invoice PDF:', error);
        alert('Error generating PDF: ' + (error.message || 'Unknown error occurred'));
      }
    };

    // Function to open email client
    const openEmailClient = () => {
      const mailtoLink = `mailto:${invoice.clientEmail || ''}?subject=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(finalBody)}`;
      window.location.href = mailtoLink;
    };

    // Show instructions popup with callback functions
    showEmailInstructions('invoice', invoice.invoiceNumber, downloadPDF, openEmailClient);

  } catch (error) {
    console.error('Error creating invoice email:', error);
    alert('Error creating email: ' + (error.message || 'Unknown error occurred'));
  }
};

// Send quote via email
const sendQuoteViaEmail = async (quote, companySettings) => {
  try {
    // Get email settings
    const emailSettings = await getEmailSettings();

    // Calculate total amount
    const subtotal = parseFloat(quote.amount) || 0;
    const vatRate = parseFloat(quote.vat) || 0;
    const vatAmount = subtotal * (vatRate / 100);
    const totalAmount = subtotal + vatAmount;

    // Prepare template data
    const templateData = {
      quoteNumber: quote.quoteNumber,
      clientName: quote.clientName,
      totalAmount: totalAmount.toFixed(2),
      validUntil: quote.validUntil || 'Upon acceptance',
      senderName: emailSettings?.defaultSenderName || companySettings?.contactName || 'Your Name',
      companyName: companySettings?.companyName || 'Your Company'
    };

    // Get templates (use default if no custom template exists)
    const subject = emailSettings?.quoteSubject || 'Quote {quoteNumber} from {companyName}';
    const body = emailSettings?.quoteTemplate || `Dear {clientName},

Please find attached quote {quoteNumber} for the amount of £{totalAmount}.

This quote is valid until {validUntil}.

We look forward to working with you!

Best regards,
{senderName}
{companyName}`;

    // Replace variables
    const finalSubject = replaceTemplateVariables(subject, templateData);
    const finalBody = replaceTemplateVariables(body, templateData);

    // Function to download PDF
    const downloadPDF = async () => {
      try {
        const doc = await generateQuotePDF(quote, companySettings);
        const fileName = `quote_${quote.quoteNumber}_${quote.clientName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        doc.save(fileName);
      } catch (error) {
        console.error('Error generating quote PDF:', error);
        alert('Error generating PDF: ' + (error.message || 'Unknown error occurred'));
      }
    };

    // Function to open email client
    const openEmailClient = () => {
      const mailtoLink = `mailto:${quote.clientEmail || ''}?subject=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(finalBody)}`;
      window.location.href = mailtoLink;
    };

    // Show instructions popup with callback functions
    showEmailInstructions('quote', quote.quoteNumber, downloadPDF, openEmailClient);

  } catch (error) {
    console.error('Error creating quote email:', error);
    alert('Error creating email: ' + (error.message || 'Unknown error occurred'));
  }
};

// Send client statement via email
const sendClientStatementViaEmail = async (client, invoices, companySettings, period = 'full') => {
  try {
    // Get email settings
    const emailSettings = await getEmailSettings();

    // Calculate totals
    const totalAmount = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const paidAmount = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const unpaidAmount = invoices.filter(inv => inv.status === 'Unpaid').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

    // Prepare template data
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

    // Get templates (use default if no custom template exists)
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

    // Replace variables
    const finalSubject = replaceTemplateVariables(subject, templateData);
    const finalBody = replaceTemplateVariables(body, templateData);

    // Function to download PDF
    const downloadPDF = async () => {
      try {
        const doc = await generateStatementPDF(client, invoices, companySettings, period);
        const fileName = `statement_${client.name.replace(/[^a-zA-Z0-9]/g, '_')}_${period}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
      } catch (error) {
        console.error('Error generating statement PDF:', error);
        alert('Error generating PDF: ' + (error.message || 'Unknown error occurred'));
      }
    };

    // Function to open email client
    const openEmailClient = () => {
      const mailtoLink = `mailto:${client.email}?subject=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(finalBody)}`;
      window.location.href = mailtoLink;
    };

    // Show instructions popup with callback functions
    showEmailInstructions('statement', `${client.name}_${period}`, downloadPDF, openEmailClient);

  } catch (error) {
    console.error('Error creating statement email:', error);
    alert('Error creating email: ' + (error.message || 'Unknown error occurred'));
  }
};

export { 
  generateInvoicePDF,
  generateQuotePDF, 
  generateStatementPDF,
  sendInvoiceViaEmail, 
  sendQuoteViaEmail,
  sendClientStatementViaEmail
};