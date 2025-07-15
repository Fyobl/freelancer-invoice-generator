import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Global logo cache
let logoCache = new Map();

// Process and cache logo image
const processLogoImage = async (logoUrl) => {
  if (!logoUrl) return null;

  // Check cache first
  if (logoCache.has(logoUrl)) {
    return logoCache.get(logoUrl);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image to canvas
        ctx.drawImage(img, 0, 0);

        // Get base64 data
        const dataURL = canvas.toDataURL('image/png');

        const logoInfo = {
          dataURL,
          width: img.width,
          height: img.height
        };

        // Cache the processed logo
        logoCache.set(logoUrl, logoInfo);
        resolve(logoInfo);
      } catch (error) {
        console.error('Error processing logo:', error);
        resolve(null);
      }
    };

    img.onerror = () => {
      console.error('Error loading logo image');
      resolve(null);
    };

    img.src = logoUrl;
  });
};

// Common header function
const addHeader = (doc, logoInfo, companySettings, documentType, documentNumber) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Add logo if available
  if (logoInfo && logoInfo.dataURL) {
    const logoWidth = 60;
    const logoHeight = (logoInfo.height / logoInfo.width) * logoWidth;
    doc.addImage(logoInfo.dataURL, 'PNG', 20, 20, logoWidth, logoHeight);
  }

  // Document type (INVOICE, QUOTE, STATEMENT)
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(102, 126, 234); // Purple color
  doc.text(documentType, pageWidth / 2, 50, { align: 'center' });

  // Company details (right side)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  let yPos = 20;

  if (companySettings.name) {
    doc.text(companySettings.name, pageWidth - 20, yPos, { align: 'right' });
    yPos += 7;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  if (companySettings.email) {
    doc.text(companySettings.email, pageWidth - 20, yPos, { align: 'right' });
    yPos += 5;
  }

  if (companySettings.phone) {
    doc.text(companySettings.phone, pageWidth - 20, yPos, { align: 'right' });
    yPos += 5;
  }

  if (companySettings.address) {
    doc.text(companySettings.address, pageWidth - 20, yPos, { align: 'right' });
    yPos += 5;
  }

  if (companySettings.city || companySettings.postcode) {
    const cityPostcode = [companySettings.city, companySettings.postcode].filter(Boolean).join(', ');
    doc.text(cityPostcode, pageWidth - 20, yPos, { align: 'right' });
    yPos += 5;
  }

  if (companySettings.country) {
    doc.text(companySettings.country, pageWidth - 20, yPos, { align: 'right' });
  }

  return 80; // Return Y position for next content
};

