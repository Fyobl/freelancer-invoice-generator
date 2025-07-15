import jsPDF from 'jspdf';

export const generateInvoicePDF = async (invoice, companySettings = {}, clientData = null) => {
  try {
    const doc = new jsPDF();

    // Company branding colors (matching your purple gradient theme)
    const primaryColor = [102, 126, 234]; // #667eea
    const secondaryColor = [118, 75, 162]; // #764ba2
    const textColor = [51, 51, 51]; // #333
    const lightGray = [128, 128, 128]; // #808080

    // Set font
    doc.setFont('helvetica');

    // Header section with company branding
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');

    // Add company logo if available
    let logoYOffset = 0;
    if (companySettings.logo) {
      try {
        // Add logo to the header
        doc.addImage(companySettings.logo, 'JPEG', 20, 8, 30, 24); // x, y, width, height
        logoYOffset = 35; // Adjust text position if logo is present
      } catch (error) {
        console.warn('Error adding logo to PDF:', error);
      }
    }

    // Company name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(companySettings.logo ? 18 : 24);
    doc.setFont('helvetica', 'bold');
    const companyNameX = companySettings.logo ? 55 : 20;
    doc.text(companySettings.name || 'Your Company', companyNameX, 25);

    // Invoice title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('INVOICE', 150, 25);

    // Company details section
    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    let yPos = 50;

    if (companySettings.address) {
      doc.text(`Address: ${companySettings.address}`, 20, yPos);
      yPos += 6;
    }
    if (companySettings.city) {
      doc.text(`${companySettings.city}${companySettings.postcode ? ', ' + companySettings.postcode : ''}`, 20, yPos);
      yPos += 6;
    }
    if (companySettings.country) {
      doc.text(`${companySettings.country}`, 20, yPos);
      yPos += 6;
    }
    if (companySettings.phone) {
      doc.text(`Phone: ${companySettings.phone}`, 20, yPos);
      yPos += 6;
    }
    if (companySettings.email) {
      doc.text(`Email: ${companySettings.email}`, 20, yPos);
      yPos += 6;
    }
    if (companySettings.website) {
      doc.text(`Website: ${companySettings.website}`, 20, yPos);
      yPos += 6;
    }
    if (companySettings.vatNumber) {
      doc.text(`VAT: ${companySettings.vatNumber}`, 20, yPos);
      yPos += 6;
    }
    if (companySettings.companyNumber) {
      doc.text(`Company No: ${companySettings.companyNumber}`, 20, yPos);
      yPos += 6;
    }

    // Invoice details section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Details', 120, 50);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Invoice Number: ${invoice.invoiceNumber || 'N/A'}`, 120, 60);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 120, 70);
    doc.text(`Due Date: ${invoice.dueDate || 'N/A'}`, 120, 80);
    doc.text(`Status: ${invoice.status || 'Unpaid'}`, 120, 90);

    // Client section
    yPos = Math.max(yPos + 10, 100);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    yPos += 10;
    doc.text(invoice.clientName || 'Client Name', 20, yPos);

    if (clientData) {
      if (clientData.email) {
        yPos += 6;
        doc.text(clientData.email, 20, yPos);
      }
      if (clientData.phone) {
        yPos += 6;
        doc.text(clientData.phone, 20, yPos);
      }
      if (clientData.address) {
        yPos += 6;
        doc.text(clientData.address, 20, yPos);
      }
    }

    // Items table
    yPos += 20;

    // Table header
    doc.setFillColor(...primaryColor);
    doc.rect(20, yPos, 170, 10, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Description', 25, yPos + 7);
    doc.text('Qty', 120, yPos + 7);
    doc.text('Price', 140, yPos + 7);
    doc.text('Total', 170, yPos + 7);

    yPos += 10;

    // Table content
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');

    if (invoice.selectedProducts && invoice.selectedProducts.length > 0) {
      // Products from selection
      invoice.selectedProducts.forEach((product, index) => {
        const total = product.price * product.quantity;

        doc.text(product.name || 'Product', 25, yPos + 7);
        doc.text(product.quantity.toString(), 125, yPos + 7);
        doc.text(`£${product.price.toFixed(2)}`, 145, yPos + 7);
        doc.text(`£${total.toFixed(2)}`, 175, yPos + 7);

        yPos += 10;

        // Add line between items
        if (index < invoice.selectedProducts.length - 1) {
          doc.setDrawColor(...lightGray);
          doc.line(20, yPos, 190, yPos);
        }
      });
    } else {
      // Single line item
      doc.text('Service/Product', 25, yPos + 7);
      doc.text('1', 125, yPos + 7);
      doc.text(`£${parseFloat(invoice.amount).toFixed(2)}`, 145, yPos + 7);
      doc.text(`£${parseFloat(invoice.amount).toFixed(2)}`, 175, yPos + 7);
      yPos += 10;
    }

    // Totals section
    yPos += 10;
    const subtotal = parseFloat(invoice.amount);
    const vatAmount = subtotal * (invoice.vat || 0) / 100;
    const total = subtotal + vatAmount;

    doc.setFont('helvetica', 'bold');
    doc.text('Subtotal:', 140, yPos);
    doc.text(`£${subtotal.toFixed(2)}`, 175, yPos);

    if (invoice.vat > 0) {
      yPos += 8;
      doc.text(`VAT (${invoice.vat}%):`, 140, yPos);
      doc.text(`£${vatAmount.toFixed(2)}`, 175, yPos);
    }

    yPos += 8;
    doc.setFontSize(12);
    doc.text('Total:', 140, yPos);
    doc.text(`£${total.toFixed(2)}`, 175, yPos);

    // Notes section
    if (invoice.notes) {
      yPos += 20;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 20, yPos);

      doc.setFont('helvetica', 'normal');
      yPos += 8;
      const splitNotes = doc.splitTextToSize(invoice.notes, 170);
      doc.text(splitNotes, 20, yPos);
    }

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFillColor(...secondaryColor);
    doc.rect(0, pageHeight - 20, 210, 20, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your business!', 20, pageHeight - 10);

    if (companySettings.name) {
      doc.text(`Generated by ${companySettings.name}`, 20, pageHeight - 5);
    }

    return doc;

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

export const generateQuotePDF = async (quote, companySettings = {}, clientData = null) => {
  try {
    const doc = new jsPDF();

    // Same styling as invoice but with "QUOTE" title
    const primaryColor = [102, 126, 234];
    const secondaryColor = [118, 75, 162];
    const textColor = [51, 51, 51];
    const lightGray = [128, 128, 128];

    doc.setFont('helvetica');

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');

    // Add company logo if available
    if (companySettings.logo) {
      try {
        doc.addImage(companySettings.logo, 'JPEG', 20, 8, 30, 24);
      } catch (error) {
        console.warn('Error adding logo to quote PDF:', error);
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(companySettings.logo ? 18 : 24);
    doc.setFont('helvetica', 'bold');
    const companyNameX = companySettings.logo ? 55 : 20;
    doc.text(companySettings.name || 'Your Company', companyNameX, 25);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('QUOTE', 150, 25);

    // Company details
    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    let yPos = 50;

    if (companySettings.address) {
      doc.text(`Address: ${companySettings.address}`, 20, yPos);
      yPos += 6;
    }
    if (companySettings.city) {
      doc.text(`${companySettings.city}${companySettings.postcode ? ', ' + companySettings.postcode : ''}`, 20, yPos);
      yPos += 6;
    }
    if (companySettings.country) {
      doc.text(`${companySettings.country}`, 20, yPos);
      yPos += 6;
    }
    if (companySettings.phone) {
      doc.text(`Phone: ${companySettings.phone}`, 20, yPos);
      yPos += 6;
    }
    if (companySettings.email) {
      doc.text(`Email: ${companySettings.email}`, 20, yPos);
      yPos += 6;
    }
    if (companySettings.website) {
      doc.text(`Website: ${companySettings.website}`, 20, yPos);
      yPos += 6;
    }

    // Quote details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Quote Details', 120, 50);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Quote Number: ${quote.quoteNumber || 'N/A'}`, 120, 60);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 120, 70);
    doc.text(`Valid Until: ${quote.validUntil || 'N/A'}`, 120, 80);

    // Client section
    yPos = Math.max(yPos + 10, 100);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Quote For:', 20, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    yPos += 10;
    doc.text(quote.clientName || 'Client Name', 20, yPos);

    if (clientData) {
      if (clientData.email) {
        yPos += 6;
        doc.text(clientData.email, 20, yPos);
      }
      if (clientData.phone) {
        yPos += 6;
        doc.text(clientData.phone, 20, yPos);
      }
    }

    // Items table (same as invoice)
    yPos += 20;

    doc.setFillColor(...primaryColor);
    doc.rect(20, yPos, 170, 10, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Description', 25, yPos + 7);
    doc.text('Qty', 120, yPos + 7);
    doc.text('Price', 140, yPos + 7);
    doc.text('Total', 170, yPos + 7);

    yPos += 10;

    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');

    if (quote.selectedProducts && quote.selectedProducts.length > 0) {
      quote.selectedProducts.forEach((product, index) => {
        const total = product.price * product.quantity;

        doc.text(product.name || 'Product', 25, yPos + 7);
        doc.text(product.quantity.toString(), 125, yPos + 7);
        doc.text(`£${product.price.toFixed(2)}`, 145, yPos + 7);
        doc.text(`£${total.toFixed(2)}`, 175, yPos + 7);

        yPos += 10;
      });
    } else {
      doc.text('Service/Product', 25, yPos + 7);
      doc.text('1', 125, yPos + 7);
      doc.text(`£${parseFloat(quote.amount).toFixed(2)}`, 145, yPos + 7);
      doc.text(`£${parseFloat(quote.amount).toFixed(2)}`, 175, yPos + 7);
      yPos += 10;
    }

    // Totals
    yPos += 10;
    const subtotal = parseFloat(quote.amount);
    const vatAmount = subtotal * (quote.vat || 0) / 100;
    const total = subtotal + vatAmount;

    doc.setFont('helvetica', 'bold');
    doc.text('Subtotal:', 140, yPos);
    doc.text(`£${subtotal.toFixed(2)}`, 175, yPos);

    if (quote.vat > 0) {
      yPos += 8;
      doc.text(`VAT (${quote.vat}%):`, 140, yPos);
      doc.text(`£${vatAmount.toFixed(2)}`, 175, yPos);
    }

    yPos += 8;
    doc.setFontSize(12);
    doc.text('Total:', 140, yPos);
    doc.text(`£${total.toFixed(2)}`, 175, yPos);

    // Notes
    if (quote.notes) {
      yPos += 20;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 20, yPos);

      doc.setFont('helvetica', 'normal');
      yPos += 8;
      const splitNotes = doc.splitTextToSize(quote.notes, 170);
      doc.text(splitNotes, 20, yPos);
    }

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFillColor(...secondaryColor);
    doc.rect(0, pageHeight - 20, 210, 20, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for considering our services!', 20, pageHeight - 10);

    return doc;

  } catch (error) {
    console.error('Error generating quote PDF:', error);
    throw new Error('Failed to generate quote PDF');
  }
};

export const generateStatementPDF = async (client, invoices, companySettings = {}) => {
  try {
    const doc = new jsPDF();

    const primaryColor = [102, 126, 234];
    const secondaryColor = [118, 75, 162];
    const textColor = [51, 51, 51];

    doc.setFont('helvetica');

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');

    // Add company logo if available
    if (companySettings.logo) {
      try {
        doc.addImage(companySettings.logo, 'JPEG', 20, 8, 30, 24);
      } catch (error) {
        console.warn('Error adding logo to statement PDF:', error);
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(companySettings.logo ? 18 : 24);
    doc.setFont('helvetica', 'bold');
    const companyNameX = companySettings.logo ? 55 : 20;
    doc.text(companySettings.name || 'Your Company', companyNameX, 25);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('STATEMENT', 150, 25);

    // Company and client details
    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    let yPos = 50;

    doc.setFont('helvetica', 'bold');
    doc.text('Statement For:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 8;
    doc.text(client.name || 'Client Name', 20, yPos);

    if (client.email) {
      yPos += 6;
      doc.text(client.email, 20, yPos);
    }

    // Date range
    doc.setFont('helvetica', 'bold');
    doc.text('Statement Date:', 120, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString(), 120, 60);

    // Invoices table
    yPos = 80;

    doc.setFillColor(...primaryColor);
    doc.rect(20, yPos, 170, 10, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Invoice', 25, yPos + 7);
    doc.text('Date', 70, yPos + 7);
    doc.text('Due Date', 110, yPos + 7);
    doc.text('Amount', 140, yPos + 7);
    doc.text('Status', 170, yPos + 7);

    yPos += 10;

    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');

    let totalOwed = 0;
    let totalPaid = 0;

    invoices.forEach((invoice, index) => {
      doc.text(invoice.invoiceNumber || 'N/A', 25, yPos + 7);
      doc.text(invoice.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A', 70, yPos + 7);
      doc.text(invoice.dueDate || 'N/A', 110, yPos + 7);
      doc.text(`£${parseFloat(invoice.amount).toFixed(2)}`, 145, yPos + 7);
      doc.text(invoice.status || 'Unpaid', 175, yPos + 7);

      if (invoice.status === 'Paid') {
        totalPaid += parseFloat(invoice.amount);
      } else {
        totalOwed += parseFloat(invoice.amount);
      }

      yPos += 10;
    });

    // Summary
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Summary:', 20, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.text(`Total Paid: £${totalPaid.toFixed(2)}`, 25, yPos);
    yPos += 8;
    doc.text(`Total Outstanding: £${totalOwed.toFixed(2)}`, 25, yPos);

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFillColor(...secondaryColor);
    doc.rect(0, pageHeight - 20, 210, 20, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('Account Statement', 20, pageHeight - 10);

    return doc;

  } catch (error) {
    console.error('Error generating statement PDF:', error);
    throw new Error('Failed to generate statement PDF');
  }
};

export const downloadPDF = (doc, filename) => {
  try {
    doc.save(filename);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw new Error('Failed to download PDF');
  }
};