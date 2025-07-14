
import { jsPDF } from 'jspdf';

// Shared template function for common PDF elements
const generatePDFFromTemplate = (documentType, documentData, companySettings) => {
  const doc = new jsPDF();
  
  // Header Section
  addHeader(doc, documentType, companySettings);
  
  // Document-specific content
  addDocumentContent(doc, documentType, documentData, companySettings);
  
  // Footer Section
  addFooter(doc, companySettings);
  
  return doc;
};

// Add header with company info and document title
const addHeader = (doc, documentType, companySettings) => {
  // Document title
  doc.setFontSize(24);
  doc.setTextColor(103, 126, 234);
  doc.text(documentType.toUpperCase(), 20, 30);
  
  // Company info (right side)
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const companyInfo = [
    companySettings?.name || 'Your Company',
    companySettings?.address || '',
    companySettings?.city || '',
    companySettings?.postcode || '',
    `Phone: ${companySettings?.phone || ''}`,
    `Email: ${companySettings?.email || ''}`
  ].filter(line => line.trim());
  
  companyInfo.forEach((line, index) => {
    doc.text(line, 120, 20 + (index * 5));
  });
};

// Add document-specific content based on type
const addDocumentContent = (doc, documentType, data, companySettings) => {
  switch (documentType) {
    case 'invoice':
      addInvoiceContent(doc, data, companySettings);
      break;
    case 'quote':
      addQuoteContent(doc, data, companySettings);
      break;
    case 'statement':
      addStatementContent(doc, data, companySettings);
      break;
    default:
      throw new Error(`Unknown document type: ${documentType}`);
  }
};

// Add invoice-specific content
const addInvoiceContent = (doc, invoice, companySettings) => {
  // Invoice details
  doc.setFontSize(12);
  doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 20, 60);
  doc.text(`Date: ${invoice.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString()}`, 20, 70);
  doc.text(`Due Date: ${invoice.dueDate || 'Upon receipt'}`, 20, 80);
  doc.text(`Status: ${invoice.status || 'Unpaid'}`, 20, 90);
  
  // Client info
  doc.text('Bill To:', 20, 110);
  doc.text(invoice.clientName, 20, 120);
  
  // Products/Services section
  if (invoice.selectedProducts && invoice.selectedProducts.length > 0) {
    addProductsTable(doc, invoice.selectedProducts, 140);
  } else {
    // Simple amount display
    doc.setFontSize(14);
    doc.text(`Amount: £${parseFloat(invoice.amount || 0).toFixed(2)}`, 20, 150);
    
    if (invoice.vat && parseFloat(invoice.vat) > 0) {
      const vatAmount = (parseFloat(invoice.amount) * parseFloat(invoice.vat)) / 100;
      doc.text(`VAT (${invoice.vat}%): £${vatAmount.toFixed(2)}`, 20, 165);
      doc.text(`Total: £${(parseFloat(invoice.amount) + vatAmount).toFixed(2)}`, 20, 180);
    }
  }
  
  // Notes
  if (invoice.notes) {
    doc.setFontSize(10);
    doc.text('Notes:', 20, 210);
    const splitNotes = doc.splitTextToSize(invoice.notes, 170);
    doc.text(splitNotes, 20, 220);
  }
};

// Add quote-specific content
const addQuoteContent = (doc, quote, companySettings) => {
  // Quote details
  doc.setFontSize(12);
  doc.text(`Quote Number: ${quote.quoteNumber}`, 20, 60);
  doc.text(`Date: ${quote.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString()}`, 20, 70);
  doc.text(`Valid Until: ${quote.validUntil || '30 days'}`, 20, 80);
  doc.text(`Status: ${quote.status || 'Pending'}`, 20, 90);
  
  // Client info
  doc.text('Quote For:', 20, 110);
  doc.text(quote.clientName, 20, 120);
  
  // Products/Services section
  if (quote.selectedProducts && quote.selectedProducts.length > 0) {
    addProductsTable(doc, quote.selectedProducts, 140);
  } else {
    // Simple amount display
    doc.setFontSize(14);
    doc.text(`Amount: £${parseFloat(quote.amount || 0).toFixed(2)}`, 20, 150);
    
    if (quote.vat && parseFloat(quote.vat) > 0) {
      const vatAmount = (parseFloat(quote.amount) * parseFloat(quote.vat)) / 100;
      doc.text(`VAT (${quote.vat}%): £${vatAmount.toFixed(2)}`, 20, 165);
      doc.text(`Total: £${(parseFloat(quote.amount) + vatAmount).toFixed(2)}`, 20, 180);
    }
  }
  
  // Notes
  if (quote.notes) {
    doc.setFontSize(10);
    doc.text('Notes:', 20, 210);
    const splitNotes = doc.splitTextToSize(quote.notes, 170);
    doc.text(splitNotes, 20, 220);
  }
};

