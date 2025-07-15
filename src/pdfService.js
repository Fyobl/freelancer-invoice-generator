
import jsPDF from 'jspdf';

// Helper function to convert image to supported format
const processLogoImage = (logoData) => {
  return new Promise((resolve, reject) => {
    if (!logoData) {
      resolve(null);
      return;
    }

    try {
      // Create a new image to validate and get dimensions
      const img = new Image();
      
      img.onload = function() {
        try {
          // Create canvas to convert image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set canvas size
          canvas.width = this.width;
          canvas.height = this.height;
          
          // Draw image to canvas
          ctx.drawImage(this, 0, 0);
          
          // Convert to JPEG base64 (jsPDF works better with JPEG)
          const processedData = canvas.toDataURL('image/jpeg', 0.8);
          
          resolve({
            data: processedData,
            width: this.width,
            height: this.height
          });
        } catch (error) {
          console.warn('Error processing logo image:', error);
          resolve(null);
        }
      };
      
      img.onerror = function() {
        console.warn('Error loading logo image');
        resolve(null);
      };
      
      // Handle different data formats
      if (logoData.startsWith('data:')) {
        img.src = logoData;
      } else if (logoData.startsWith('http')) {
        // For external URLs, we'll need to handle CORS
        img.crossOrigin = 'anonymous';
        img.src = logoData;
      } else {
        // Assume it's base64 without data URL prefix
        img.src = `data:image/jpeg;base64,${logoData}`;
      }
    } catch (error) {
      console.warn('Error setting up logo processing:', error);
      resolve(null);
    }
  });
};

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

    // Process and add company logo if available
    let logoInfo = null;
    if (companySettings.logo) {
      try {
        logoInfo = await processLogoImage(companySettings.logo);
        if (logoInfo) {
          // Calculate logo dimensions to fit in header
          const maxWidth = 35;
          const maxHeight = 25;
          let logoWidth = maxWidth;
          let logoHeight = maxHeight;
          
          // Maintain aspect ratio
          const aspectRatio = logoInfo.width / logoInfo.height;
          if (aspectRatio > maxWidth / maxHeight) {
            logoHeight = maxWidth / aspectRatio;
          } else {
            logoWidth = maxHeight * aspectRatio;
          }
          
          // Center logo vertically in header
          const logoX = 15;
          const logoY = (40 - logoHeight) / 2;
          
          doc.addImage(logoInfo.data, 'JPEG', logoX, logoY, logoWidth, logoHeight);
        }
      } catch (error) {
        console.warn('Error adding logo to PDF:', error);
        logoInfo = null;
      }
    }

    // Company name and invoice title
    doc.setTextColor(255, 255, 255);
    const hasLogo = logoInfo !== null;
    const companyNameX = hasLogo ? 55 : 20;
    
    doc.setFontSize(hasLogo ? 16 : 20);
    doc.setFont('helvetica', 'bold');
    doc.text(companySettings.name || 'Your Company', companyNameX, 18);

    // Invoice title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('INVOICE', 150, 18);

    // Add a subtle line under header
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.5);
    doc.line(20, 42, 190, 42);

    // Company details section
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    let yPos = 55;

    // Company information in a clean layout
    doc.setFont('helvetica', 'bold');
    doc.text('From:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 4;

    if (companySettings.name) {
      doc.setFont('helvetica', 'bold');
      doc.text(companySettings.name, 20, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 4;
    }

    if (companySettings.address) {
      doc.text(companySettings.address, 20, yPos);
      yPos += 4;
    }
    if (companySettings.city || companySettings.postcode) {
      const cityLine = [companySettings.city, companySettings.postcode].filter(Boolean).join(', ');
      doc.text(cityLine, 20, yPos);
      yPos += 4;
    }
    if (companySettings.country) {
      doc.text(companySettings.country, 20, yPos);
      yPos += 4;
    }
    if (companySettings.phone) {
      doc.text(`Tel: ${companySettings.phone}`, 20, yPos);
      yPos += 4;
    }
    if (companySettings.email) {
      doc.text(`Email: ${companySettings.email}`, 20, yPos);
      yPos += 4;
    }
    if (companySettings.website) {
      doc.text(`Web: ${companySettings.website}`, 20, yPos);
      yPos += 4;
    }
    if (companySettings.vatNumber) {
      doc.text(`VAT: ${companySettings.vatNumber}`, 20, yPos);
      yPos += 4;
    }

    // Invoice details section (right side)
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Details:', 120, 55);

    doc.setFont('helvetica', 'normal');
    doc.text(`Number: ${invoice.invoiceNumber || 'N/A'}`, 120, 62);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 120, 69);
    doc.text(`Due Date: ${invoice.dueDate || 'N/A'}`, 120, 76);
    
    // Status with color
    const statusColor = invoice.status === 'Paid' ? [40, 167, 69] : invoice.status === 'Overdue' ? [220, 53, 69] : [255, 193, 7];
    doc.setTextColor(...statusColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`Status: ${invoice.status || 'Unpaid'}`, 120, 83);

    // Reset text color
    doc.setTextColor(...textColor);

    // Client section
    yPos = Math.max(yPos + 8, 95);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, yPos);

    doc.setFont('helvetica', 'normal');
    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.clientName || 'Client Name', 20, yPos);
    doc.setFont('helvetica', 'normal');

    if (clientData) {
      if (clientData.email) {
        yPos += 4;
        doc.text(clientData.email, 20, yPos);
      }
      if (clientData.phone) {
        yPos += 4;
        doc.text(clientData.phone, 20, yPos);
      }
      if (clientData.address) {
        yPos += 4;
        doc.text(clientData.address, 20, yPos);
      }
    }

    // Items table
    yPos += 15;

    // Table header with better styling
    doc.setFillColor(...primaryColor);
    doc.rect(20, yPos, 170, 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Description', 22, yPos + 5.5);
    doc.text('Qty', 115, yPos + 5.5);
    doc.text('Price', 135, yPos + 5.5);
    doc.text('Total', 165, yPos + 5.5);

    yPos += 8;

    // Table content
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    let itemCount = 0;
    if (invoice.selectedProducts && invoice.selectedProducts.length > 0) {
      // Products from selection
      invoice.selectedProducts.forEach((product, index) => {
        const total = product.price * product.quantity;
        
        // Alternate row colors
        if (index % 2 === 1) {
          doc.setFillColor(248, 249, 250);
          doc.rect(20, yPos, 170, 6, 'F');
        }

        doc.setTextColor(...textColor);
        doc.text(product.name || 'Product', 22, yPos + 4);
        doc.text(product.quantity.toString(), 118, yPos + 4);
        doc.text(`£${product.price.toFixed(2)}`, 138, yPos + 4);
        doc.text(`£${total.toFixed(2)}`, 168, yPos + 4);

        yPos += 6;
        itemCount++;
      });
    } else {
      // Single line item
      doc.text(invoice.description || 'Service/Product', 22, yPos + 4);
      doc.text('1', 118, yPos + 4);
      doc.text(`£${parseFloat(invoice.amount).toFixed(2)}`, 138, yPos + 4);
      doc.text(`£${parseFloat(invoice.amount).toFixed(2)}`, 168, yPos + 4);
      yPos += 6;
      itemCount++;
    }

    // Add some spacing
    yPos += 5;

    // Totals section with better alignment
    const subtotal = parseFloat(invoice.amount);
    const vatAmount = subtotal * (invoice.vat || 0) / 100;
    const total = subtotal + vatAmount;

    // Draw a line above totals
    doc.setDrawColor(...lightGray);
    doc.line(120, yPos, 190, yPos);
    yPos += 5;

    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', 140, yPos);
    doc.text(`£${subtotal.toFixed(2)}`, 175, yPos);

    if (invoice.vat > 0) {
      yPos += 6;
      doc.text(`VAT (${invoice.vat}%):`, 140, yPos);
      doc.text(`£${vatAmount.toFixed(2)}`, 175, yPos);
    }

    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Total:', 140, yPos);
    doc.text(`£${total.toFixed(2)}`, 175, yPos);

    // Notes section
    if (invoice.notes) {
      yPos += 15;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 20, yPos);

      doc.setFont('helvetica', 'normal');
      yPos += 5;
      const splitNotes = doc.splitTextToSize(invoice.notes, 170);
      doc.text(splitNotes, 20, yPos);
    }

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFillColor(...secondaryColor);
    doc.rect(0, pageHeight - 15, 210, 15, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your business!', 20, pageHeight - 8);

    if (companySettings.name) {
      doc.text(`Generated by ${companySettings.name}`, 20, pageHeight - 4);
    }

    return doc;

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF: ' + error.message);
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

    // Process and add company logo if available
    let logoInfo = null;
    if (companySettings.logo) {
      try {
        logoInfo = await processLogoImage(companySettings.logo);
        if (logoInfo) {
          const maxWidth = 35;
          const maxHeight = 25;
          let logoWidth = maxWidth;
          let logoHeight = maxHeight;
          
          const aspectRatio = logoInfo.width / logoInfo.height;
          if (aspectRatio > maxWidth / maxHeight) {
            logoHeight = maxWidth / aspectRatio;
          } else {
            logoWidth = maxHeight * aspectRatio;
          }
          
          const logoX = 15;
          const logoY = (40 - logoHeight) / 2;
          
          doc.addImage(logoInfo.data, 'JPEG', logoX, logoY, logoWidth, logoHeight);
        }
      } catch (error) {
        console.warn('Error adding logo to quote PDF:', error);
        logoInfo = null;
      }
    }

    doc.setTextColor(255, 255, 255);
    const hasLogo = logoInfo !== null;
    const companyNameX = hasLogo ? 55 : 20;
    
    doc.setFontSize(hasLogo ? 16 : 20);
    doc.setFont('helvetica', 'bold');
    doc.text(companySettings.name || 'Your Company', companyNameX, 18);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('QUOTE', 150, 18);

    // Add a subtle line under header
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.5);
    doc.line(20, 42, 190, 42);

    // Company details
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    let yPos = 55;

    doc.setFont('helvetica', 'bold');
    doc.text('From:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 4;

    if (companySettings.name) {
      doc.setFont('helvetica', 'bold');
      doc.text(companySettings.name, 20, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 4;
    }

    if (companySettings.address) {
      doc.text(companySettings.address, 20, yPos);
      yPos += 4;
    }
    if (companySettings.city || companySettings.postcode) {
      const cityLine = [companySettings.city, companySettings.postcode].filter(Boolean).join(', ');
      doc.text(cityLine, 20, yPos);
      yPos += 4;
    }
    if (companySettings.country) {
      doc.text(companySettings.country, 20, yPos);
      yPos += 4;
    }
    if (companySettings.phone) {
      doc.text(`Tel: ${companySettings.phone}`, 20, yPos);
      yPos += 4;
    }
    if (companySettings.email) {
      doc.text(`Email: ${companySettings.email}`, 20, yPos);
      yPos += 4;
    }
    if (companySettings.website) {
      doc.text(`Web: ${companySettings.website}`, 20, yPos);
      yPos += 4;
    }

    // Quote details
    doc.setFont('helvetica', 'bold');
    doc.text('Quote Details:', 120, 55);

    doc.setFont('helvetica', 'normal');
    doc.text(`Number: ${quote.quoteNumber || 'N/A'}`, 120, 62);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 120, 69);
    doc.text(`Valid Until: ${quote.validUntil || 'N/A'}`, 120, 76);

    // Client section
    yPos = Math.max(yPos + 8, 95);
    doc.setFont('helvetica', 'bold');
    doc.text('Quote For:', 20, yPos);

    doc.setFont('helvetica', 'normal');
    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text(quote.clientName || 'Client Name', 20, yPos);
    doc.setFont('helvetica', 'normal');

    if (clientData) {
      if (clientData.email) {
        yPos += 4;
        doc.text(clientData.email, 20, yPos);
      }
      if (clientData.phone) {
        yPos += 4;
        doc.text(clientData.phone, 20, yPos);
      }
    }

    // Items table (same as invoice)
    yPos += 15;

    doc.setFillColor(...primaryColor);
    doc.rect(20, yPos, 170, 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Description', 22, yPos + 5.5);
    doc.text('Qty', 115, yPos + 5.5);
    doc.text('Price', 135, yPos + 5.5);
    doc.text('Total', 165, yPos + 5.5);

    yPos += 8;

    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');

    if (quote.selectedProducts && quote.selectedProducts.length > 0) {
      quote.selectedProducts.forEach((product, index) => {
        const total = product.price * product.quantity;

        if (index % 2 === 1) {
          doc.setFillColor(248, 249, 250);
          doc.rect(20, yPos, 170, 6, 'F');
        }

        doc.setTextColor(...textColor);
        doc.text(product.name || 'Product', 22, yPos + 4);
        doc.text(product.quantity.toString(), 118, yPos + 4);
        doc.text(`£${product.price.toFixed(2)}`, 138, yPos + 4);
        doc.text(`£${total.toFixed(2)}`, 168, yPos + 4);

        yPos += 6;
      });
    } else {
      doc.text(quote.description || 'Service/Product', 22, yPos + 4);
      doc.text('1', 118, yPos + 4);
      doc.text(`£${parseFloat(quote.amount).toFixed(2)}`, 138, yPos + 4);
      doc.text(`£${parseFloat(quote.amount).toFixed(2)}`, 168, yPos + 4);
      yPos += 6;
    }

    // Totals
    yPos += 5;
    const subtotal = parseFloat(quote.amount);
    const vatAmount = subtotal * (quote.vat || 0) / 100;
    const total = subtotal + vatAmount;

    doc.setDrawColor(...lightGray);
    doc.line(120, yPos, 190, yPos);
    yPos += 5;

    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', 140, yPos);
    doc.text(`£${subtotal.toFixed(2)}`, 175, yPos);

    if (quote.vat > 0) {
      yPos += 6;
      doc.text(`VAT (${quote.vat}%):`, 140, yPos);
      doc.text(`£${vatAmount.toFixed(2)}`, 175, yPos);
    }

    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Total:', 140, yPos);
    doc.text(`£${total.toFixed(2)}`, 175, yPos);

    // Notes
    if (quote.notes) {
      yPos += 15;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 20, yPos);

      doc.setFont('helvetica', 'normal');
      yPos += 5;
      const splitNotes = doc.splitTextToSize(quote.notes, 170);
      doc.text(splitNotes, 20, yPos);
    }

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFillColor(...secondaryColor);
    doc.rect(0, pageHeight - 15, 210, 15, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for considering our services!', 20, pageHeight - 8);

    return doc;

  } catch (error) {
    console.error('Error generating quote PDF:', error);
    throw new Error('Failed to generate quote PDF: ' + error.message);
  }
};

