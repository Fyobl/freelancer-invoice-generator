
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateInvoicePDF = async (invoice, companySettings, clientData = null) => {
  const doc = new jsPDF();
  
  // Document setup
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  
  // Colors from your theme
  const primaryColor = [102, 126, 234]; // #667eea
  const secondaryColor = [118, 75, 162]; // #764ba2
  const textColor = [51, 51, 51];
  const lightGray = [248, 249, 250];
  
  let currentY = margin;

  // Header with gradient background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 60, 'F');
  
  // Company logo
  if (companySettings?.logo) {
    try {
      doc.addImage(companySettings.logo, 'JPEG', margin, 15, 40, 20);
    } catch (error) {
      console.log('Could not add logo:', error);
    }
  }
  
  // Company details (right side of header)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(companySettings?.name || 'Your Company', pageWidth - margin, 25, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  if (companySettings?.address) {
    doc.text(companySettings.address, pageWidth - margin, 32, { align: 'right' });
  }
  if (companySettings?.city) {
    doc.text(`${companySettings.city}, ${companySettings.postcode}`, pageWidth - margin, 38, { align: 'right' });
  }
  if (companySettings?.phone) {
    doc.text(companySettings.phone, pageWidth - margin, 44, { align: 'right' });
  }
  if (companySettings?.email) {
    doc.text(companySettings.email, pageWidth - margin, 50, { align: 'right' });
  }
  
  currentY = 80;
  
  // Invoice title
  doc.setTextColor(...textColor);
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text('INVOICE', margin, currentY);
  
  // Invoice details
  currentY += 20;
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  
  const invoiceDetails = [
    ['Invoice Number:', invoice.invoiceNumber || 'N/A'],
    ['Date:', invoice.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString()],
    ['Due Date:', invoice.dueDate || 'N/A'],
    ['Status:', invoice.status || 'Unpaid']
  ];
  
  invoiceDetails.forEach(([label, value], index) => {
    doc.setFont(undefined, 'bold');
    doc.text(label, margin, currentY + (index * 8));
    doc.setFont(undefined, 'normal');
    doc.text(value, margin + 40, currentY + (index * 8));
  });
  
  // Bill to section
  currentY += 50;
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('BILL TO:', margin, currentY);
  
  currentY += 10;
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(invoice.clientName || 'Client Name', margin, currentY);
  
  if (clientData) {
    if (clientData.email) {
      currentY += 8;
      doc.text(clientData.email, margin, currentY);
    }
    if (clientData.address) {
      currentY += 8;
      doc.text(clientData.address, margin, currentY);
    }
    if (clientData.city) {
      currentY += 8;
      doc.text(`${clientData.city}, ${clientData.postcode || ''}`, margin, currentY);
    }
  }
  
  currentY += 25;
  
  // Items table
  const tableData = [];
  
  if (invoice.selectedProducts && invoice.selectedProducts.length > 0) {
    invoice.selectedProducts.forEach(product => {
      const subtotal = product.price * product.quantity;
      const vatAmount = subtotal * (product.vat / 100);
      tableData.push([
        product.name,
        product.quantity.toString(),
        `£${product.price.toFixed(2)}`,
        `${product.vat}%`,
        `£${subtotal.toFixed(2)}`
      ]);
    });
  } else {
    tableData.push([
      'Service/Product',
      '1',
      `£${parseFloat(invoice.amount).toFixed(2)}`,
      `${invoice.vat || 0}%`,
      `£${parseFloat(invoice.amount).toFixed(2)}`
    ]);
  }
  
  doc.autoTable({
    startY: currentY,
    head: [['Description', 'Qty', 'Rate', 'VAT', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    bodyStyles: {
      textColor: textColor
    },
    alternateRowStyles: {
      fillColor: lightGray
    },
    margin: { left: margin, right: margin }
  });
  
  currentY = doc.lastAutoTable.finalY + 20;
  
  // Totals
  const subtotal = parseFloat(invoice.amount);
  const vatRate = parseFloat(invoice.vat) || 0;
  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;
  
  const totalsData = [
    ['Subtotal:', `£${subtotal.toFixed(2)}`],
    [`VAT (${vatRate}%):`, `£${vatAmount.toFixed(2)}`],
    ['Total:', `£${total.toFixed(2)}`]
  ];
  
  const totalsStartX = pageWidth - 80;
  totalsData.forEach(([label, value], index) => {
    const y = currentY + (index * 8);
    doc.setFont(undefined, index === 2 ? 'bold' : 'normal');
    doc.setFontSize(index === 2 ? 14 : 12);
    doc.text(label, totalsStartX - 20, y, { align: 'right' });
    doc.text(value, totalsStartX + 20, y, { align: 'right' });
  });
  
  // Notes
  if (invoice.notes) {
    currentY += 40;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Notes:', margin, currentY);
    currentY += 8;
    doc.setFont(undefined, 'normal');
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - (margin * 2));
    doc.text(splitNotes, margin, currentY);
  }
  
  // Footer
  const footerY = pageHeight - 40;
  doc.setFillColor(...primaryColor);
  doc.rect(0, footerY, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  
  if (companySettings?.website) {
    doc.text(companySettings.website, margin, footerY + 15);
  }
  if (companySettings?.vatNumber) {
    doc.text(`VAT: ${companySettings.vatNumber}`, pageWidth - margin, footerY + 15, { align: 'right' });
  }
  if (companySettings?.companyNumber) {
    doc.text(`Company No: ${companySettings.companyNumber}`, pageWidth - margin, footerY + 25, { align: 'right' });
  }
  
  return doc;
};

export const generateQuotePDF = async (quote, companySettings, clientData = null) => {
  const doc = new jsPDF();
  
  // Document setup
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  
  // Colors from your theme
  const primaryColor = [102, 126, 234]; // #667eea
  const secondaryColor = [118, 75, 162]; // #764ba2
  const textColor = [51, 51, 51];
  const lightGray = [248, 249, 250];
  
  let currentY = margin;

  // Header with gradient background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 60, 'F');
  
  // Company logo
  if (companySettings?.logo) {
    try {
      doc.addImage(companySettings.logo, 'JPEG', margin, 15, 40, 20);
    } catch (error) {
      console.log('Could not add logo:', error);
    }
  }
  
  // Company details
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(companySettings?.name || 'Your Company', pageWidth - margin, 25, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  if (companySettings?.address) {
    doc.text(companySettings.address, pageWidth - margin, 32, { align: 'right' });
  }
  if (companySettings?.city) {
    doc.text(`${companySettings.city}, ${companySettings.postcode}`, pageWidth - margin, 38, { align: 'right' });
  }
  if (companySettings?.phone) {
    doc.text(companySettings.phone, pageWidth - margin, 44, { align: 'right' });
  }
  if (companySettings?.email) {
    doc.text(companySettings.email, pageWidth - margin, 50, { align: 'right' });
  }
  
  currentY = 80;
  
  // Quote title
  doc.setTextColor(...textColor);
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text('QUOTATION', margin, currentY);
  
  // Quote details
  currentY += 20;
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  
  const quoteDetails = [
    ['Quote Number:', quote.quoteNumber || 'N/A'],
    ['Date:', quote.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString()],
    ['Valid Until:', quote.validUntil || 'N/A'],
    ['Status:', quote.status || 'Pending']
  ];
  
  quoteDetails.forEach(([label, value], index) => {
    doc.setFont(undefined, 'bold');
    doc.text(label, margin, currentY + (index * 8));
    doc.setFont(undefined, 'normal');
    doc.text(value, margin + 40, currentY + (index * 8));
  });
  
  // Quote for section
  currentY += 50;
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('QUOTE FOR:', margin, currentY);
  
  currentY += 10;
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(quote.clientName || 'Client Name', margin, currentY);
  
  if (clientData) {
    if (clientData.email) {
      currentY += 8;
      doc.text(clientData.email, margin, currentY);
    }
    if (clientData.address) {
      currentY += 8;
      doc.text(clientData.address, margin, currentY);
    }
    if (clientData.city) {
      currentY += 8;
      doc.text(`${clientData.city}, ${clientData.postcode || ''}`, margin, currentY);
    }
  }
  
  currentY += 25;
  
  // Items table
  const tableData = [];
  
  if (quote.selectedProducts && quote.selectedProducts.length > 0) {
    quote.selectedProducts.forEach(product => {
      const subtotal = product.price * product.quantity;
      tableData.push([
        product.name,
        product.quantity.toString(),
        `£${product.price.toFixed(2)}`,
        `${product.vat}%`,
        `£${subtotal.toFixed(2)}`
      ]);
    });
  } else {
    tableData.push([
      'Service/Product',
      '1',
      `£${parseFloat(quote.amount).toFixed(2)}`,
      `${quote.vat || 0}%`,
      `£${parseFloat(quote.amount).toFixed(2)}`
    ]);
  }
  
  doc.autoTable({
    startY: currentY,
    head: [['Description', 'Qty', 'Rate', 'VAT', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    bodyStyles: {
      textColor: textColor
    },
    alternateRowStyles: {
      fillColor: lightGray
    },
    margin: { left: margin, right: margin }
  });
  
  currentY = doc.lastAutoTable.finalY + 20;
  
  // Totals
  const subtotal = parseFloat(quote.amount);
  const vatRate = parseFloat(quote.vat) || 0;
  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;
  
  const totalsData = [
    ['Subtotal:', `£${subtotal.toFixed(2)}`],
    [`VAT (${vatRate}%):`, `£${vatAmount.toFixed(2)}`],
    ['Total:', `£${total.toFixed(2)}`]
  ];
  
  const totalsStartX = pageWidth - 80;
  totalsData.forEach(([label, value], index) => {
    const y = currentY + (index * 8);
    doc.setFont(undefined, index === 2 ? 'bold' : 'normal');
    doc.setFontSize(index === 2 ? 14 : 12);
    doc.text(label, totalsStartX - 20, y, { align: 'right' });
    doc.text(value, totalsStartX + 20, y, { align: 'right' });
  });
  
  // Notes
  if (quote.notes) {
    currentY += 40;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Notes:', margin, currentY);
    currentY += 8;
    doc.setFont(undefined, 'normal');
    const splitNotes = doc.splitTextToSize(quote.notes, pageWidth - (margin * 2));
    doc.text(splitNotes, margin, currentY);
  }
  
  // Footer
  const footerY = pageHeight - 40;
  doc.setFillColor(...primaryColor);
  doc.rect(0, footerY, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  
  if (companySettings?.website) {
    doc.text(companySettings.website, margin, footerY + 15);
  }
  if (companySettings?.vatNumber) {
    doc.text(`VAT: ${companySettings.vatNumber}`, pageWidth - margin, footerY + 15, { align: 'right' });
  }
  if (companySettings?.companyNumber) {
    doc.text(`Company No: ${companySettings.companyNumber}`, pageWidth - margin, footerY + 25, { align: 'right' });
  }
  
  return doc;
};

export const generateStatementPDF = async (client, invoices, companySettings, period = 'All Time') => {
  const doc = new jsPDF();
  
  // Document setup
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  
  // Colors from your theme
  const primaryColor = [102, 126, 234]; // #667eea
  const secondaryColor = [118, 75, 162]; // #764ba2
  const textColor = [51, 51, 51];
  const lightGray = [248, 249, 250];
  
  let currentY = margin;

  // Header with gradient background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 60, 'F');
  
  // Company logo
  if (companySettings?.logo) {
    try {
      doc.addImage(companySettings.logo, 'JPEG', margin, 15, 40, 20);
    } catch (error) {
      console.log('Could not add logo:', error);
    }
  }
  
  // Company details
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(companySettings?.name || 'Your Company', pageWidth - margin, 25, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  if (companySettings?.address) {
    doc.text(companySettings.address, pageWidth - margin, 32, { align: 'right' });
  }
  if (companySettings?.city) {
    doc.text(`${companySettings.city}, ${companySettings.postcode}`, pageWidth - margin, 38, { align: 'right' });
  }
  if (companySettings?.phone) {
    doc.text(companySettings.phone, pageWidth - margin, 44, { align: 'right' });
  }
  if (companySettings?.email) {
    doc.text(companySettings.email, pageWidth - margin, 50, { align: 'right' });
  }
  
  currentY = 80;
  
  // Statement title
  doc.setTextColor(...textColor);
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text('ACCOUNT STATEMENT', margin, currentY);
  
  // Statement details
  currentY += 20;
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  
  const statementDetails = [
    ['Client:', client.name || 'N/A'],
    ['Period:', period],
    ['Statement Date:', new Date().toLocaleDateString()],
    ['Total Invoices:', invoices.length.toString()]
  ];
  
  statementDetails.forEach(([label, value], index) => {
    doc.setFont(undefined, 'bold');
    doc.text(label, margin, currentY + (index * 8));
    doc.setFont(undefined, 'normal');
    doc.text(value, margin + 40, currentY + (index * 8));
  });
  
  currentY += 50;
  
  // Summary section
  const totalAmount = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
  const paidAmount = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
  const unpaidAmount = invoices.filter(inv => inv.status === 'Unpaid').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('SUMMARY', margin, currentY);
  
  currentY += 15;
  
  const summaryData = [
    ['Total Amount:', `£${totalAmount.toFixed(2)}`],
    ['Paid Amount:', `£${paidAmount.toFixed(2)}`],
    ['Outstanding:', `£${unpaidAmount.toFixed(2)}`]
  ];
  
  doc.autoTable({
    startY: currentY,
    head: [['Description', 'Amount']],
    body: summaryData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    bodyStyles: {
      textColor: textColor
    },
    margin: { left: margin, right: margin }
  });
  
  currentY = doc.lastAutoTable.finalY + 25;
  
  // Invoices table
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('INVOICE DETAILS', margin, currentY);
  
  currentY += 10;
  
  const invoiceData = invoices.map(invoice => [
    invoice.invoiceNumber || 'N/A',
    invoice.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A',
    invoice.dueDate || 'N/A',
    `£${parseFloat(invoice.amount).toFixed(2)}`,
    invoice.status || 'Unpaid'
  ]);
  
  doc.autoTable({
    startY: currentY,
    head: [['Invoice #', 'Date', 'Due Date', 'Amount', 'Status']],
    body: invoiceData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    bodyStyles: {
      textColor: textColor
    },
    alternateRowStyles: {
      fillColor: lightGray
    },
    margin: { left: margin, right: margin }
  });
  
  // Footer
  const footerY = pageHeight - 40;
  doc.setFillColor(...primaryColor);
  doc.rect(0, footerY, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  
  if (companySettings?.website) {
    doc.text(companySettings.website, margin, footerY + 15);
  }
  if (companySettings?.vatNumber) {
    doc.text(`VAT: ${companySettings.vatNumber}`, pageWidth - margin, footerY + 15, { align: 'right' });
  }
  if (companySettings?.companyNumber) {
    doc.text(`Company No: ${companySettings.companyNumber}`, pageWidth - margin, footerY + 25, { align: 'right' });
  }
  
  return doc;
};

export const downloadPDF = (doc, filename) => {
  doc.save(filename);
};
