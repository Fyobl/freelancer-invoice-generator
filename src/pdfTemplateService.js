
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase.js';
import jsPDF from 'jspdf';

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

// Replace template variables with actual data
const replaceVariables = (text, data) => {
  if (!text || typeof text !== 'string') return text;
  
  let result = text;
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{${key}}`, 'g');
    result = result.replace(regex, data[key] || '');
  });
  
  return result;
};

// Generate PDF using custom template
export const generatePDFFromTemplate = async (templateType, data, companySettings) => {
  try {
    // Get the default template for this type
    const template = await getDefaultTemplate(templateType);
    
    if (!template) {
      throw new Error(`No default template found for ${templateType}`);
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Prepare data for variable replacement
    const templateData = {
      ...data,
      companyName: companySettings?.companyName || 'Your Company',
      companyAddress: companySettings?.address || '',
      companyPhone: companySettings?.phone || '',
      companyEmail: companySettings?.email || '',
      companyWebsite: companySettings?.website || ''
    };

    // Add company logo if available
    if (companySettings?.logoUrl) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = companySettings.logoUrl;
        
        img.onload = () => {
          doc.addImage(img, 'PNG', 20, 20, 60, 30);
        };
      } catch (error) {
        console.log('Could not load company logo:', error);
      }
    }

    // Render template elements
    template.elements.forEach(element => {
      const content = replaceVariables(element.content, templateData);
      
      // Set font properties
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
      
      const rgb = hexToRgb(element.color || '#000000');
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);

      // Position element (convert from canvas coordinates to PDF coordinates)
      const x = (element.x / 595) * pageWidth;
      const y = (element.y / 842) * pageHeight;

      if (element.type === 'line') {
        doc.setLineWidth(element.height || 1);
        doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
        doc.line(x, y, x + ((element.width / 595) * pageWidth), y);
      } else {
        // Handle text wrapping for long content
        const maxWidth = (element.width / 595) * pageWidth;
        const lines = doc.splitTextToSize(content, maxWidth);
        
        if (lines.length > 1) {
          // Multi-line text
          lines.forEach((line, index) => {
            doc.text(line, x, y + (index * (element.fontSize || 12) * 1.2));
          });
        } else {
          // Single line text
          doc.text(content, x, y);
        }
      }
    });

    // Add footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    return doc;
  } catch (error) {
    console.error('Error generating PDF from template:', error);
    throw error;
  }
};

// Generate invoice PDF using custom template
export const generateInvoicePDFFromTemplate = async (invoice, companySettings) => {
  const invoiceData = {
    invoiceNumber: invoice.invoiceNumber,
    clientName: invoice.clientName,
    amount: parseFloat(invoice.amount).toFixed(2),
    dueDate: invoice.dueDate,
    notes: invoice.notes || 'No additional notes',
    status: invoice.status,
    createdDate: invoice.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString()
  };

  return generatePDFFromTemplate('invoice', invoiceData, companySettings);
};

// Generate quote PDF using custom template
export const generateQuotePDFFromTemplate = async (quote, companySettings) => {
  const quoteData = {
    quoteNumber: quote.quoteNumber,
    clientName: quote.clientName,
    amount: parseFloat(quote.amount).toFixed(2),
    validUntil: quote.validUntil,
    notes: quote.notes || 'No additional notes',
    status: quote.status,
    createdDate: quote.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString()
  };

  return generatePDFFromTemplate('quote', quoteData, companySettings);
};

// Generate statement PDF using custom template
export const generateStatementPDFFromTemplate = async (client, invoices, companySettings, period) => {
  const totalAmount = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
  const paidAmount = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
  const unpaidAmount = invoices.filter(inv => inv.status === 'Unpaid').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

  const statementData = {
    clientName: client.name,
    period: period === 'full' ? 'All Time' : period,
    totalInvoices: invoices.length,
    totalAmount: totalAmount.toFixed(2),
    paidAmount: paidAmount.toFixed(2),
    unpaidAmount: unpaidAmount.toFixed(2),
    statementDate: new Date().toLocaleDateString()
  };

  return generatePDFFromTemplate('statement', statementData, companySettings);
};
