import { jsPDF } from 'jspdf';
import { getDoc, doc } from 'firebase/firestore';
import { db, auth } from './firebase.js';
// Template service imports removed - using built-in PDF generation

// Debug logging for jsPDF import
console.log('jsPDF import check:', typeof jsPDF);

// Default PDF Theme Configuration (fallback)
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
    const docRef = doc(db, 'pdfSettings', auth.currentUser.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const userSettings = docSnap.data();
      return {
        ...DEFAULT_PDF_THEME,
        ...userSettings.theme,
        templateStyle: userSettings.templateStyle || 'modern',
        watermark: userSettings.watermark || { enabled: false }
      };
    }
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

// Add watermark if enabled
const addWatermark = (doc, watermarkSettings) => {
  if (!watermarkSettings.enabled) return;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setTextColor(watermarkSettings.color || '#cccccc');
  doc.setFontSize(watermarkSettings.fontSize || 60);
  doc.setFont(undefined, 'bold');

  // Save current graphics state
  const currentAlpha = doc.internal.getGState();

  // Set transparency
  doc.setGState(new doc.GState({ opacity: watermarkSettings.opacity || 0.1 }));

  // Add rotated watermark text
  doc.text(
    watermarkSettings.text || 'DRAFT',
    pageWidth / 2,
    pageHeight / 2,
    {
      align: 'center',
      angle: 45
    }
  );

  // Restore graphics state
  doc.setGState(currentAlpha);
};

