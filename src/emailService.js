import { jsPDF } from 'jspdf';

// Debug logging for jsPDF import
console.log('jsPDF import check:', typeof jsPDF);

const generateInvoicePDF = async (invoice, companySettings) => {
  try {
    const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 20;

  // Professional header
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Company logo
  if (companySettings.logo) {
    try {
      doc.addImage(companySettings.logo, 'JPEG', 15, 8, 30, 15);
    } catch (error) {
      console.log('Error adding logo to PDF:', error);
    }
  }

  // Company name in header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text(companySettings.companyName || 'Your Company', pageWidth - 20, 20, { align: 'right' });

  // Company details in header
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  if (companySettings.address) {
    doc.text(companySettings.address, pageWidth - 20, 28, { align: 'right' });
  }
  if (companySettings.email) {
    doc.text(companySettings.email, pageWidth - 20, 33, { align: 'right' });
  }

  currentY = 60;
  doc.setTextColor(0, 0, 0);

  // Invoice title
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text('INVOICE', 20, currentY);

  // Invoice details
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 20, currentY + 15);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, currentY + 25);
  doc.text(`Due Date: ${invoice.dueDate}`, pageWidth - 120, currentY + 25);
  doc.text(`Status: ${invoice.status}`, pageWidth - 120, currentY + 35);

  currentY += 60;

  // Bill To section
  doc.setFillColor(248, 249, 250);
  doc.rect(20, currentY, pageWidth - 40, 25, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(20, currentY, pageWidth - 40, 25);

  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Bill To:', 25, currentY + 12);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text(invoice.clientName, 25, currentY + 20);

  currentY += 45;

  // Items table header
  doc.setFillColor(41, 128, 185);
  doc.rect(20, currentY, pageWidth - 40, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('Description', 25, currentY + 10);
  doc.text('Amount', pageWidth - 60, currentY + 10, { align: 'right' });

  currentY += 15;
  doc.setTextColor(0, 0, 0);

  // Service line
  doc.setFillColor(255, 255, 255);
  doc.rect(20, currentY, pageWidth - 40, 15, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(20, currentY, pageWidth - 40, 15);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(invoice.productName || 'Service', 25, currentY + 10);
  doc.text(`£${Number(invoice.amount).toFixed(2)}`, pageWidth - 60, currentY + 10, { align: 'right' });

  currentY += 35;

  // Totals section
  const amount = parseFloat(invoice.amount) || 0;
  const vatRate = parseFloat(invoice.vat) || 0;
  const vatAmount = amount * (vatRate / 100);
  const total = amount + vatAmount;

  doc.setFillColor(248, 249, 250);
  doc.rect(pageWidth - 120, currentY, 100, 45, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(pageWidth - 120, currentY, 100, 45);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Subtotal:', pageWidth - 115, currentY + 10);
  doc.text(`£${amount.toFixed(2)}`, pageWidth - 25, currentY + 10, { align: 'right' });

  doc.text(`VAT (${vatRate}%):`, pageWidth - 115, currentY + 20);
  doc.text(`£${vatAmount.toFixed(2)}`, pageWidth - 25, currentY + 20, { align: 'right' });

  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.text('Total:', pageWidth - 115, currentY + 35);
  doc.text(`£${total.toFixed(2)}`, pageWidth - 25, currentY + 35, { align: 'right' });

  // Notes section
  if (invoice.notes) {
    currentY += 70;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Notes:', 20, currentY);
    doc.setFont(undefined, 'normal');
    doc.text(invoice.notes, 20, currentY + 10);
  }

  // Footer
  const footerY = 250;
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(128, 128, 128);

  let footerText = [];
  if (companySettings.companyNumber) {
    footerText.push(`Company Registration: ${companySettings.companyNumber}`);
  }
  if (companySettings.vatNumber) {
    footerText.push(`VAT Number: ${companySettings.vatNumber}`);
  }

  if (footerText.length > 0) {
    doc.text(footerText.join(' | '), pageWidth / 2, footerY + 10, { align: 'center' });
  }

  doc.setTextColor(41, 128, 185);
  doc.setFontSize(10);
  doc.setFont(undefined, 'italic');
  doc.text('Thank you for your business!', pageWidth / 2, footerY + 20, { align: 'center' });

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
  let currentY = 20;

  // Professional header
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Company logo
  if (companySettings.logo) {
    try {
      doc.addImage(companySettings.logo, 'JPEG', 15, 8, 30, 15);
    } catch (error) {
      console.log('Error adding logo to PDF:', error);
    }
  }

  // Company name in header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text(companySettings.companyName || 'Your Company', pageWidth - 20, 20, { align: 'right' });

  // Company details in header
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  if (companySettings.address) {
    doc.text(companySettings.address, pageWidth - 20, 28, { align: 'right' });
  }
  if (companySettings.email) {
    doc.text(companySettings.email, pageWidth - 20, 33, { align: 'right' });
  }

  currentY = 60;
  doc.setTextColor(0, 0, 0);

  // Quote title
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text('QUOTE', 20, currentY);

  // Quote details
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`Quote Number: ${quote.quoteNumber}`, 20, currentY + 15);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, currentY + 25);
  doc.text(`Valid Until: ${quote.validUntil}`, pageWidth - 120, currentY + 25);
  doc.text(`Status: ${quote.status}`, pageWidth - 120, currentY + 35);

  currentY += 60;

  // Quote To section
  doc.setFillColor(248, 249, 250);
  doc.rect(20, currentY, pageWidth - 40, 25, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(20, currentY, pageWidth - 40, 25);

  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Quote To:', 25, currentY + 12);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text(quote.clientName, 25, currentY + 20);

  currentY += 45;

  // Items table header
  doc.setFillColor(41, 128, 185);
  doc.rect(20, currentY, pageWidth - 40, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('Description', 25, currentY + 10);
  doc.text('Amount', pageWidth - 60, currentY + 10, { align: 'right' });

  currentY += 15;
  doc.setTextColor(0, 0, 0);

  // Service line
  doc.setFillColor(255, 255, 255);
  doc.rect(20, currentY, pageWidth - 40, 15, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(20, currentY, pageWidth - 40, 15);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(quote.productName || 'Service', 25, currentY + 10);
  doc.text(`£${Number(quote.amount).toFixed(2)}`, pageWidth - 60, currentY + 10, { align: 'right' });

  currentY += 35;

  // Totals section
  const amount = parseFloat(quote.amount) || 0;
  const vatRate = parseFloat(quote.vat) || 0;
  const vatAmount = amount * (vatRate / 100);
  const total = amount + vatAmount;

  doc.setFillColor(248, 249, 250);
  doc.rect(pageWidth - 120, currentY, 100, 45, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(pageWidth - 120, currentY, 100, 45);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Subtotal:', pageWidth - 115, currentY + 10);
  doc.text(`£${amount.toFixed(2)}`, pageWidth - 25, currentY + 10, { align: 'right' });

  doc.text(`VAT (${vatRate}%):`, pageWidth - 115, currentY + 20);
  doc.text(`£${vatAmount.toFixed(2)}`, pageWidth - 25, currentY + 20, { align: 'right' });

  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.text('Total:', pageWidth - 115, currentY + 35);
  doc.text(`£${total.toFixed(2)}`, pageWidth - 25, currentY + 35, { align: 'right' });

  // Notes section
  if (quote.notes) {
    currentY += 70;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Notes:', 20, currentY);
    doc.setFont(undefined, 'normal');
    doc.text(quote.notes, 20, currentY + 10);
  }

  // Footer
  const footerY = 250;
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(128, 128, 128);

  let footerText = [];
  if (companySettings.companyNumber) {
    footerText.push(`Company Registration: ${companySettings.companyNumber}`);
  }
  if (companySettings.vatNumber) {
    footerText.push(`VAT Number: ${companySettings.vatNumber}`);
  }

  if (footerText.length > 0) {
    doc.text(footerText.join(' | '), pageWidth / 2, footerY + 10, { align: 'center' });
  }

  doc.setTextColor(41, 128, 185);
  doc.setFontSize(10);
  doc.setFont(undefined, 'italic');
  doc.text('Thank you for considering our services!', pageWidth / 2, footerY + 20, { align: 'center' });

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

export { generateInvoicePDF, generateQuotePDF };