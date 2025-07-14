import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase.js';
import { jsPDF } from 'jspdf';

// Fetch templates from Firestore
export const fetchPDFTemplates = async () => {
  try {
    const templatesSnapshot = await getDocs(collection(db, 'pdfTemplates'));
    const templates = templatesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return templates;
  } catch (error) {
    console.error('Error fetching PDF templates:', error);
    return [];
  }
};

// Get default template for a type
export const getDefaultTemplate = async (type) => {
  try {
    const q = query(
      collection(db, 'pdfTemplates'),
      where('type', '==', type),
      where('isDefault', '==', true)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }

    return null;
  } catch (error) {
    console.error('Error fetching default template:', error);
    return null;
  }
};

// Get company settings for current user
const getCompanySettings = async () => {
  try {
    if (!auth.currentUser) return null;
    const q = query(collection(db, 'companySettings'), where('userId', '==', auth.currentUser.uid));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return snapshot.docs[0].data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching company settings:', error);
    return null;
  }
};

// Replace template variables with actual data
const replaceVariables = (text, data) => {
  if (!text || typeof text !== 'string') return text;

  let result = text;
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, data[key] || '');
  });

  return result;
};

// Render template element on PDF
const renderElement = (doc, element, data) => {
  const content = replaceVariables(element.content, data);

  switch (element.type) {
    case 'text':
    case 'variable':
    case 'header':
      if (content && content !== element.content) {
        doc.setFontSize(element.fontSize || 12);
        doc.setFont(undefined, element.fontWeight || 'normal');

        // Convert hex color to RGB
        const hexToRgb = (hex) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
          ] : [0, 0, 0];
        };

        const color = element.color === 'white' ? [255, 255, 255] : hexToRgb(element.color || '#000000');
        doc.setTextColor(...color);

        // Handle multiline text
        if (content.includes('\n')) {
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            doc.text(line, element.x, element.y + (index * (element.fontSize || 12)));
          });
        } else {
          doc.text(content, element.x, element.y);
        }
      }
      break;

    case 'line':
      const lineColor = element.color === 'white' ? [255, 255, 255] : element.color?.startsWith('#') ? 
        [
          parseInt(element.color.slice(1, 3), 16),
          parseInt(element.color.slice(3, 5), 16),
          parseInt(element.color.slice(5, 7), 16)
        ] : [0, 0, 0];

      doc.setDrawColor(...lineColor);
      doc.setLineWidth(element.height || 1);
      doc.line(element.x, element.y, element.x + element.width, element.y);
      break;

    case 'rectangle':
      const rectColor = element.color?.startsWith('#') ? 
        [
          parseInt(element.color.slice(1, 3), 16),
          parseInt(element.color.slice(3, 5), 16),
          parseInt(element.color.slice(5, 7), 16)
        ] : [103, 126, 234]; // Default to theme color

      doc.setFillColor(...rectColor);
      doc.rect(element.x, element.y, element.width, element.height, 'F');
      break;

    case 'image':
      if (element.content === '{companyLogo}' && data.companyLogo) {
        try {
          doc.addImage(data.companyLogo, 'JPEG', element.x, element.y, element.width, element.height);
        } catch (error) {
          console.log('Error adding logo to PDF:', error);
          // Draw placeholder
          doc.setDrawColor(200, 200, 200);
          doc.rect(element.x, element.y, element.width, element.height);
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text('Logo', element.x + element.width/2, element.y + element.height/2, { align: 'center' });
        }
      }
      break;
  }
};

// Generate invoice PDF from template
export const generateInvoicePDFFromTemplate = async (invoice, companySettings) => {
  try {
    const template = await getDefaultTemplate('invoice');
    if (!template) {
      throw new Error('No default invoice template found');
    }

    const doc = new jsPDF();

    // Prepare data for template
    const templateData = {
      // Company data
      companyName: companySettings?.name || '',
      companyAddress: companySettings?.address || '',
      companyCity: companySettings?.city || '',
      companyPostcode: companySettings?.postcode || '',
      companyPhone: companySettings?.phone || '',
      companyEmail: companySettings?.email || '',
      companyNumber: companySettings?.companyNumber || '',
      vatNumber: companySettings?.vatNumber || '',
      companyLogo: companySettings?.logo || '',

      // Invoice data
      clientName: invoice.clientName || '',
      invoiceNumber: invoice.invoiceNumber || '',
      createdDate: invoice.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString(),
      dueDate: invoice.dueDate || 'Upon receipt',
      status: invoice.status || 'Unpaid',
      amount: (parseFloat(invoice.amount) || 0).toFixed(2),
      notes: invoice.notes || ''
    };

    // Render all template elements
    template.elements.forEach(element => {
      renderElement(doc, element, templateData);
    });

    return doc;
  } catch (error) {
    console.error('Error generating invoice PDF from template:', error);
    throw error;
  }
};