// Invoice PDF Template
const generateInvoicePDF = async (invoice, companySettings) => {
  try {
    console.log('Starting invoice PDF generation');

    if (!invoice) {
      throw new Error('Invoice data is required');
    }

    const pdfSettings = await fetchPDFSettings();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Add watermark if enabled
    addWatermark(doc, pdfSettings.watermark);

    // Add header
    let currentY = drawHeader(doc, companySettings, 'INVOICE', pdfSettings);

    // Invoice details section
    currentY += 10;

    // Bill To card
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...pdfSettings.colors.border);
    doc.setLineWidth(1);
    doc.rect(20, currentY, pageWidth - 40, 25, 'FD');

    doc.setFontSize(pdfSettings.fonts.normal.size);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...pdfSettings.colors.primary);
    doc.text('BILL TO:', 25, currentY + 10);

    doc.setTextColor(...pdfSettings.colors.dark);
    doc.text(invoice.clientName, 25, currentY + 18);

    currentY += 35;

    // Invoice metadata grid
    doc.setFillColor(...pdfSettings.colors.background);
    doc.rect(20, currentY, pageWidth - 40, 30, 'F');
    doc.setDrawColor(...pdfSettings.colors.border);
    doc.rect(20, currentY, pageWidth - 40, 30);

    const metaData = [
      { label: 'Invoice Number', value: invoice.invoiceNumber },
      { label: 'Issue Date', value: new Date().toLocaleDateString() },
      { label: 'Due Date', value: invoice.dueDate || 'Upon receipt' },
      { label: 'Status', value: invoice.status }
    ];

    doc.setFontSize(pdfSettings.fonts.small.size);
    let metaX = 30;
    const metaWidth = (pageWidth - 60) / 4;

    metaData.forEach((item, index) => {
      doc.setTextColor(...pdfSettings.colors.secondary);
      doc.setFont(undefined, 'normal');
      doc.text(item.label, metaX, currentY + 12);

      // Status color coding
      if (item.label === 'Status') {
        if (item.value === 'Paid') {
          doc.setTextColor(34, 197, 94);
        } else if (item.value === 'Overdue') {
          doc.setTextColor(239, 68, 68);
        } else {
          doc.setTextColor(245, 158, 11);
        }
      } else {
        doc.setTextColor(...pdfSettings.colors.dark);
      }

      doc.setFont(undefined, 'bold');
      doc.text(item.value, metaX, currentY + 20);
      metaX += metaWidth;
    });

    currentY += 40;

    // Items table header
    doc.setFillColor(...pdfSettings.colors.dark);
    doc.rect(20, currentY, pageWidth - 40, 12, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(pdfSettings.fonts.normal.size);
    doc.setFont(undefined, 'bold');
    doc.text('DESCRIPTION', 25, currentY + 8);
    doc.text('QTY', pageWidth - 120, currentY + 8, { align: 'center' });
    doc.text('RATE', pageWidth - 80, currentY + 8, { align: 'center' });
    doc.text('AMOUNT', pageWidth - 30, currentY + 8, { align: 'right' });

    currentY += 12;

    // Items rows
    let subtotal = 0;
    if (invoice.selectedProducts && invoice.selectedProducts.length > 0) {
      invoice.selectedProducts.forEach((product, index) => {
        const isEven = index % 2 === 0;
        if (isEven) {
          doc.setFillColor(...pdfSettings.colors.background);
          doc.rect(20, currentY, pageWidth - 40, 12, 'F');
        }

        const quantity = product.quantity || 1;
        const price = parseFloat(product.price) || 0;
        const total = price * quantity;
        subtotal += total;

        doc.setTextColor(...pdfSettings.colors.dark);
        doc.setFontSize(pdfSettings.fonts.normal.size);
        doc.setFont(undefined, 'normal');
        doc.text(product.name || 'Product', 25, currentY + 8);
        doc.text(quantity.toString(), pageWidth - 120, currentY + 8, { align: 'center' });
        doc.text(`£${price.toFixed(2)}`, pageWidth - 80, currentY + 8, { align: 'center' });
        doc.text(`£${total.toFixed(2)}`, pageWidth - 30, currentY + 8, { align: 'right' });

        currentY += 12;
      });
    } else {
      subtotal = parseFloat(invoice.amount) || 0;
      doc.setTextColor(...pdfSettings.colors.dark);
      doc.setFontSize(pdfSettings.fonts.normal.size);
      doc.text('Service/Product', 25, currentY + 8);
      doc.text('1', pageWidth - 120, currentY + 8, { align: 'center' });
      doc.text(`£${subtotal.toFixed(2)}`, pageWidth - 80, currentY + 8, { align: 'center' });
      doc.text(`£${subtotal.toFixed(2)}`, pageWidth - 30, currentY + 8, { align: 'right' });
      currentY += 12;
    }

    // Totals section
    currentY += 10;
    const totalsX = pageWidth - 90;
    const totalsWidth = 70;

    const vatRate = parseFloat(invoice.vat) || 0;
    const vatAmount = subtotal * (vatRate / 100);
    const totalAmount = subtotal + vatAmount;

    // Subtotal
    doc.setFillColor(...pdfSettings.colors.background);
    doc.rect(totalsX, currentY, totalsWidth, 10, 'F');
    doc.setDrawColor(...pdfSettings.colors.border);
    doc.rect(totalsX, currentY, totalsWidth, 10);

    doc.setFontSize(pdfSettings.fonts.small.size);
    doc.setTextColor(...pdfSettings.colors.secondary);
    doc.text('Subtotal:', totalsX + 5, currentY + 7);
    doc.setTextColor(...pdfSettings.colors.dark);
    doc.setFont(undefined, 'bold');
    doc.text(`£${subtotal.toFixed(2)}`, pageWidth - 25, currentY + 7, { align: 'right' });

    // VAT (if applicable)
    if (vatRate > 0) {
      currentY += 10;
      doc.setFillColor(255, 255, 255);
      doc.rect(totalsX, currentY, totalsWidth, 10, 'F');
      doc.rect(totalsX, currentY, totalsWidth, 10);

      doc.setFont(undefined, 'normal');
      doc.setTextColor(...pdfSettings.colors.secondary);
      doc.text(`VAT (${vatRate}%):`, totalsX + 5, currentY + 7);
      doc.setTextColor(...pdfSettings.colors.dark);
      doc.setFont(undefined, 'bold');
      doc.text(`£${vatAmount.toFixed(2)}`, pageWidth - 25, currentY + 7, { align: 'right' });
    }

    // Total
    currentY += 10;
    doc.setFillColor(...pdfSettings.colors.primary);
    doc.rect(totalsX, currentY, totalsWidth, 12, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(pdfSettings.fonts.normal.size);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL:', totalsX + 5, currentY + 8);
    doc.setFontSize(pdfSettings.fonts.heading.size);
    doc.text(`£${totalAmount.toFixed(2)}`, pageWidth - 25, currentY + 8, { align: 'right' });

    currentY += 20;

    // Notes section (if any)
    if (invoice.notes) {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...pdfSettings.colors.border);
      doc.rect(20, currentY, pageWidth - 40, 25, 'FD');

      doc.setFontSize(pdfSettings.fonts.normal.size);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...pdfSettings.colors.primary);
      doc.text('NOTES & TERMS', 25, currentY + 10);

      doc.setTextColor(...pdfSettings.colors.dark);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(pdfSettings.fonts.small.size);
      const notes = doc.splitTextToSize(invoice.notes, pageWidth - 50);
      doc.text(notes, 25, currentY + 18);
      currentY += 30;
    }

    // Add footer
    drawFooter(doc, companySettings, currentY, pdfSettings, 'Thank you for your business!');

    console.log('PDF generation completed successfully');
    return doc;
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    throw error;
  }
};

