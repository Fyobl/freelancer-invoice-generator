import { jsPDF } from 'jspdf';
import { getDoc, doc } from 'firebase/firestore';
import { db, auth } from './firebase.js';

// Debug logging for jsPDF import
console.log('jsPDF import check:', typeof jsPDF);

const generateInvoicePDF = async (invoice, companySettings) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 20;

    // Modern minimal header with subtle background
    doc.setFillColor(250, 251, 252);
    doc.rect(0, 0, pageWidth, 50, 'F');

    // Accent line at top
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, pageWidth, 3, 'F');

    // Company logo (larger and better positioned)
    if (companySettings.logo) {
      try {
        doc.addImage(companySettings.logo, 'JPEG', 20, 8, 70, 40);
      } catch (error) {
        console.log('Error adding logo to PDF:', error);
      }
    }

    // Company name and INVOICE title in header
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(companySettings.name || companySettings.companyName || 'Your Company', pageWidth - 20, 18, { align: 'right' });

    // INVOICE title in header (centered)
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('INVOICE', pageWidth / 2, 25, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(75, 85, 99);
    let companyY = 26;

    const fullAddress = [companySettings.address, companySettings.city, companySettings.postcode].filter(Boolean).join(', ');
    if (fullAddress) {
      doc.text(fullAddress, pageWidth - 20, companyY, { align: 'right' });
      companyY += 6;
    }
    if (companySettings.email) {
      doc.text(companySettings.email, pageWidth - 20, companyY, { align: 'right' });
      companyY += 6;
    }
    if (companySettings.phone) {
      doc.text(companySettings.phone, pageWidth - 20, companyY, { align: 'right' });
    }

    currentY = 55;

    // Subtle divider line
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(1);
    doc.line(20, currentY, pageWidth - 20, currentY);

    currentY += 8;

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
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('DESCRIPTION', 25, currentY + 8);
    doc.text('QTY', pageWidth - 120, currentY + 8, { align: 'center' });
    doc.text('RATE', pageWidth - 80, currentY + 8, { align: 'center' });
    doc.text('AMOUNT', pageWidth - 30, currentY + 8, { align: 'right' });

    currentY += 12;
    doc.setTextColor(17, 24, 39);

    // Items display
    if (invoice.selectedProducts && invoice.selectedProducts.length > 0) {
      invoice.selectedProducts.forEach((product, index) => {
        const bgColor = index % 2 === 0 ? 249 : 255;
        doc.setFillColor(bgColor, bgColor === 249 ? 250 : 255);
        doc.rect(20, currentY, pageWidth - 40, 10, 'F');

        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text(product.name, 25, currentY + 7);
        doc.text(String(product.quantity || 1), pageWidth - 120, currentY + 7, { align: 'center' });
        doc.text(`£${(product.price || 0).toFixed(2)}`, pageWidth - 80, currentY + 7, { align: 'center' });
        doc.text(`£${((product.price || 0) * (product.quantity || 1)).toFixed(2)}`, pageWidth - 30, currentY + 7, { align: 'right' });

        currentY += 10;
      });
    } else {
      // Single service line
      doc.setFillColor(249, 250, 251);
      doc.rect(20, currentY, pageWidth - 40, 10, 'F');

      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text('Professional Services', 25, currentY + 7);
      doc.text('1', pageWidth - 120, currentY + 7, { align: 'center' });
      doc.text(`£${Number(invoice.amount).toFixed(2)}`, pageWidth - 80, currentY + 7, { align: 'center' });
      doc.text(`£${Number(invoice.amount).toFixed(2)}`, pageWidth - 30, currentY + 7, { align: 'right' });

      currentY += 10;
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
    if (companySettings.companyNumber) {
      footerText.push(`Company Registration: ${companySettings.companyNumber}`);
    }
    if (companySettings.vatNumber) {
      footerText.push(`VAT Number: ${companySettings.vatNumber}`);
    }

    if (footerText.length > 0) {
      doc.text(footerText.join(' • '), pageWidth / 2, footerY, { align: 'center' });
    }

    doc.setTextColor(99, 102, 241);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Thank you for your business!', pageWidth / 2, footerY + 8, { align: 'center' });

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

    // Modern minimal header with subtle background
    doc.setFillColor(250, 251, 252);
    doc.rect(0, 0, pageWidth, 50, 'F');

    // Accent line at top
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, pageWidth, 3, 'F');

    // Company logo (larger and better positioned)
    if (companySettings.logo) {
      try {
        doc.addImage(companySettings.logo, 'JPEG', 20, 8, 70, 40);
      } catch (error) {
        console.log('Error adding logo to PDF:', error);
      }
    }

    // Company name and QUOTE title in header
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(companySettings.name || companySettings.companyName || 'Your Company', pageWidth - 20, 18, { align: 'right' });

    // QUOTE title in header (centered)
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('QUOTE', pageWidth / 2, 25, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(75, 85, 99);
    let companyY = 26;

    const fullAddress = [companySettings.address, companySettings.city, companySettings.postcode].filter(Boolean).join(', ');
    if (fullAddress) {
      doc.text(fullAddress, pageWidth - 20, companyY, { align: 'right' });
      companyY += 6;
    }
    if (companySettings.email) {
      doc.text(companySettings.email, pageWidth - 20, companyY, { align: 'right' });
      companyY += 6;
    }
    if (companySettings.phone) {
      doc.text(companySettings.phone, pageWidth - 20, companyY, { align: 'right' });
    }

    currentY = 55;

    // Subtle divider line
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(1);
    doc.line(20, currentY, pageWidth - 20, currentY);

    currentY += 8;

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
    if (companySettings.companyNumber) {
      footerText.push(`Company Registration: ${companySettings.companyNumber}`);
    }
    if (companySettings.vatNumber) {
      footerText.push(`VAT Number: ${companySettings.vatNumber}`);
    }

    if (footerText.length > 0) {
      doc.text(footerText.join(' • '), pageWidth / 2, footerY, { align: 'center' });
    }

    doc.setTextColor(99, 102, 241);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Thank you for considering our services!', pageWidth / 2, footerY + 8, { align: 'center' });

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

// Get email settings from Firestore
const getEmailSettings = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const settingsDoc = await getDoc(doc(db, 'emailSettings', user.uid));
    return settingsDoc.exists() ? settingsDoc.data() : null;
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return null;
  }
};