export const generateStatementPDF = async (client, invoices, companySettings = {}, period = 'All Time') => {
  try {
    const doc = new jsPDF();

    const primaryColor = [102, 126, 234];
    const secondaryColor = [118, 75, 162];
    const textColor = [51, 51, 51];
    const lightGray = [128, 128, 128];

    doc.setFont('helvetica');

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');

    // Process and add company logo if available
    let logoInfo = null;
    if (companySettings.logo) {
      try {
        logoInfo = await processLogoImage(companySettings.logo);
        if (logoInfo) {
          const maxWidth = 35;
          const maxHeight = 25;
          let logoWidth = maxWidth;
          let logoHeight = maxHeight;
          
          const aspectRatio = logoInfo.width / logoInfo.height;
          if (aspectRatio > maxWidth / maxHeight) {
            logoHeight = maxWidth / aspectRatio;
          } else {
            logoWidth = maxHeight * aspectRatio;
          }
          
          const logoX = 15;
          const logoY = (40 - logoHeight) / 2;
          
          doc.addImage(logoInfo.data, 'JPEG', logoX, logoY, logoWidth, logoHeight);
        }
      } catch (error) {
        console.warn('Error adding logo to statement PDF:', error);
        logoInfo = null;
      }
    }

    doc.setTextColor(255, 255, 255);
    const hasLogo = logoInfo !== null;
    const companyNameX = hasLogo ? 55 : 20;
    
    doc.setFontSize(hasLogo ? 16 : 20);
    doc.setFont('helvetica', 'bold');
    doc.text(companySettings.name || 'Your Company', companyNameX, 18);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('STATEMENT', 150, 18);

    // Add a subtle line under header
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.5);
    doc.line(20, 42, 190, 42);

    // Company and client details
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    let yPos = 55;

    doc.setFont('helvetica', 'bold');
    doc.text('Statement For:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text(client.name || 'Client Name', 20, yPos);
    doc.setFont('helvetica', 'normal');

    if (client.email) {
      yPos += 4;
      doc.text(client.email, 20, yPos);
    }

    // Date range
    doc.setFont('helvetica', 'bold');
    doc.text('Statement Details:', 120, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`Period: ${period}`, 120, 62);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 120, 69);

    // Invoices table
    yPos = 85;

    doc.setFillColor(...primaryColor);
    doc.rect(20, yPos, 170, 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Invoice', 22, yPos + 5.5);
    doc.text('Date', 65, yPos + 5.5);
    doc.text('Due Date', 100, yPos + 5.5);
    doc.text('Amount', 135, yPos + 5.5);
    doc.text('Status', 165, yPos + 5.5);

    yPos += 8;

    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');

    let totalOwed = 0;
    let totalPaid = 0;

    invoices.forEach((invoice, index) => {
      if (index % 2 === 1) {
        doc.setFillColor(248, 249, 250);
        doc.rect(20, yPos, 170, 6, 'F');
      }

      doc.setTextColor(...textColor);
      doc.text(invoice.invoiceNumber || 'N/A', 22, yPos + 4);
      doc.text(invoice.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A', 65, yPos + 4);
      doc.text(invoice.dueDate || 'N/A', 100, yPos + 4);
      doc.text(`£${parseFloat(invoice.amount).toFixed(2)}`, 138, yPos + 4);
      doc.text(invoice.status || 'Unpaid', 168, yPos + 4);

      if (invoice.status === 'Paid') {
        totalPaid += parseFloat(invoice.amount);
      } else {
        totalOwed += parseFloat(invoice.amount);
      }

      yPos += 6;
    });

    // Summary
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Summary:', 20, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.text(`Total Paid: £${totalPaid.toFixed(2)}`, 22, yPos);
    yPos += 6;
    doc.text(`Total Outstanding: £${totalOwed.toFixed(2)}`, 22, yPos);

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFillColor(...secondaryColor);
    doc.rect(0, pageHeight - 15, 210, 15, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('Account Statement', 20, pageHeight - 8);

    return doc;

  } catch (error) {
    console.error('Error generating statement PDF:', error);
    throw new Error('Failed to generate statement PDF: ' + error.message);
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
