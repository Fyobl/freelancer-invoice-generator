
import jsPDF from 'jspdf';

// Enhanced PDF generation with modern styling and gradients
const createStyledPDF = (type, data, companySettings) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Color scheme matching website theme
  const primaryColor = '#667eea';
  const secondaryColor = '#764ba2';
  const accentColor = '#28a745';
  const textDark = '#333333';
  const textLight = '#666666';
  const backgroundLight = '#f8f9fa';

  // Helper function to create gradient effect (simulated with overlapping rectangles)
  const createGradientHeader = () => {
    // Primary gradient background
    doc.setFillColor(102, 126, 234); // #667eea
    doc.rect(0, 0, pageWidth, 60, 'F');
    
    // Secondary gradient overlay with transparency effect
    doc.setFillColor(118, 75, 162); // #764ba2
    doc.rect(pageWidth * 0.6, 0, pageWidth * 0.4, 60, 'F');
    
    // Decorative accent line
    doc.setFillColor(40, 167, 69); // #28a745
    doc.rect(0, 55, pageWidth, 2, 'F');
  };

  // Helper function for section headers
  const createSectionHeader = (y, title, icon) => {
    // Background bar
    doc.setFillColor(248, 249, 250); // Light background
    doc.rect(15, y - 5, pageWidth - 30, 20, 'F');
    
    // Accent line
    doc.setFillColor(102, 126, 234);
    doc.rect(15, y - 5, 4, 20, 'F');
    
    // Title text
    doc.setFontSize(14);
    doc.setTextColor(51, 51, 51);
    doc.setFont('helvetica', 'bold');
    doc.text(`${icon} ${title}`, 25, y + 7);
  };

  // Helper function for table styling
  const createStyledTable = (startY, headers, rows, colWidths) => {
    let currentY = startY;
    
    // Table header
    doc.setFillColor(102, 126, 234);
    doc.rect(15, currentY, pageWidth - 30, 12, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    
    let x = 20;
    headers.forEach((header, index) => {
      doc.text(header, x, currentY + 8);
      x += colWidths[index];
    });
    
    currentY += 12;
    
    // Table rows
    rows.forEach((row, rowIndex) => {
      const isEven = rowIndex % 2 === 0;
      if (isEven) {
        doc.setFillColor(248, 249, 250);
        doc.rect(15, currentY, pageWidth - 30, 10, 'F');
      }
      
      doc.setTextColor(51, 51, 51);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      let x = 20;
      row.forEach((cell, cellIndex) => {
        doc.text(String(cell), x, currentY + 7);
        x += colWidths[cellIndex];
      });
      
      currentY += 10;
    });
    
    return currentY;
  };

  // Create header with gradient
  createGradientHeader();

  // Company logo/name in header
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  const companyName = companySettings?.companyName || 'Your Company';
  doc.text(companyName, 20, 25);

  // Document type and number
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  const docNumber = data.invoiceNumber || data.quoteNumber || 'DOC-001';
  doc.text(`${type.toUpperCase()} ${docNumber}`, 20, 40);

  // Date
  doc.setFontSize(10);
  const currentDate = new Date().toLocaleDateString();
  doc.text(`Date: ${currentDate}`, pageWidth - 60, 40);

  let currentY = 80;

  // Company Information Section
  createSectionHeader(currentY, 'Company Information', '🏢');
  currentY += 25;

  doc.setFontSize(10);
  doc.setTextColor(51, 51, 51);
  doc.setFont('helvetica', 'normal');

  const companyInfo = [
    companySettings?.companyName || 'Your Company',
    companySettings?.address || 'Company Address',
    companySettings?.city ? `${companySettings.city}, ${companySettings.postalCode || ''}` : 'City, Postal Code',
    companySettings?.phone || 'Phone Number',
    companySettings?.email || 'company@email.com'
  ].filter(info => info && info.trim() !== '');

  companyInfo.forEach((info, index) => {
    doc.text(info, 20, currentY + (index * 6));
  });

  currentY += (companyInfo.length * 6) + 15;

  // Client Information Section
  if (type !== 'statement') {
    createSectionHeader(currentY, 'Bill To', '👤');
    currentY += 25;

    const clientName = data.clientName || 'Client Name';
    doc.setFont('helvetica', 'bold');
    doc.text(clientName, 20, currentY);
    
    if (data.dueDate) {
      doc.setFont('helvetica', 'normal');
      doc.text(`Due Date: ${data.dueDate}`, 20, currentY + 10);
      currentY += 20;
    } else {
      currentY += 15;
    }
    currentY += 10;
  }

  // Content based on document type
  if (type === 'invoice') {
    // Invoice Items Section
    createSectionHeader(currentY, 'Invoice Details', '📋');
    currentY += 25;

    const items = [];
    
    if (data.selectedProducts && data.selectedProducts.length > 0) {
      data.selectedProducts.forEach(product => {
        const quantity = product.quantity || 1;
        const price = parseFloat(product.price) || 0;
        const total = quantity * price;
        items.push([
          product.name || 'Product',
          quantity.toString(),
          `£${price.toFixed(2)}`,
          `£${total.toFixed(2)}`
        ]);
      });
    } else {
      items.push([
        'Service/Product',
        '1',
        `£${parseFloat(data.amount || 0).toFixed(2)}`,
        `£${parseFloat(data.amount || 0).toFixed(2)}`
      ]);
    }

    const headers = ['Description', 'Qty', 'Price', 'Total'];
    const colWidths = [80, 20, 30, 30];
    
    currentY = createStyledTable(currentY, headers, items, colWidths);
    currentY += 15;

    // Totals Section
    const subtotal = parseFloat(data.amount || 0);
    const vatRate = parseFloat(data.vat || 0);
    const vatAmount = (subtotal * vatRate) / 100;
    const total = subtotal + vatAmount;

    // Totals box
    const totalsX = pageWidth - 80;
    doc.setFillColor(248, 249, 250);
    doc.rect(totalsX - 10, currentY, 70, 40, 'F');
    
    doc.setFillColor(102, 126, 234);
    doc.rect(totalsX - 10, currentY, 70, 3, 'F');

    doc.setFontSize(10);
    doc.setTextColor(51, 51, 51);
    doc.setFont('helvetica', 'normal');
    
    doc.text('Subtotal:', totalsX, currentY + 12);
    doc.text(`£${subtotal.toFixed(2)}`, totalsX + 35, currentY + 12);
    
    if (vatRate > 0) {
      doc.text(`VAT (${vatRate}%):`, totalsX, currentY + 22);
      doc.text(`£${vatAmount.toFixed(2)}`, totalsX + 35, currentY + 22);
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total:', totalsX, currentY + 32);
    doc.text(`£${total.toFixed(2)}`, totalsX + 35, currentY + 32);

  } else if (type === 'quote') {
    // Quote Items Section
    createSectionHeader(currentY, 'Quote Details', '💰');
    currentY += 25;

    const items = [];
    
    if (data.selectedProducts && data.selectedProducts.length > 0) {
      data.selectedProducts.forEach(product => {
        const quantity = product.quantity || 1;
        const price = parseFloat(product.price) || 0;
        const total = quantity * price;
        items.push([
          product.name || 'Product',
          quantity.toString(),
          `£${price.toFixed(2)}`,
          `£${total.toFixed(2)}`
        ]);
      });
    } else {
      items.push([
        'Service/Product',
        '1',
        `£${parseFloat(data.amount || 0).toFixed(2)}`,
        `£${parseFloat(data.amount || 0).toFixed(2)}`
      ]);
    }

    const headers = ['Description', 'Qty', 'Price', 'Total'];
    const colWidths = [80, 20, 30, 30];
    
    currentY = createStyledTable(currentY, headers, items, colWidths);
    currentY += 15;

    // Quote Total
    const totalsX = pageWidth - 80;
    doc.setFillColor(40, 167, 69);
    doc.rect(totalsX - 10, currentY, 70, 25, 'F');
    
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Quote Total:', totalsX, currentY + 12);
    doc.text(`£${parseFloat(data.amount || 0).toFixed(2)}`, totalsX + 5, currentY + 22);

    currentY += 35;

    // Quote validity
    if (data.validUntil) {
      doc.setFontSize(10);
      doc.setTextColor(118, 75, 162);
      doc.setFont('helvetica', 'italic');
      doc.text(`This quote is valid until: ${data.validUntil}`, 20, currentY);
    }

  } else if (type === 'statement') {
    // Statement Period Section
    createSectionHeader(currentY, 'Statement Period', '📊');
    currentY += 25;

    doc.setFontSize(10);
    doc.setTextColor(51, 51, 51);
    doc.setFont('helvetica', 'normal');
    doc.text(`Period: ${data.period || 'Current Month'}`, 20, currentY);
    doc.text(`Statement Date: ${currentDate}`, 20, currentY + 10);
    currentY += 25;

    // Invoice Summary
    if (data.invoices && data.invoices.length > 0) {
      createSectionHeader(currentY, 'Invoice Summary', '📋');
      currentY += 25;

      const invoiceRows = data.invoices.map(invoice => [
        invoice.invoiceNumber || 'N/A',
        invoice.date || 'N/A',
        invoice.status || 'Unknown',
        `£${parseFloat(invoice.amount || 0).toFixed(2)}`
      ]);

      const headers = ['Invoice #', 'Date', 'Status', 'Amount'];
      const colWidths = [40, 35, 35, 35];
      
      currentY = createStyledTable(currentY, headers, invoiceRows, colWidths);
      currentY += 15;

      // Statement Summary
      const totalAmount = data.invoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
      const paidAmount = data.invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
      const unpaidAmount = totalAmount - paidAmount;

      const summaryX = pageWidth - 90;
      doc.setFillColor(248, 249, 250);
      doc.rect(summaryX - 10, currentY, 85, 45, 'F');
      
      doc.setFillColor(102, 126, 234);
      doc.rect(summaryX - 10, currentY, 85, 3, 'F');

      doc.setFontSize(10);
      doc.setTextColor(51, 51, 51);
      doc.setFont('helvetica', 'normal');
      
      doc.text('Total Invoiced:', summaryX, currentY + 12);
      doc.text(`£${totalAmount.toFixed(2)}`, summaryX + 45, currentY + 12);
      
      doc.text('Amount Paid:', summaryX, currentY + 22);
      doc.text(`£${paidAmount.toFixed(2)}`, summaryX + 45, currentY + 22);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 53, 69);
      doc.text('Outstanding:', summaryX, currentY + 32);
      doc.text(`£${unpaidAmount.toFixed(2)}`, summaryX + 45, currentY + 32);
    }
  }

  // Notes Section
  if (data.notes && data.notes.trim()) {
    currentY = Math.max(currentY + 20, pageHeight - 80);
    
    createSectionHeader(currentY, 'Notes', '📝');
    currentY += 25;

    doc.setFontSize(9);
    doc.setTextColor(102, 102, 102);
    doc.setFont('helvetica', 'normal');
    
    const noteLines = doc.splitTextToSize(data.notes, pageWidth - 40);
    noteLines.forEach((line, index) => {
      doc.text(line, 20, currentY + (index * 5));
    });
  }

  // Footer
  const footerY = pageHeight - 25;
  
  // Footer gradient line
  doc.setFillColor(102, 126, 234);
  doc.rect(0, footerY - 5, pageWidth, 2, 'F');
  
  doc.setFontSize(8);
  doc.setTextColor(102, 102, 102);
  doc.setFont('helvetica', 'italic');
  
  const footerText = companySettings?.footerText || 'Thank you for your business!';
  doc.text(footerText, 20, footerY);
  
  // Page number and generation info
  doc.text(`Generated on ${currentDate}`, pageWidth - 60, footerY);

  return doc;
};

// Export functions for each document type
export const generateInvoicePDF = (invoiceData, companySettings) => {
  return createStyledPDF('invoice', invoiceData, companySettings);
};

export const generateQuotePDF = (quoteData, companySettings) => {
  return createStyledPDF('quote', quoteData, companySettings);
};

export const generateStatementPDF = (statementData, companySettings) => {
  return createStyledPDF('statement', statementData, companySettings);
};