// Replace template variables
const replaceTemplateVariables = (template, data) => {
  return template
    .replace(/{invoiceNumber}/g, data.invoiceNumber || '')
    .replace(/{quoteNumber}/g, data.quoteNumber || '')
    .replace(/{clientName}/g, data.clientName || '')
    .replace(/{totalAmount}/g, data.totalAmount || '')
    .replace(/{dueDate}/g, data.dueDate || '')
    .replace(/{validUntil}/g, data.validUntil || '')
    .replace(/{senderName}/g, data.senderName || '')
    .replace(/{companyName}/g, data.companyName || '');
};

// Show popup with manual attachment instructions and action buttons
const showEmailInstructions = (type, documentNumber, onDownloadPDF, onEmailReady) => {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    backdrop-filter: blur(4px);
    overflow: hidden;
  `;

  const popup = document.createElement('div');
  popup.style.cssText = `
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    max-width: 420px;
    width: 85%;
    max-height: 80vh;
    text-align: center;
    border: 2px solid #667eea;
    overflow-y: auto;
    position: relative;
  `;

  popup.innerHTML = `
    <div style="font-size: 36px; margin-bottom: 12px;">📧📎</div>
    <h2 style="color: #333; margin-bottom: 10px; font-size: 1.4rem;">Email ${type.charAt(0).toUpperCase() + type.slice(1)}</h2>
    <p style="color: #666; margin-bottom: 15px; line-height: 1.5; font-size: 0.95rem;">
      <strong>Important:</strong> Download the PDF first, then we'll open your email client.
    </p>

    <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 15px; text-align: left; border-left: 3px solid #667eea;">
      <h4 style="margin: 0 0 8px 0; color: #555; font-size: 0.95rem;">📋 Steps:</h4>
      <ol style="margin: 0; padding-left: 20px; color: #666; line-height: 1.4; font-size: 0.85rem;">
        <li>Click "Download PDF" below</li>
        <li>Click "Done - Open Email"</li>
        <li>Attach the downloaded PDF</li>
        <li>Send the email</li>
      </ol>
    </div>

    <div style="background: #fff3cd; padding: 10px; border-radius: 6px; margin-bottom: 15px; border-left: 3px solid #ffc107;">
      <p style="margin: 0; color: #856404; font-size: 0.8rem;">
        <strong>💡 File:</strong> ${type}_${documentNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf
      </p>
    </div>

    <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
      <button id="downloadBtn" style="
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s ease;
        min-width: 110px;
      ">📄 Download</button>

      <button id="doneBtn" style="
        background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s ease;
        min-width: 110px;
      ">✅ Open Email</button>

      <button id="cancelBtn" style="
        background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s ease;
        min-width: 110px;
      ">↩️ Cancel</button>
    </div>
  `;

  modal.appendChild(popup);
  document.body.appendChild(modal);

  // Prevent body scrolling when modal is open
  document.body.style.overflow = 'hidden';

  // Add hover effects
  const buttons = popup.querySelectorAll('button');
  buttons.forEach(button => {
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-1px)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
    });
  });

  // Event listeners for buttons
  popup.querySelector('#downloadBtn').addEventListener('click', () => {
    onDownloadPDF();
    // Update button to show it's been clicked
    const downloadBtn = popup.querySelector('#downloadBtn');
    downloadBtn.style.background = 'linear-gradient(135deg, #155724 0%, #1e7e34 100%)';
    downloadBtn.innerHTML = '✅ Downloaded';
    downloadBtn.disabled = true;
    downloadBtn.style.cursor = 'not-allowed';
  });

  popup.querySelector('#doneBtn').addEventListener('click', () => {
    document.body.style.overflow = 'auto'; // Restore scrolling
    modal.remove();
    onEmailReady();
  });

  popup.querySelector('#cancelBtn').addEventListener('click', () => {
    document.body.style.overflow = 'auto'; // Restore scrolling
    modal.remove();
  });

  // Close on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.style.overflow = 'auto'; // Restore scrolling
      modal.remove();
    }
  });
};

// Send invoice via email (mailto)
const sendInvoiceViaEmail = async (invoice, companySettings, recipientEmail) => {
  try {
    // Get email settings
    const emailSettings = await getEmailSettings();

    // Calculate total amount
    const amount = parseFloat(invoice.amount) || 0;
    const vatRate = parseFloat(invoice.vat) || 0;
    const vatAmount = amount * (vatRate / 100);
    const totalAmount = amount + vatAmount;

    // Prepare template data
    const templateData = {
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      totalAmount: totalAmount.toFixed(2),
      dueDate: invoice.dueDate,
      senderName: emailSettings?.defaultSenderName || companySettings?.contactName || 'Your Name',
      companyName: companySettings?.companyName || 'Your Company'
    };

    // Get templates
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
        console.error('Error generating PDF:', error);
        alert('Error generating PDF: ' + (error.message || 'Unknown error occurred'));
      }
    };

    // Function to open email client
    const openEmailClient = () => {
      const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(finalBody)}`;
      window.location.href = mailtoLink;
    };

    // Show instructions popup with callback functions
    showEmailInstructions('invoice', invoice.invoiceNumber, downloadPDF, openEmailClient);

  } catch (error) {
    console.error('Error creating email:', error);
    alert('Error creating email: ' + (error.message || 'Unknown error occurred'));
  }
};