// Add statement-specific content
const addStatementContent = (doc, data, companySettings) => {
  const { client, invoices, period } = data;
  
  // Statement details
  doc.setFontSize(12);
  doc.text(`Statement Date: ${new Date().toLocaleDateString()}`, 20, 60);
  doc.text(`Period: ${period === 'full' ? 'All Time' : period}`, 20, 70);
  doc.text(`Total Invoices: ${invoices.length}`, 20, 80);
  
  // Client info
  doc.text('Statement For:', 20, 100);
  doc.text(client.name, 20, 110);
  
  // Calculate totals
  const totalAmount = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
  const paidAmount = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
  const unpaidAmount = invoices.filter(inv => inv.status === 'Unpaid').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
  
  // Totals section
  doc.setFontSize(14);
  doc.text(`Total Amount: £${totalAmount.toFixed(2)}`, 20, 140);
  doc.text(`Paid: £${paidAmount.toFixed(2)}`, 20, 155);
  doc.text(`Unpaid: £${unpaidAmount.toFixed(2)}`, 20, 170);
  
  // Invoice list header
  doc.setFontSize(10);
  doc.text('Invoice Details:', 20, 200);
  doc.text('Invoice #', 20, 210);
  doc.text('Date', 70, 210);
  doc.text('Amount', 120, 210);
  doc.text('Status', 160, 210);
  
  // Invoice list
  invoices.slice(0, 15).forEach((invoice, index) => {
    const y = 220 + (index * 8);
    doc.text(invoice.invoiceNumber || 'N/A', 20, y);
    doc.text(invoice.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A', 70, y);
    doc.text(`£${parseFloat(invoice.amount || 0).toFixed(2)}`, 120, y);
    doc.text(invoice.status || 'Unpaid', 160, y);
  });
};

// Add products table for invoices and quotes
const addProductsTable = (doc, products, startY) => {
  doc.setFontSize(12);
  doc.text('Items:', 20, startY);
  
  // Table headers
  doc.setFontSize(10);
  doc.text('Description', 20, startY + 15);
  doc.text('Qty', 120, startY + 15);
  doc.text('Price', 140, startY + 15);
  doc.text('Total', 170, startY + 15);
  
  let currentY = startY + 25;
  let subtotal = 0;
  
  products.forEach((product, index) => {
    const lineTotal = (product.price || 0) * (product.quantity || 1);
    subtotal += lineTotal;
    
    doc.text(product.name || 'Item', 20, currentY);
    doc.text((product.quantity || 1).toString(), 120, currentY);
    doc.text(`£${(product.price || 0).toFixed(2)}`, 140, currentY);
    doc.text(`£${lineTotal.toFixed(2)}`, 170, currentY);
    
    currentY += 10;
  });
  
  // Totals
  currentY += 10;
  doc.setFontSize(12);
  doc.text(`Subtotal: £${subtotal.toFixed(2)}`, 140, currentY);
  
  // Calculate VAT if applicable
  const avgVatRate = products.reduce((sum, product) => sum + (product.vat || 0), 0) / products.length;
  if (avgVatRate > 0) {
    const vatAmount = subtotal * (avgVatRate / 100);
    doc.text(`VAT (${avgVatRate.toFixed(1)}%): £${vatAmount.toFixed(2)}`, 140, currentY + 15);
    doc.text(`Total: £${(subtotal + vatAmount).toFixed(2)}`, 140, currentY + 30);
  }
};

// Add footer with company details
const addFooter = (doc, companySettings) => {
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  
  if (companySettings?.companyNumber) {
    doc.text(`Company Number: ${companySettings.companyNumber}`, 20, 280);
  }
  if (companySettings?.vatNumber) {
    doc.text(`VAT Number: ${companySettings.vatNumber}`, 20, 285);
  }
};

// Export functions using the new template system
export const generateInvoicePDF = (invoice, companySettings) => {
  return generatePDFFromTemplate('invoice', invoice, companySettings);
};

export const generateQuotePDF = (quote, companySettings) => {
  return generatePDFFromTemplate('quote', quote, companySettings);
};

export const generateStatementPDF = (client, invoices, companySettings, period = 'full') => {
  const data = { client, invoices, period };
  return generatePDFFromTemplate('statement', data, companySettings);
};