// Generate Invoice PDF
export const generateInvoicePDF = async (invoice, companySettings = {}, clientData = null, logoInfo = null) => {
  try {
    const doc = new jsPDF();

    // Add header
    let currentY = addHeader(doc, logoInfo, companySettings, 'INVOICE', invoice.invoiceNumber);

    // Bill To section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(102, 126, 234);
    doc.text('BILL TO:', 20, currentY);

    currentY += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(invoice.clientName, 20, currentY);

    if (clientData && clientData.email) {
      currentY += 7;
      doc.text(clientData.email, 20, currentY);
    }

    if (clientData && clientData.address) {
      currentY += 7;
      doc.text(clientData.address, 20, currentY);
    }

    // Invoice details table
    currentY += 30;
    const invoiceDetailsData = [
      ['Invoice Number', 'Issue Date', 'Due Date', 'Status'],
      [
        invoice.invoiceNumber || 'N/A',
        invoice.createdAt ? new Date(invoice.createdAt.seconds * 1000).toLocaleDateString() : 'N/A',
        invoice.dueDate || 'N/A',
        invoice.status || 'N/A'
      ]
    ];

    doc.autoTable({
      startY: currentY,
      head: [invoiceDetailsData[0]],
      body: [invoiceDetailsData[1]],
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
      styles: { fontSize: 10 }
    });

    currentY = doc.lastAutoTable.finalY + 20;

    // Items table
    let itemsData = [];
    if (invoice.selectedProducts && invoice.selectedProducts.length > 0) {
      itemsData = invoice.selectedProducts.map(product => [
        product.name,
        product.quantity.toString(),
        `£${product.price.toFixed(2)}`,
        `£${(product.price * product.quantity).toFixed(2)}`
      ]);
    } else {
      itemsData = [['Service', '1', `£${parseFloat(invoice.amount).toFixed(2)}`, `£${parseFloat(invoice.amount).toFixed(2)}`]];
    }

    doc.autoTable({
      startY: currentY,
      head: [['DESCRIPTION', 'QTY', 'RATE', 'AMOUNT']],
      body: itemsData,
      theme: 'grid',
      headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255] },
      styles: { fontSize: 10 }
    });

    currentY = doc.lastAutoTable.finalY + 10;

    // Totals
    const amount = parseFloat(invoice.amount) || 0;
    const vatRate = parseFloat(invoice.vat) || 0;
    const vatAmount = amount * (vatRate / 100);
    const total = amount + vatAmount;

    const pageWidth = doc.internal.pageSize.getWidth();
    const totalsX = pageWidth - 100;

    doc.setFontSize(10);
    doc.text('Subtotal:', totalsX, currentY);
    doc.text(`£${amount.toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' });

    if (vatRate > 0) {
      currentY += 7;
      doc.text(`VAT (${vatRate}%):`, totalsX, currentY);
      doc.text(`£${vatAmount.toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' });
    }

    currentY += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(102, 126, 234);
    doc.rect(totalsX - 10, currentY - 8, 110, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL:', totalsX, currentY);
    doc.text(`£${total.toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' });

    // Notes
    if (invoice.notes) {
      currentY += 30;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Notes:', 20, currentY);
      currentY += 7;
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.notes, 20, currentY);
    }

    return doc;
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    throw error;
  }
};

// Generate Quote PDF
const generateQuotePDF = async (quote, companySettings, clientData = null, logoInfo = null) => {
  try {
    const doc = new jsPDF();

    // Add header
    let currentY = addHeader(doc, logoInfo, companySettings, 'QUOTE', quote.quoteNumber);

    // Bill To section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(102, 126, 234);
    doc.text('QUOTE FOR:', 20, currentY);

    currentY += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(quote.clientName, 20, currentY);

    if (clientData && clientData.email) {
      currentY += 7;
      doc.text(clientData.email, 20, currentY);
    }

    if (clientData && clientData.address) {
      currentY += 7;
      doc.text(clientData.address, 20, currentY);
    }

    // Quote details table
    currentY += 30;
    const quoteDetailsData = [
      ['Quote Number', 'Issue Date', 'Valid Until', 'Status'],
      [
        quote.quoteNumber || 'N/A',
        quote.createdAt ? new Date(quote.createdAt.seconds * 1000).toLocaleDateString() : 'N/A',
        quote.validUntil || 'N/A',
        quote.status || 'N/A'
      ]
    ];

    doc.autoTable({
      startY: currentY,
      head: [quoteDetailsData[0]],
      body: [quoteDetailsData[1]],
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
      styles: { fontSize: 10 }
    });

    currentY = doc.lastAutoTable.finalY + 20;

    // Items table
    let itemsData = [];
    if (quote.selectedProducts && quote.selectedProducts.length > 0) {
      itemsData = quote.selectedProducts.map(product => [
        product.name,
        product.quantity.toString(),
        `£${product.price.toFixed(2)}`,
        `£${(product.price * product.quantity).toFixed(2)}`
      ]);
    } else {
      itemsData = [['Service', '1', `£${parseFloat(quote.amount).toFixed(2)}`, `£${parseFloat(quote.amount).toFixed(2)}`]];
    }

    doc.autoTable({
      startY: currentY,
      head: [['DESCRIPTION', 'QTY', 'RATE', 'AMOUNT']],
      body: itemsData,
      theme: 'grid',
      headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255] },
      styles: { fontSize: 10 }
    });

    currentY = doc.lastAutoTable.finalY + 10;

    // Totals
    const amount = parseFloat(quote.amount) || 0;
    const vatRate = parseFloat(quote.vat) || 0;
    const vatAmount = amount * (vatRate / 100);
    const total = amount + vatAmount;

    const pageWidth = doc.internal.pageSize.getWidth();
    const totalsX = pageWidth - 100;

    doc.setFontSize(10);
    doc.text('Subtotal:', totalsX, currentY);
    doc.text(`£${amount.toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' });

    if (vatRate > 0) {
      currentY += 7;
      doc.text(`VAT (${vatRate}%):`, totalsX, currentY);
      doc.text(`£${vatAmount.toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' });
    }

    currentY += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(102, 126, 234);
    doc.rect(totalsX - 10, currentY - 8, 110, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL:', totalsX, currentY);
    doc.text(`£${total.toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' });

    // Notes
    if (quote.notes) {
      currentY += 30;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Notes:', 20, currentY);
      currentY += 7;
      doc.setFont('helvetica', 'normal');
      doc.text(quote.notes, 20, currentY);
    }

    return doc;
  } catch (error) {
    console.error('Error generating quote PDF:', error);
    throw error;
  }
};

// Generate Statement PDF
const generateStatementPDF = async (clientData, invoices, companySettings, period = 'All Time', logoInfo = null) => {
  try {
    const doc = new jsPDF();

    // Add header
    let currentY = addHeader(doc, logoInfo, companySettings, 'STATEMENT', '');

    // Client section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(102, 126, 234);
    doc.text('STATEMENT FOR:', 20, currentY);

    currentY += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(clientData.name, 20, currentY);

    if (clientData.email) {
      currentY += 7;
      doc.text(clientData.email, 20, currentY);
    }

    if (clientData.address) {
      currentY += 7;
      doc.text(clientData.address, 20, currentY);
    }

    // Statement details
    currentY += 30;
    const statementDate = new Date().toLocaleDateString();
    const statementDetailsData = [
      ['Statement Date', 'Period', 'Total Invoices', 'Total Amount'],
      [
        statementDate,
        period === 'full' ? 'All Time' : period,
        invoices.length.toString(),
        `£${invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0).toFixed(2)}`
      ]
    ];

    doc.autoTable({
      startY: currentY,
      head: [statementDetailsData[0]],
      body: [statementDetailsData[1]],
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
      styles: { fontSize: 10 }
    });

    currentY = doc.lastAutoTable.finalY + 20;

    // Invoices table
    const invoicesData = invoices.map(invoice => [
      invoice.invoiceNumber || 'N/A',
      invoice.createdAt ? new Date(invoice.createdAt.seconds * 1000).toLocaleDateString() : 'N/A',
      invoice.dueDate || 'N/A',
      invoice.status || 'N/A',
      `£${parseFloat(invoice.amount || 0).toFixed(2)}`
    ]);

    doc.autoTable({
      startY: currentY,
      head: [['Invoice Number', 'Issue Date', 'Due Date', 'Status', 'Amount']],
      body: invoicesData,
      theme: 'grid',
      headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255] },
      styles: { fontSize: 10 }
    });

    currentY = doc.lastAutoTable.finalY + 20;

    // Summary
    const totalAmount = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const paidAmount = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const unpaidAmount = invoices.filter(inv => inv.status === 'Unpaid').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const overdueAmount = invoices.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

    const pageWidth = doc.internal.pageSize.getWidth();
    const summaryX = pageWidth - 120;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SUMMARY:', summaryX, currentY);

    currentY += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Amount:', summaryX, currentY);
    doc.text(`£${totalAmount.toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' });

    currentY += 7;
    doc.text('Paid Amount:', summaryX, currentY);
    doc.text(`£${paidAmount.toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' });

    currentY += 7;
    doc.text('Unpaid Amount:', summaryX, currentY);
    doc.text(`£${unpaidAmount.toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' });

    if (overdueAmount > 0) {
      currentY += 7;
      doc.text('Overdue Amount:', summaryX, currentY);
      doc.text(`£${overdueAmount.toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' });
    }

    return doc;
  } catch (error) {
    console.error('Error generating statement PDF:', error);
    throw error;
  }
};

// Main function to generate PDFs with logo caching
export const generatePDFWithLogo = async (type, data, companySettings, clientData = null, period = null) => {
  try {
    // Ensure companySettings exists
    if (!companySettings) {
      companySettings = {};
    }

    // Process logo if available
    const logoInfo = await processLogoImage(companySettings.logo);

    switch (type) {
      case 'invoice':
        return await generateInvoicePDF(data, companySettings, clientData, logoInfo);
      case 'quote':
        return await generateQuotePDF(data, companySettings, clientData, logoInfo);
      case 'statement':
        return await generateStatementPDF(clientData, data, companySettings, period || 'All Time', logoInfo);
      default:
        throw new Error(`Invalid PDF type: ${type}`);
    }
  } catch (error) {
    console.error(`Error generating ${type} PDF:`, error);
    throw error;
  }
};

export { processLogoImage };