// Send quote via email (mailto)
const sendQuoteViaEmail = async (quote, companySettings, recipientEmail) => {
  try {
    // Get email settings
    const emailSettings = await getEmailSettings();

    // Calculate total amount
    const amount = parseFloat(quote.amount) || 0;
    const vatRate = parseFloat(quote.vat) || 0;
    const vatAmount = amount * (vatRate / 100);
    const totalAmount = amount + vatAmount;

    // Prepare template data
    const templateData = {
      quoteNumber: quote.quoteNumber,
      clientName: quote.clientName,
      totalAmount: totalAmount.toFixed(2),
      validUntil: quote.validUntil,
      senderName: emailSettings?.defaultSenderName || companySettings?.contactName || 'Your Name',
      companyName: companySettings?.companyName || 'Your Company'
    };

    // Get templates
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
        console.error('Error generating PDF:', error);
        alert('Error generating PDF: ' + (error.message || 'Unknown error occurred'));
      }
    };

    // Function to open email client
    const openEmailClient = () => {
      const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(finalBody)}`;
      window.location.href = mailtoLink;
    };

    // Show instructions popup with callback functions
    showEmailInstructions('quote', quote.quoteNumber, downloadPDF, openEmailClient);

  } catch (error) {
    console.error('Error creating email:', error);
    alert('Error creating email: ' + (error.message || 'Unknown error occurred'));
  }
};

// Generate client statement PDF
const generateClientStatementPDF = async (client, invoices, companySettings, period = 'full') => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 20;

    // Modern minimal header with subtle background
    doc.setFillColor(250, 251, 252);
    doc.rect(0, 0, pageWidth, 50, 'F');

    // Accent line at top
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, pageWidth, 3, 'F');

    // Company logo (larger and better positioned)
    if (companySettings.logo) {
      try {
        doc.addImage(companySettings.logo, 'JPEG', 20, 8, 70, 40);
      } catch (error) {
        console.log('Error adding logo to PDF:', error);
      }
    }

    // Company name and STATEMENT title in header
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(companySettings.name || companySettings.companyName || 'Your Company', pageWidth - 20, 18, { align: 'right' });

    // STATEMENT title in header (centered)
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('STATEMENT', pageWidth / 2, 25, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(75, 85, 99);
    let companyY = 26;

    const fullAddress = [companySettings.address, companySettings.city, companySettings.postcode].filter(Boolean).join(', ');
    if (fullAddress) {
      doc.text(fullAddress, pageWidth - 20, companyY, { align: 'right' });
      companyY += 6;
    }
    if (companySettings.email) {
      doc.text(companySettings.email, pageWidth - 20, companyY, { align: 'right' });
      companyY += 6;
    }
    if (companySettings.phone) {
      doc.text(companySettings.phone, pageWidth - 20, companyY, { align: 'right' });
    }

    currentY = 55;

    // Subtle divider line
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(1);
    doc.line(20, currentY, pageWidth - 20, currentY);

    currentY += 8;

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
    const totalAmount = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const paidAmount = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
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
    doc.setFont(undefined, 'bold');
    doc.setTextColor(17, 24, 39);
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
    if (companySettings.companyNumber) {
      footerText.push(`Company Registration: ${companySettings.companyNumber}`);
    }
    if (companySettings.vatNumber) {
      footerText.push(`VAT Number: ${companySettings.vatNumber}`);
    }

    if (footerText.length > 0) {
      doc.text(footerText.join(' • '), pageWidth / 2, footerY, { align: 'center' });
    }

    doc.setTextColor(99, 102, 241);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Thank you for your business!', pageWidth / 2, footerY + 8, { align: 'center' });

    console.log('Client statement PDF generation completed successfully');
    return doc;
  } catch (error) {
    console.error('Error generating client statement PDF:', error);
    throw error;
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
        const doc = await generateClientStatementPDF(client, invoices, companySettings, period);
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
  sendInvoiceViaEmail, 
  sendQuoteViaEmail,
  generateClientStatementPDF,
  sendClientStatementViaEmail
};