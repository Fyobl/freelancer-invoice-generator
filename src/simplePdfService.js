
import { jsPDF } from 'jspdf';

// Simple PDF generation functions
export const generateInvoicePDF = (invoice, companySettings) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(103, 126, 234);
  doc.text('INVOICE', 20, 30);
  
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
  
  // Invoice details
  doc.setFontSize(12);
  doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 20, 60);
  doc.text(`Date: ${invoice.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString()}`, 20, 70);
  doc.text(`Due Date: ${invoice.dueDate || 'Upon receipt'}`, 20, 80);
  doc.text(`Status: ${invoice.status || 'Unpaid'}`, 20, 90);
  
  // Client info
  doc.text('Bill To:', 20, 110);
  doc.text(invoice.clientName, 20, 120);
  
  // Amount section
  doc.setFontSize(14);
  doc.text(`Amount: £${parseFloat(invoice.amount || 0).toFixed(2)}`, 20, 150);
  
  if (invoice.vat && parseFloat(invoice.vat) > 0) {
    const vatAmount = (parseFloat(invoice.amount) * parseFloat(invoice.vat)) / 100;
    doc.text(`VAT (${invoice.vat}%): £${vatAmount.toFixed(2)}`, 20, 165);
    doc.text(`Total: £${(parseFloat(invoice.amount) + vatAmount).toFixed(2)}`, 20, 180);
  }
  
  // Notes
  if (invoice.notes) {
    doc.setFontSize(10);
    doc.text('Notes:', 20, 210);
    doc.text(invoice.notes, 20, 220);
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  if (companySettings?.companyNumber) {
    doc.text(`Company Number: ${companySettings.companyNumber}`, 20, 280);
  }
  if (companySettings?.vatNumber) {
    doc.text(`VAT Number: ${companySettings.vatNumber}`, 20, 285);
  }
  
  return doc;
};

export const generateQuotePDF = (quote, companySettings) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(103, 126, 234);
  doc.text('QUOTE', 20, 30);
  
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
  
  // Quote details
  doc.setFontSize(12);
  doc.text(`Quote Number: ${quote.quoteNumber}`, 20, 60);
  doc.text(`Date: ${quote.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString()}`, 20, 70);
  doc.text(`Valid Until: ${quote.validUntil || '30 days'}`, 20, 80);
  doc.text(`Status: ${quote.status || 'Pending'}`, 20, 90);
  
  // Client info
  doc.text('Quote For:', 20, 110);
  doc.text(quote.clientName, 20, 120);
  
  // Amount section
  doc.setFontSize(14);
  doc.text(`Amount: £${parseFloat(quote.amount || 0).toFixed(2)}`, 20, 150);
  
  if (quote.vat && parseFloat(quote.vat) > 0) {
    const vatAmount = (parseFloat(quote.amount) * parseFloat(quote.vat)) / 100;
    doc.text(`VAT (${quote.vat}%): £${vatAmount.toFixed(2)}`, 20, 165);
    doc.text(`Total: £${(parseFloat(quote.amount) + vatAmount).toFixed(2)}`, 20, 180);
  }
  
  // Notes
  if (quote.notes) {
    doc.setFontSize(10);
    doc.text('Notes:', 20, 210);
    doc.text(quote.notes, 20, 220);
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  if (companySettings?.companyNumber) {
    doc.text(`Company Number: ${companySettings.companyNumber}`, 20, 280);
  }
  if (companySettings?.vatNumber) {
    doc.text(`VAT Number: ${companySettings.vatNumber}`, 20, 285);
  }
  
  return doc;
};

export const generateStatementPDF = (client, invoices, companySettings, period = 'full') => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(103, 126, 234);
  doc.text('STATEMENT', 20, 30);
  
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
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  if (companySettings?.companyNumber) {
    doc.text(`Company Number: ${companySettings.companyNumber}`, 20, 280);
  }
  if (companySettings?.vatNumber) {
    doc.text(`VAT Number: ${companySettings.vatNumber}`, 20, 285);
  }
  
  return doc;
};