// Quote PDF Template
const generateQuotePDF = async (quote, companySettings) => {
  try {
    if (!quote) {
      throw new Error('Quote data is required');
    }

    console.log('Quote PDF - Company settings received:', companySettings);
    const pdfSettings = await fetchPDFSettings();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Add watermark if enabled
    addWatermark(doc, pdfSettings.watermark);

    // Add header with company settings and logo
    let currentY = drawHeader(doc, companySettings, 'QUOTE', pdfSettings);

    // Quote details section
    currentY += 10;

    // Quote To card
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...pdfSettings.colors.border);
    doc.setLineWidth(1);
    doc.rect(20, currentY, pageWidth - 40, 25, 'FD');

    doc.setFontSize(pdfSettings.fonts.normal.size);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...pdfSettings.colors.primary);
    doc.text('QUOTE FOR:', 25, currentY + 10);

    doc.setTextColor(...pdfSettings.colors.dark);
    doc.text(quote.clientName, 25, currentY + 18);

    currentY += 35;

    // Quote metadata grid
    doc.setFillColor(...pdfSettings.colors.background);
    doc.rect(20, currentY, pageWidth - 40, 30, 'F');
    doc.setDrawColor(...pdfSettings.colors.border);
    doc.rect(20, currentY, pageWidth - 40, 30);

    const metaData = [
      { label: 'Quote Number', value: quote.quoteNumber },
      { label: 'Issue Date', value: new Date().toLocaleDateString() },
      { label: 'Valid Until', value: quote.validUntil || 'Upon acceptance' },
      { label: 'Status', value: quote.status }
    ];

    doc.setFontSize(pdfSettings.fonts.small.size);
    let metaX = 30;
    const metaWidth = (pageWidth - 60) / 4;

    metaData.forEach((item, index) => {
      doc.setTextColor(...pdfSettings.colors.secondary);
      doc.setFont(undefined, 'normal');
      doc.text(item.label, metaX, currentY + 12);

      // Status color coding
      if (item.label === 'Status') {
        if (item.value === 'Accepted') {
          doc.setTextColor(34, 197, 94);
        } else if (item.value === 'Rejected') {
          doc.setTextColor(239, 68, 68);
        } else {
          doc.setTextColor(245, 158, 11);
        }
      } else {
        doc.setTextColor(...pdfSettings.colors.dark);
      }

      doc.setFont(undefined, 'bold');
      doc.text(item.value, metaX, currentY + 20);
      metaX += metaWidth;
    });

    currentY += 40;

    // Service description section
    doc.setFillColor(...pdfSettings.colors.dark);
    doc.rect(20, currentY, pageWidth - 40, 12, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(pdfSettings.fonts.normal.size);
    doc.setFont(undefined, 'bold');
    doc.text('DESCRIPTION', 25, currentY + 8);
    doc.text('AMOUNT', pageWidth - 30, currentY + 8, { align: 'right' });

    currentY += 12;

    // Service line
    doc.setFillColor(...pdfSettings.colors.background);
    doc.rect(20, currentY, pageWidth - 40, 15, 'F');

    doc.setTextColor(...pdfSettings.colors.dark);
    doc.setFontSize(pdfSettings.fonts.normal.size);
    doc.setFont(undefined, 'normal');
    doc.text(quote.productName || 'Professional Services', 25, currentY + 10);
    doc.text(`£${Number(quote.amount).toFixed(2)}`, pageWidth - 30, currentY + 10, { align: 'right' });

    currentY += 25;

    // Totals section
    const totalsX = pageWidth - 90;
    const totalsWidth = 70;

    const subtotal = parseFloat(quote.amount) || 0;
    const vatRate = parseFloat(quote.vat) || 0;
    const vatAmount = subtotal * (vatRate / 100);
    const totalAmount = subtotal + vatAmount;

    // Subtotal
    doc.setFillColor(...pdfSettings.colors.background);
    doc.rect(totalsX, currentY, totalsWidth, 10, 'F');
    doc.setDrawColor(...pdfSettings.colors.border);
    doc.rect(totalsX, currentY, totalsWidth, 10);

    doc.setFontSize(pdfSettings.fonts.small.size);
    doc.setTextColor(...pdfSettings.colors.secondary);
    doc.text('Subtotal:', totalsX + 5, currentY + 7);
    doc.setTextColor(...pdfSettings.colors.dark);
    doc.setFont(undefined, 'bold');
    doc.text(`£${subtotal.toFixed(2)}`, pageWidth - 25, currentY + 7, { align: 'right' });

    // VAT (if applicable)
    if (vatRate > 0) {
      currentY += 10;
      doc.setFillColor(255, 255, 255);
      doc.rect(totalsX, currentY, totalsWidth, 10, 'F');
      doc.rect(totalsX, currentY, totalsWidth, 10);

      doc.setFont(undefined, 'normal');
      doc.setTextColor(...pdfSettings.colors.secondary);
      doc.text(`VAT (${vatRate}%):`, totalsX + 5, currentY + 7);
      doc.setTextColor(...pdfSettings.colors.dark);
      doc.setFont(undefined, 'bold');
      doc.text(`£${vatAmount.toFixed(2)}`, pageWidth - 25, currentY + 7, { align: 'right' });
    }

    // Total
    currentY += 10;
    doc.setFillColor(...pdfSettings.colors.primary);
    doc.rect(totalsX, currentY, totalsWidth, 12, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(pdfSettings.fonts.normal.size);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL:', totalsX + 5, currentY + 8);
    doc.setFontSize(pdfSettings.fonts.heading.size);
    doc.text(`£${totalAmount.toFixed(2)}`, pageWidth - 25, currentY + 8, { align: 'right' });

    currentY += 20;

    // Notes section (if any)
    if (quote.notes) {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...pdfSettings.colors.border);
      doc.rect(20, currentY, pageWidth - 40, 25, 'FD');

      doc.setFontSize(pdfSettings.fonts.normal.size);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...pdfSettings.colors.primary);
      doc.text('NOTES & TERMS', 25, currentY + 10);

      doc.setTextColor(...pdfSettings.colors.dark);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(pdfSettings.fonts.small.size);
      const notes = doc.splitTextToSize(quote.notes, pageWidth - 50);
      doc.text(notes, 25, currentY + 18);
      currentY += 30;
    }

    // Add footer
    drawFooter(doc, companySettings, currentY, pdfSettings, 'Thank you for considering our services!');

    console.log('Quote PDF generation completed successfully');
    return doc;
  } catch (error) {
    console.error('Error generating quote PDF:', error);
    throw error;
  }
};