// Generate quote PDF from template
export const generateQuotePDFFromTemplate = async (quote, companySettings) => {
  try {
    const template = await getDefaultTemplate('quote');
    if (!template) {
      throw new Error('No default quote template found');
    }

    const doc = new jsPDF();

    // Prepare data for template
    const templateData = {
      // Company data
      companyName: companySettings?.name || '',
      companyAddress: companySettings?.address || '',
      companyCity: companySettings?.city || '',
      companyPostcode: companySettings?.postcode || '',
      companyPhone: companySettings?.phone || '',
      companyEmail: companySettings?.email || '',
      companyNumber: companySettings?.companyNumber || '',
      vatNumber: companySettings?.vatNumber || '',
      companyLogo: companySettings?.logo || '',

      // Quote data
      clientName: quote.clientName || '',
      quoteNumber: quote.quoteNumber || '',
      createdDate: quote.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString(),
      validUntil: quote.validUntil || 'Upon acceptance',
      status: quote.status || 'Pending',
      amount: (parseFloat(quote.amount) || 0).toFixed(2),
      notes: quote.notes || '',
      productName: quote.productName || 'Professional Services'
    };

    // Render all template elements
    template.elements.forEach(element => {
      renderElement(doc, element, templateData);
    });

    return doc;
  } catch (error) {
    console.error('Error generating quote PDF from template:', error);
    throw error;
  }
};

// Generate statement PDF from template
export const generateStatementPDFFromTemplate = async (client, invoices, companySettings, period = 'full') => {
  try {
    const template = await getDefaultTemplate('statement');
    if (!template) {
      throw new Error('No default statement template found');
    }

    const doc = new jsPDF();

    // Calculate totals
    const totalAmount = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const paidAmount = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const unpaidAmount = invoices.filter(inv => inv.status === 'Unpaid').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

    // Prepare data for template
    const templateData = {
      // Company data
      companyName: companySettings?.name || '',
      companyAddress: companySettings?.address || '',
      companyCity: companySettings?.city || '',
      companyPostcode: companySettings?.postcode || '',
      companyPhone: companySettings?.phone || '',
      companyEmail: companySettings?.email || '',
      companyNumber: companySettings?.companyNumber || '',
      vatNumber: companySettings?.vatNumber || '',
      companyLogo: companySettings?.logo || '',

      // Statement data
      clientName: client.name || '',
      period: period === 'full' ? 'All Time' : period,
      statementDate: new Date().toLocaleDateString(),
      totalInvoices: invoices.length.toString(),
      totalAmount: totalAmount.toFixed(2),
      paidAmount: paidAmount.toFixed(2),
      unpaidAmount: unpaidAmount.toFixed(2)
    };

    // Render all template elements
    template.elements.forEach(element => {
      renderElement(doc, element, templateData);
    });

    // Add invoice table data (simplified for now)
    const startY = 420;
    let currentY = startY;

    invoices.slice(0, 10).forEach((invoice, index) => { // Limit to first 10 invoices
      const y = currentY + (index * 15);

      doc.setFontSize(9);
      doc.setTextColor(51, 51, 51);
      doc.text(invoice.invoiceNumber || 'N/A', 35, y);
      doc.text(invoice.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A', 130, y);

      // Status with color
      if (invoice.status === 'Paid') {
        doc.setTextColor(40, 167, 69);
      } else if (invoice.status === 'Overdue') {
        doc.setTextColor(220, 53, 69);
      } else {
        doc.setTextColor(255, 193, 7);
      }
      doc.text(invoice.status || 'Unpaid', 220, y);

      doc.setTextColor(51, 51, 51);
      doc.text(`£${(parseFloat(invoice.amount) || 0).toFixed(2)}`, 500, y);
    });

    return doc;
  } catch (error) {
    console.error('Error generating statement PDF from template:', error);
    throw error;
  }
};