// Statement PDF Template
const generateStatementPDF = async (client, invoices, companySettings, period = 'full') => {
  try {
    console.log('Statement PDF - Company settings received:', companySettings);
    const pdfSettings = await fetchPDFSettings();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Add watermark if enabled
    addWatermark(doc, pdfSettings.watermark);

    // Add header with company settings and logo
    let currentY = drawHeader(doc, companySettings, 'STATEMENT', pdfSettings);

    // Statement details section
    currentY += 10;

    // Statement For card
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...pdfSettings.colors.border);
    doc.setLineWidth(1);
    doc.rect(20, currentY, pageWidth - 40, 25, 'FD');

    doc.setFontSize(pdfSettings.fonts.normal.size);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...pdfSettings.colors.primary);
    doc.text('STATEMENT FOR:', 25, currentY + 10);

    doc.setTextColor(...pdfSettings.colors.dark);
    doc.text(client.name, 25, currentY + 18);

    currentY += 35;

    // Statement metadata
    doc.setFillColor(...pdfSettings.colors.background);
    doc.rect(20, currentY, pageWidth - 40, 20, 'F');
    doc.setDrawColor(...pdfSettings.colors.border);
    doc.rect(20, currentY, pageWidth - 40, 20);

    doc.setFontSize(pdfSettings.fonts.small.size);
    doc.setTextColor(...pdfSettings.colors.secondary);
    doc.text(`Period: ${period === 'full' ? 'All Time' : period}`, 25, currentY + 8);
    doc.text(`Statement Date: ${new Date().toLocaleDateString()}`, 25, currentY + 15);
    doc.text(`Total Invoices: ${invoices.length}`, pageWidth - 25, currentY + 8, { align: 'right' });
    if (client.email) {
      doc.text(`Email: ${client.email}`, pageWidth - 25, currentY + 15, { align: 'right' });
    }

    currentY += 30;

    // Calculate totals
    const totalAmount = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const paidAmount = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const unpaidAmount = invoices.filter(inv => inv.status === 'Unpaid').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const overdueAmount = invoices.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

    // Account summary section
    doc.setFillColor(...pdfSettings.colors.dark);
    doc.rect(20, currentY, pageWidth - 40, 12, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(pdfSettings.fonts.normal.size);
    doc.setFont(undefined, 'bold');
    doc.text('ACCOUNT SUMMARY', 25, currentY + 8);

    currentY += 12;

    const summaryItems = [
      { label: 'Total Amount', value: `£${totalAmount.toFixed(2)}`, color: pdfSettings.colors.dark },
      { label: 'Paid', value: `£${paidAmount.toFixed(2)}`, color: [34, 197, 94] },
      { label: 'Unpaid', value: `£${unpaidAmount.toFixed(2)}`, color: [245, 158, 11] }
    ];

    if (overdueAmount > 0) {
      summaryItems.push({ label: 'Overdue', value: `£${overdueAmount.toFixed(2)}`, color: [239, 68, 68] });
    }

    summaryItems.forEach((item, index) => {
      const isEven = index % 2 === 0;
      doc.setFillColor(...(isEven ? pdfSettings.colors.background : [255, 255, 255]));
      doc.rect(20, currentY, pageWidth - 40, 10, 'F');

      doc.setFontSize(pdfSettings.fonts.small.size);
      doc.setTextColor(...item.color);
      doc.setFont(undefined, 'normal');
      doc.text(item.label, 25, currentY + 7);
      doc.setFont(undefined, 'bold');
      doc.text(item.value, pageWidth - 25, currentY + 7, { align: 'right' });

      currentY += 10;
    });

    currentY += 10;

    // Invoices table
    doc.setFillColor(...pdfSettings.colors.dark);
    doc.rect(20, currentY, pageWidth - 40, 12, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(pdfSettings.fonts.small.size);
    doc.setFont(undefined, 'bold');
    doc.text('INVOICE #', 25, currentY + 8);
    doc.text('DATE', 70, currentY + 8);
    doc.text('DUE DATE', 110, currentY + 8);
    doc.text('STATUS', 150, currentY + 8);
    doc.text('AMOUNT', pageWidth - 25, currentY + 8, { align: 'right' });

    currentY += 12;

    // Invoice rows
    invoices.forEach((invoice, index) => {
      if (currentY > 250) {
        doc.addPage();
        addWatermark(doc, pdfSettings.watermark);
        currentY = 30;
      }

      const isEven = index % 2 === 0;
      doc.setFillColor(...(isEven ? pdfSettings.colors.background : [255, 255, 255]));
      doc.rect(20, currentY, pageWidth - 40, 10, 'F');

      doc.setFontSize(pdfSettings.fonts.tiny.size);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...pdfSettings.colors.dark);
      doc.text(invoice.invoiceNumber || 'N/A', 25, currentY + 7);
      doc.text(invoice.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A', 70, currentY + 7);
      doc.text(invoice.dueDate || 'N/A', 110, currentY + 7);

      // Status with color
      if (invoice.status === 'Paid') {
        doc.setTextColor(34, 197, 94);
      } else if (invoice.status === 'Overdue') {
        doc.setTextColor(239, 68, 68);
      } else {
        doc.setTextColor(245, 158, 11);
      }
      doc.text(invoice.status || 'Unpaid', 150, currentY + 7);

      doc.setTextColor(...pdfSettings.colors.dark);
      doc.text(`£${(parseFloat(invoice.amount) || 0).toFixed(2)}`, pageWidth - 25, currentY + 7, { align: 'right' });

      currentY += 10;
    });

    // Add footer
    drawFooter(doc, companySettings, currentY, pdfSettings, 'Thank you for your continued business!');

    console.log('Statement PDF generation completed successfully');
    return doc;
  } catch (error) {
    console.error('Error generating statement PDF:', error);
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
        // const doc = await generateInvoicePDF(invoice, companySettings);
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
        // const doc = await generateQuotePDF(quote, companySettings);
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
        // const doc = await generateStatementPDF(client, invoices, companySettings, period);
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
  generateInvoicePDF,
  generateQuotePDF, 
  generateStatementPDF,
  sendInvoiceViaEmail, 
  sendQuoteViaEmail,
  sendClientStatementViaEmail,
  drawHeader,
  drawFooter
};