
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase.js';
import Navigation from './Navigation.js';
import { generateInvoicePDF, generateQuotePDF, generateStatementPDF } from './emailService.js';

function PDFTemplateCreator({ user }) {
  const [templates, setTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [templateType, setTemplateType] = useState('invoice'); // invoice, quote, statement
  const [templateName, setTemplateName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [draggedElement, setDraggedElement] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [saved, setSaved] = useState(false);

  // Check if user is admin
  const adminEmails = ['fyobl007@gmail.com', 'fyobl_ben@hotmail.com'];
  const isAdmin = adminEmails.includes(user?.email);

  useEffect(() => {
    if (isAdmin) {
      fetchTemplates();
      createDefaultTemplates();
    }
  }, [isAdmin]);

  const fetchTemplates = async () => {
    try {
      const templatesSnapshot = await getDocs(collection(db, 'pdfTemplates'));
      const templatesData = templatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const createDefaultTemplates = async () => {
    try {
      // Check if default templates already exist
      const templatesSnapshot = await getDocs(collection(db, 'pdfTemplates'));
      const existingTemplates = templatesSnapshot.docs.map(doc => doc.data());
      
      const hasInvoiceTemplate = existingTemplates.some(t => t.type === 'invoice' && t.name === 'Professional Invoice');
      const hasQuoteTemplate = existingTemplates.some(t => t.type === 'quote' && t.name === 'Professional Quote');
      const hasStatementTemplate = existingTemplates.some(t => t.type === 'statement' && t.name === 'Professional Statement');

      // Create invoice template if it doesn't exist
      if (!hasInvoiceTemplate) {
        const invoiceTemplate = {
          id: 'default_invoice_template',
          name: 'Professional Invoice',
          type: 'invoice',
          isDefault: true,
          elements: [
            // Header section
            { id: 'logo', type: 'image', content: '{companyLogo}', x: 30, y: 30, width: 80, height: 40, fontSize: 12, fontWeight: 'normal', color: '#333' },
            { id: 'header_title', type: 'header', content: 'INVOICE', x: 262, y: 40, width: 100, height: 30, fontSize: 24, fontWeight: 'bold', color: '#667eea' },
            { id: 'company_details', type: 'text', content: '{companyName}\n{companyAddress}\n{companyCity}, {companyPostcode}\n{companyPhone}\n{companyEmail}', x: 400, y: 30, width: 165, height: 80, fontSize: 10, fontWeight: 'normal', color: '#333' },
            
            // Divider line
            { id: 'header_line', type: 'line', content: '', x: 30, y: 120, width: 535, height: 2, fontSize: 12, fontWeight: 'normal', color: '#667eea' },
            
            // Bill To section
            { id: 'bill_to_label', type: 'text', content: 'BILL TO:', x: 30, y: 140, width: 80, height: 20, fontSize: 12, fontWeight: 'bold', color: '#667eea' },
            { id: 'client_name', type: 'text', content: '{clientName}', x: 30, y: 160, width: 200, height: 20, fontSize: 14, fontWeight: 'bold', color: '#333' },
            
            // Invoice details
            { id: 'invoice_number_label', type: 'text', content: 'Invoice Number:', x: 400, y: 140, width: 100, height: 15, fontSize: 10, fontWeight: 'bold', color: '#666' },
            { id: 'invoice_number', type: 'text', content: '{invoiceNumber}', x: 400, y: 155, width: 100, height: 15, fontSize: 12, fontWeight: 'normal', color: '#333' },
            { id: 'date_label', type: 'text', content: 'Date:', x: 400, y: 175, width: 100, height: 15, fontSize: 10, fontWeight: 'bold', color: '#666' },
            { id: 'date', type: 'text', content: '{createdDate}', x: 400, y: 190, width: 100, height: 15, fontSize: 12, fontWeight: 'normal', color: '#333' },
            { id: 'due_date_label', type: 'text', content: 'Due Date:', x: 400, y: 210, width: 100, height: 15, fontSize: 10, fontWeight: 'bold', color: '#666' },
            { id: 'due_date', type: 'text', content: '{dueDate}', x: 400, y: 225, width: 100, height: 15, fontSize: 12, fontWeight: 'normal', color: '#333' },
            
            // Items table header
            { id: 'items_header_bg', type: 'rectangle', content: '', x: 30, y: 280, width: 535, height: 25, fontSize: 12, fontWeight: 'normal', color: '#667eea' },
            { id: 'description_header', type: 'text', content: 'DESCRIPTION', x: 35, y: 295, width: 300, height: 15, fontSize: 11, fontWeight: 'bold', color: 'white' },
            { id: 'quantity_header', type: 'text', content: 'QTY', x: 350, y: 295, width: 50, height: 15, fontSize: 11, fontWeight: 'bold', color: 'white' },
            { id: 'rate_header', type: 'text', content: 'RATE', x: 420, y: 295, width: 60, height: 15, fontSize: 11, fontWeight: 'bold', color: 'white' },
            { id: 'amount_header', type: 'text', content: 'AMOUNT', x: 500, y: 295, width: 60, height: 15, fontSize: 11, fontWeight: 'bold', color: 'white' },
            
            // Total section
            { id: 'total_label', type: 'text', content: 'TOTAL:', x: 450, y: 400, width: 50, height: 20, fontSize: 14, fontWeight: 'bold', color: '#667eea' },
            { id: 'total_amount', type: 'text', content: '£{amount}', x: 500, y: 400, width: 65, height: 20, fontSize: 16, fontWeight: 'bold', color: '#333' },
            
            // Notes section
            { id: 'notes_label', type: 'text', content: 'NOTES:', x: 30, y: 450, width: 60, height: 15, fontSize: 11, fontWeight: 'bold', color: '#667eea' },
            { id: 'notes', type: 'text', content: '{notes}', x: 30, y: 470, width: 535, height: 60, fontSize: 10, fontWeight: 'normal', color: '#666' },
            
            // Footer
            { id: 'footer_line', type: 'line', content: '', x: 30, y: 750, width: 535, height: 1, fontSize: 12, fontWeight: 'normal', color: '#ddd' },
            { id: 'company_registration', type: 'text', content: 'Company No: {companyNumber} | VAT: {vatNumber}', x: 297, y: 765, width: 300, height: 15, fontSize: 9, fontWeight: 'normal', color: '#999' },
            { id: 'footer_message', type: 'text', content: 'Thank you for your business!', x: 297, y: 780, width: 200, height: 15, fontSize: 11, fontWeight: 'normal', color: '#667eea' }
          ],
          createdBy: user.uid,
          createdAt: new Date()
        };
        
        await setDoc(doc(db, 'pdfTemplates', 'default_invoice_template'), invoiceTemplate);
        console.log('Created default invoice template');
      }

      // Create quote template if it doesn't exist
      if (!hasQuoteTemplate) {
        const quoteTemplate = {
          id: 'default_quote_template',
          name: 'Professional Quote',
          type: 'quote',
          isDefault: true,
          elements: [
            // Header section
            { id: 'logo', type: 'image', content: '{companyLogo}', x: 30, y: 30, width: 80, height: 40, fontSize: 12, fontWeight: 'normal', color: '#333' },
            { id: 'header_title', type: 'header', content: 'QUOTE', x: 272, y: 40, width: 80, height: 30, fontSize: 24, fontWeight: 'bold', color: '#667eea' },
            { id: 'company_details', type: 'text', content: '{companyName}\n{companyAddress}\n{companyCity}, {companyPostcode}\n{companyPhone}\n{companyEmail}', x: 400, y: 30, width: 165, height: 80, fontSize: 10, fontWeight: 'normal', color: '#333' },
            
            // Divider line
            { id: 'header_line', type: 'line', content: '', x: 30, y: 120, width: 535, height: 2, fontSize: 12, fontWeight: 'normal', color: '#667eea' },
            
            // Quote For section
            { id: 'quote_for_label', type: 'text', content: 'QUOTE FOR:', x: 30, y: 140, width: 100, height: 20, fontSize: 12, fontWeight: 'bold', color: '#667eea' },
            { id: 'client_name', type: 'text', content: '{clientName}', x: 30, y: 160, width: 200, height: 20, fontSize: 14, fontWeight: 'bold', color: '#333' },
            
            // Quote details
            { id: 'quote_number_label', type: 'text', content: 'Quote Number:', x: 400, y: 140, width: 100, height: 15, fontSize: 10, fontWeight: 'bold', color: '#666' },
            { id: 'quote_number', type: 'text', content: '{quoteNumber}', x: 400, y: 155, width: 100, height: 15, fontSize: 12, fontWeight: 'normal', color: '#333' },
            { id: 'date_label', type: 'text', content: 'Date:', x: 400, y: 175, width: 100, height: 15, fontSize: 10, fontWeight: 'bold', color: '#666' },
            { id: 'date', type: 'text', content: '{createdDate}', x: 400, y: 190, width: 100, height: 15, fontSize: 12, fontWeight: 'normal', color: '#333' },
            { id: 'valid_until_label', type: 'text', content: 'Valid Until:', x: 400, y: 210, width: 100, height: 15, fontSize: 10, fontWeight: 'bold', color: '#666' },
            { id: 'valid_until', type: 'text', content: '{validUntil}', x: 400, y: 225, width: 100, height: 15, fontSize: 12, fontWeight: 'normal', color: '#333' },
            
            // Service description
            { id: 'service_header_bg', type: 'rectangle', content: '', x: 30, y: 280, width: 535, height: 25, fontSize: 12, fontWeight: 'normal', color: '#667eea' },
            { id: 'service_header', type: 'text', content: 'SERVICE DESCRIPTION', x: 35, y: 295, width: 400, height: 15, fontSize: 11, fontWeight: 'bold', color: 'white' },
            { id: 'amount_header', type: 'text', content: 'AMOUNT', x: 500, y: 295, width: 60, height: 15, fontSize: 11, fontWeight: 'bold', color: 'white' },
            
            // Service line
            { id: 'service_description', type: 'text', content: '{productName}', x: 35, y: 320, width: 400, height: 20, fontSize: 12, fontWeight: 'normal', color: '#333' },
            
            // Total section
            { id: 'total_label', type: 'text', content: 'TOTAL:', x: 450, y: 400, width: 50, height: 20, fontSize: 14, fontWeight: 'bold', color: '#667eea' },
            { id: 'total_amount', type: 'text', content: '£{amount}', x: 500, y: 400, width: 65, height: 20, fontSize: 16, fontWeight: 'bold', color: '#333' },
            
            // Notes section
            { id: 'notes_label', type: 'text', content: 'NOTES:', x: 30, y: 450, width: 60, height: 15, fontSize: 11, fontWeight: 'bold', color: '#667eea' },
            { id: 'notes', type: 'text', content: '{notes}', x: 30, y: 470, width: 535, height: 60, fontSize: 10, fontWeight: 'normal', color: '#666' },
            
            // Footer
            { id: 'footer_line', type: 'line', content: '', x: 30, y: 750, width: 535, height: 1, fontSize: 12, fontWeight: 'normal', color: '#ddd' },
            { id: 'company_registration', type: 'text', content: 'Company No: {companyNumber} | VAT: {vatNumber}', x: 297, y: 765, width: 300, height: 15, fontSize: 9, fontWeight: 'normal', color: '#999' },
            { id: 'footer_message', type: 'text', content: 'Thank you for considering our services!', x: 297, y: 780, width: 250, height: 15, fontSize: 11, fontWeight: 'normal', color: '#667eea' }
          ],
          createdBy: user.uid,
          createdAt: new Date()
        };
        
        await setDoc(doc(db, 'pdfTemplates', 'default_quote_template'), quoteTemplate);
        console.log('Created default quote template');
      }

      // Create statement template if it doesn't exist
      if (!hasStatementTemplate) {
        const statementTemplate = {
          id: 'default_statement_template',
          name: 'Professional Statement',
          type: 'statement',
          isDefault: true,
          elements: [
            // Header section
            { id: 'logo', type: 'image', content: '{companyLogo}', x: 30, y: 30, width: 80, height: 40, fontSize: 12, fontWeight: 'normal', color: '#333' },
            { id: 'header_title', type: 'header', content: 'STATEMENT', x: 252, y: 40, width: 120, height: 30, fontSize: 24, fontWeight: 'bold', color: '#667eea' },
            { id: 'company_details', type: 'text', content: '{companyName}\n{companyAddress}\n{companyCity}, {companyPostcode}\n{companyPhone}\n{companyEmail}', x: 400, y: 30, width: 165, height: 80, fontSize: 10, fontWeight: 'normal', color: '#333' },
            
            // Divider line
            { id: 'header_line', type: 'line', content: '', x: 30, y: 120, width: 535, height: 2, fontSize: 12, fontWeight: 'normal', color: '#667eea' },
            
            // Statement For section
            { id: 'statement_for_label', type: 'text', content: 'STATEMENT FOR:', x: 30, y: 140, width: 120, height: 20, fontSize: 12, fontWeight: 'bold', color: '#667eea' },
            { id: 'client_name', type: 'text', content: '{clientName}', x: 30, y: 160, width: 200, height: 20, fontSize: 14, fontWeight: 'bold', color: '#333' },
            
            // Statement details
            { id: 'period_label', type: 'text', content: 'Period:', x: 400, y: 140, width: 100, height: 15, fontSize: 10, fontWeight: 'bold', color: '#666' },
            { id: 'period', type: 'text', content: '{period}', x: 400, y: 155, width: 100, height: 15, fontSize: 12, fontWeight: 'normal', color: '#333' },
            { id: 'statement_date_label', type: 'text', content: 'Statement Date:', x: 400, y: 175, width: 100, height: 15, fontSize: 10, fontWeight: 'bold', color: '#666' },
            { id: 'statement_date', type: 'text', content: '{statementDate}', x: 400, y: 190, width: 100, height: 15, fontSize: 12, fontWeight: 'normal', color: '#333' },
            
            // Account summary
            { id: 'summary_header_bg', type: 'rectangle', content: '', x: 30, y: 230, width: 535, height: 25, fontSize: 12, fontWeight: 'normal', color: '#667eea' },
            { id: 'summary_header', type: 'text', content: 'ACCOUNT SUMMARY', x: 35, y: 245, width: 200, height: 15, fontSize: 11, fontWeight: 'bold', color: 'white' },
            
            // Summary details
            { id: 'total_invoices_label', type: 'text', content: 'Total Invoices:', x: 35, y: 270, width: 100, height: 15, fontSize: 11, fontWeight: 'bold', color: '#666' },
            { id: 'total_invoices', type: 'text', content: '{totalInvoices}', x: 150, y: 270, width: 50, height: 15, fontSize: 11, fontWeight: 'normal', color: '#333' },
            { id: 'total_amount_label', type: 'text', content: 'Total Amount:', x: 35, y: 290, width: 100, height: 15, fontSize: 11, fontWeight: 'bold', color: '#666' },
            { id: 'total_amount', type: 'text', content: '£{totalAmount}', x: 150, y: 290, width: 100, height: 15, fontSize: 11, fontWeight: 'normal', color: '#333' },
            { id: 'paid_amount_label', type: 'text', content: 'Paid Amount:', x: 35, y: 310, width: 100, height: 15, fontSize: 11, fontWeight: 'bold', color: '#666' },
            { id: 'paid_amount', type: 'text', content: '£{paidAmount}', x: 150, y: 310, width: 100, height: 15, fontSize: 11, fontWeight: 'normal', color: '#28a745' },
            { id: 'unpaid_amount_label', type: 'text', content: 'Outstanding:', x: 35, y: 330, width: 100, height: 15, fontSize: 11, fontWeight: 'bold', color: '#666' },
            { id: 'unpaid_amount', type: 'text', content: '£{unpaidAmount}', x: 150, y: 330, width: 100, height: 15, fontSize: 11, fontWeight: 'normal', color: '#dc3545' },
            
            // Invoices table header
            { id: 'invoices_header_bg', type: 'rectangle', content: '', x: 30, y: 380, width: 535, height: 25, fontSize: 12, fontWeight: 'normal', color: '#667eea' },
            { id: 'invoice_header', type: 'text', content: 'INVOICE #', x: 35, y: 395, width: 80, height: 15, fontSize: 10, fontWeight: 'bold', color: 'white' },
            { id: 'date_header', type: 'text', content: 'DATE', x: 130, y: 395, width: 60, height: 15, fontSize: 10, fontWeight: 'bold', color: 'white' },
            { id: 'status_header', type: 'text', content: 'STATUS', x: 220, y: 395, width: 60, height: 15, fontSize: 10, fontWeight: 'bold', color: 'white' },
            { id: 'invoice_amount_header', type: 'text', content: 'AMOUNT', x: 500, y: 395, width: 60, height: 15, fontSize: 10, fontWeight: 'bold', color: 'white' },
            
            // Footer
            { id: 'footer_line', type: 'line', content: '', x: 30, y: 750, width: 535, height: 1, fontSize: 12, fontWeight: 'normal', color: '#ddd' },
            { id: 'company_registration', type: 'text', content: 'Company No: {companyNumber} | VAT: {vatNumber}', x: 297, y: 765, width: 300, height: 15, fontSize: 9, fontWeight: 'normal', color: '#999' },
            { id: 'footer_message', type: 'text', content: 'Thank you for your continued business!', x: 297, y: 780, width: 270, height: 15, fontSize: 11, fontWeight: 'normal', color: '#667eea' }
          ],
          createdBy: user.uid,
          createdAt: new Date()
        };
        
        await setDoc(doc(db, 'pdfTemplates', 'default_statement_template'), statementTemplate);
        console.log('Created default statement template');
      }

      // Refresh templates after creation
      fetchTemplates();
    } catch (error) {
      console.error('Error creating default templates:', error);
    }
  };

  const defaultElements = {
    invoice: [
      { id: 'header', type: 'header', content: 'INVOICE', x: 50, y: 50, width: 200, height: 40, fontSize: 20, fontWeight: 'bold', color: '#667eea' },
      { id: 'company', type: 'text', content: '{companyName}', x: 50, y: 100, width: 200, height: 20, fontSize: 14, fontWeight: 'normal', color: '#333' },
      { id: 'billTo', type: 'text', content: 'Bill To: {clientName}', x: 50, y: 150, width: 200, height: 20, fontSize: 12, fontWeight: 'bold', color: '#333' },
      { id: 'invoiceNumber', type: 'text', content: 'Invoice #: {invoiceNumber}', x: 350, y: 100, width: 150, height: 20, fontSize: 12, fontWeight: 'normal', color: '#333' },
      { id: 'dueDate', type: 'text', content: 'Due Date: {dueDate}', x: 350, y: 120, width: 150, height: 20, fontSize: 12, fontWeight: 'normal', color: '#333' },
      { id: 'amount', type: 'text', content: 'Amount: £{amount}', x: 350, y: 200, width: 150, height: 20, fontSize: 14, fontWeight: 'bold', color: '#333' },
      { id: 'notes', type: 'text', content: 'Notes: {notes}', x: 50, y: 250, width: 400, height: 60, fontSize: 10, fontWeight: 'normal', color: '#666' }
    ],
    quote: [
      { id: 'header', type: 'header', content: 'QUOTE', x: 50, y: 50, width: 200, height: 40, fontSize: 20, fontWeight: 'bold', color: '#667eea' },
      { id: 'company', type: 'text', content: '{companyName}', x: 50, y: 100, width: 200, height: 20, fontSize: 14, fontWeight: 'normal', color: '#333' },
      { id: 'quoteTo', type: 'text', content: 'Quote For: {clientName}', x: 50, y: 150, width: 200, height: 20, fontSize: 12, fontWeight: 'bold', color: '#333' },
      { id: 'quoteNumber', type: 'text', content: 'Quote #: {quoteNumber}', x: 350, y: 100, width: 150, height: 20, fontSize: 12, fontWeight: 'normal', color: '#333' },
      { id: 'validUntil', type: 'text', content: 'Valid Until: {validUntil}', x: 350, y: 120, width: 150, height: 20, fontSize: 12, fontWeight: 'normal', color: '#333' },
      { id: 'amount', type: 'text', content: 'Amount: £{amount}', x: 350, y: 200, width: 150, height: 20, fontSize: 14, fontWeight: 'bold', color: '#333' },
      { id: 'notes', type: 'text', content: 'Notes: {notes}', x: 50, y: 250, width: 400, height: 60, fontSize: 10, fontWeight: 'normal', color: '#666' }
    ],
    statement: [
      { id: 'header', type: 'header', content: 'STATEMENT', x: 50, y: 50, width: 200, height: 40, fontSize: 20, fontWeight: 'bold', color: '#667eea' },
      { id: 'company', type: 'text', content: '{companyName}', x: 50, y: 100, width: 200, height: 20, fontSize: 14, fontWeight: 'normal', color: '#333' },
      { id: 'statementFor', type: 'text', content: 'Statement For: {clientName}', x: 50, y: 150, width: 200, height: 20, fontSize: 12, fontWeight: 'bold', color: '#333' },
      { id: 'period', type: 'text', content: 'Period: {period}', x: 350, y: 100, width: 150, height: 20, fontSize: 12, fontWeight: 'normal', color: '#333' },
      { id: 'totalAmount', type: 'text', content: 'Total: £{totalAmount}', x: 350, y: 200, width: 150, height: 20, fontSize: 14, fontWeight: 'bold', color: '#333' },
      { id: 'paidAmount', type: 'text', content: 'Paid: £{paidAmount}', x: 350, y: 220, width: 150, height: 20, fontSize: 12, fontWeight: 'normal', color: '#28a745' },
      { id: 'unpaidAmount', type: 'text', content: 'Outstanding: £{unpaidAmount}', x: 350, y: 240, width: 150, height: 20, fontSize: 12, fontWeight: 'normal', color: '#dc3545' }
    ]
  };

  const createNewTemplate = () => {
    const newTemplate = {
      id: Date.now().toString(),
      name: templateName || `New ${templateType} Template`,
      type: templateType,
      isDefault: isDefault,
      elements: [...defaultElements[templateType]],
      createdBy: user.uid,
      createdAt: new Date()
    };

    setCurrentTemplate(newTemplate);
    setElements([...defaultElements[templateType]]);
    setTemplateName('');
    setIsDefault(false);
  };

  const saveTemplate = async () => {
    if (!currentTemplate) return;

    try {
      const templateData = {
        ...currentTemplate,
        elements: elements,
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'pdfTemplates', currentTemplate.id), templateData);

      // If this is set as default, remove default from other templates of same type
      if (isDefault) {
        const otherTemplates = templates.filter(t => t.type === templateType && t.id !== currentTemplate.id);
        for (const template of otherTemplates) {
          await setDoc(doc(db, 'pdfTemplates', template.id), {
            ...template,
            isDefault: false
          });
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template');
    }
  };

  const loadTemplate = async (templateId) => {
    try {
      const templateDoc = await getDoc(doc(db, 'pdfTemplates', templateId));
      if (templateDoc.exists()) {
        const templateData = templateDoc.data();
        setCurrentTemplate({ id: templateId, ...templateData });
        setElements(templateData.elements || []);
        setTemplateType(templateData.type);
        setTemplateName(templateData.name);
        setIsDefault(templateData.isDefault || false);
      }
    } catch (error) {
      console.error('Error loading template:', error);
    }
  };

  const deleteTemplate = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteDoc(doc(db, 'pdfTemplates', templateId));
        fetchTemplates();
        if (currentTemplate?.id === templateId) {
          setCurrentTemplate(null);
          setElements([]);
        }
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  const updateElement = (elementId, updates) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    ));
  };

  const addElement = (type) => {
    const newElement = {
      id: `element_${Date.now()}`,
      type: type,
      content: type === 'text' ? 'Sample Text' : 
               type === 'line' ? '' : 
               type === 'variable' ? '{variableName}' : 'Element',
      x: 50,
      y: 50,
      width: type === 'line' ? 200 : 150,
      height: type === 'line' ? 2 : 30,
      fontSize: 12,
      fontWeight: 'normal',
      color: type === 'variable' ? '#667eea' : '#000000',
      draggable: true
    };

    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement);
  };

  const handleElementResize = (elementId, newWidth, newHeight) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, width: Math.max(20, newWidth), height: Math.max(15, newHeight) } : el
    ));
  };

  const availableVariables = {
    invoice: [
      '{companyName}', '{companyEmail}', '{companyPhone}', '{companyAddress}', '{companyCity}', '{companyPostcode}',
      '{companyNumber}', '{vatNumber}', '{companyLogo}',
      '{clientName}', '{invoiceNumber}', '{createdDate}', '{dueDate}', 
      '{status}', '{amount}', '{notes}'
    ],
    quote: [
      '{companyName}', '{companyEmail}', '{companyPhone}', '{companyAddress}', '{companyCity}', '{companyPostcode}',
      '{companyNumber}', '{vatNumber}', '{companyLogo}',
      '{clientName}', '{quoteNumber}', '{createdDate}', '{validUntil}', 
      '{status}', '{amount}', '{notes}', '{productName}'
    ],
    statement: [
      '{companyName}', '{companyEmail}', '{companyPhone}', '{companyAddress}', '{companyCity}', '{companyPostcode}',
      '{companyNumber}', '{vatNumber}', '{companyLogo}',
      '{clientName}', '{period}', '{statementDate}', '{totalInvoices}',
      '{totalAmount}', '{paidAmount}', '{unpaidAmount}'
    ]
  };

  const deleteElement = (elementId) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
    if (selectedElement?.id === elementId) {
      setSelectedElement(null);
    }
  };

  const handleDragStart = (e, element) => {
    setDraggedElement(element);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (draggedElement) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(0, e.clientX - rect.left - (draggedElement.width / 2));
      const y = Math.max(0, e.clientY - rect.top - (draggedElement.height / 2));

      updateElement(draggedElement.id, { x, y });
      setDraggedElement(null);
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  };

  const cardStyle = {
    background: 'rgba(255,255,255,0.95)',
    padding: '25px',
    borderRadius: '15px',
    marginBottom: '25px',
    backdropFilter: 'blur(15px)',
    border: '2px solid rgba(255,255,255,0.2)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
  };

  const canvasStyle = {
    width: '595px',
    height: '842px',
    background: 'white',
    border: '2px solid #ddd',
    position: 'relative',
    margin: '20px auto',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  };

  const elementStyle = (element) => ({
    position: 'absolute',
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    fontSize: `${element.fontSize}px`,
    fontWeight: element.fontWeight,
    color: element.color,
    backgroundColor: element.backgroundColor || (element.type === 'variable' ? '#f0f8ff' : 'transparent'),
    border: selectedElement?.id === element.id ? '2px solid #667eea' : (element.type === 'variable' ? '2px dashed #667eea' : '1px solid #ddd'),
    padding: '4px',
    cursor: previewMode ? 'default' : 'move',
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: element.type === 'line' ? 'stretch' : 'flex-start',
    boxSizing: 'border-box',
    minWidth: '20px',
    minHeight: '15px',
    resize: !previewMode && selectedElement?.id === element.id ? 'both' : 'none',
    overflow: 'hidden'
  });

  const resizeHandleStyle = {
    position: 'absolute',
    bottom: '0',
    right: '0',
    width: '10px',
    height: '10px',
    background: '#667eea',
    cursor: 'se-resize',
    border: '1px solid white'
  };

  const buttonStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    margin: '0 5px 5px 0'
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '2px solid #e1e5e9',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '10px',
    boxSizing: 'border-box'
  };

  if (!isAdmin) {
    return (
      <div style={containerStyle}>
        <Navigation user={user} />
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', paddingTop: '100px' }}>
          <div style={cardStyle}>
            <h1>🚫 Access Denied</h1>
            <p>You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <Navigation user={user} />
      <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', paddingTop: '100px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '300', color: 'white' }}>
            🎨 PDF Template Creator
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0, color: 'white' }}>
            Create and customize PDF templates for invoices, quotes, and statements with company branding
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 300px', gap: '20px' }}>
          {/* Left Panel - Templates & Tools */}
          <div style={cardStyle}>
            <h3>📋 Templates</h3>

            {/* Template Creation */}
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Template name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                style={inputStyle}
              />
              <select 
                value={templateType} 
                onChange={(e) => setTemplateType(e.target.value)}
                style={inputStyle}
              >
                <option value="invoice">Invoice</option>
                <option value="quote">Quote</option>
                <option value="statement">Statement</option>
              </select>
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Set as default template
              </label>
              <button onClick={createNewTemplate} style={buttonStyle}>
                ➕ Create New Template
              </button>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {templates.map(template => (
                <div
                  key={template.id}
                  style={{
                    padding: '10px',
                    margin: '5px 0',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: currentTemplate?.id === template.id ? '#f0f8ff' : 'white'
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: '#333' }}>
                    {template.name}
                    {template.isDefault && <span style={{ color: '#28a745', fontSize: '12px' }}> (Default)</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                    {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
                  </div>
                  <div>
                    <button
                      onClick={() => loadTemplate(template.id)}
                      style={{ ...buttonStyle, fontSize: '12px', padding: '5px 10px' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      style={{ ...buttonStyle, fontSize: '12px', padding: '5px 10px', background: '#dc3545' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Center Panel - Canvas */}
          <div style={cardStyle}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <button
                onClick={() => setPreviewMode(!previewMode)}
                style={{ ...buttonStyle, marginRight: '10px' }}
              >
                {previewMode ? '✏️ Edit Mode' : '👁️ Preview Mode'}
              </button>

              {currentTemplate && (
                <button onClick={saveTemplate} style={buttonStyle}>
                  💾 Save Template
                </button>
              )}
            </div>

            {currentTemplate ? (
              <div
                style={canvasStyle}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {elements.map(element => (
                  <div
                    key={element.id}
                    style={elementStyle(element)}
                    draggable={!previewMode}
                    onDragStart={(e) => handleDragStart(e, element)}
                    onClick={() => !previewMode && setSelectedElement(element)}
                  >
                    {element.type === 'line' ? (
                      <div style={{ 
                        width: '100%', 
                        height: '100%', 
                        backgroundColor: element.color || '#000',
                        border: 'none'
                      }} />
                    ) : element.type === 'rectangle' ? (
                      <div style={{ 
                        width: '100%', 
                        height: '100%', 
                        backgroundColor: element.color || '#667eea',
                        border: 'none'
                      }} />
                    ) : element.type === 'image' ? (
                      <div style={{ 
                        width: '100%', 
                        height: '100%', 
                        backgroundColor: '#f0f0f0',
                        border: '2px dashed #ccc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: '#666'
                      }}>
                        {element.content}
                      </div>
                    ) : (
                      element.content
                    )}
                    {!previewMode && selectedElement?.id === element.id && (
                      <div style={resizeHandleStyle}></div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '100px', color: '#666' }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎨</div>
                <h3>No template selected</h3>
                <p>Create a new template or select an existing one to start designing</p>
              </div>
            )}

            {saved && (
              <div style={{ 
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#d4edda',
                color: '#155724',
                borderRadius: '8px',
                border: '1px solid #c3e6cb',
                textAlign: 'center'
              }}>
                ✅ Template saved successfully!
              </div>
            )}
          </div>

          {/* Right Panel - Element Properties */}
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0, color: '#333' }}>🛠️ Tools</h3>

            {/* Element Tools */}
            <div style={{ marginBottom: '20px' }}>
              <h4>🛠️ Add Elements</h4>
              <button onClick={() => addElement('text')} style={{ ...buttonStyle, marginRight: '5px', marginBottom: '5px' }}>
                📝 Text
              </button>
              <button onClick={() => addElement('variable')} style={{ ...buttonStyle, marginRight: '5px', marginBottom: '5px' }}>
                🔤 Variable
              </button>
              <button onClick={() => addElement('line')} style={{ ...buttonStyle, marginRight: '5px', marginBottom: '5px' }}>
                ➖ Line
              </button>
              <button onClick={() => addElement('rectangle')} style={{ ...buttonStyle, marginRight: '5px', marginBottom: '5px' }}>
                ⬜ Rectangle
              </button>
              <button onClick={() => addElement('image')} style={{ ...buttonStyle, marginRight: '5px', marginBottom: '5px' }}>
                🖼️ Image
              </button>

              {/* Available Variables */}
              <div style={{ marginTop: '15px' }}>
                <h5 style={{ color: '#667eea', marginBottom: '10px' }}>📋 Available Variables:</h5>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {availableVariables[templateType]?.map(variable => (
                    <div 
                      key={variable}
                      style={{ 
                        padding: '5px 8px', 
                        background: '#f0f8ff', 
                        border: '1px dashed #667eea', 
                        borderRadius: '4px', 
                        marginBottom: '5px',
                        fontSize: '10px',
                        cursor: 'pointer',
                        color: '#667eea'
                      }}
                      onClick={() => {
                        const variableElement = {
                          id: `var_${Date.now()}`,
                          type: 'variable',
                          content: variable,
                          x: 50,
                          y: 50 + (elements.length * 25),
                          width: 120,
                          height: 20,
                          fontSize: 10,
                          fontWeight: 'normal',
                          color: '#667eea',
                          draggable: true
                        };
                        setElements(prev => [...prev, variableElement]);
                        setSelectedElement(variableElement);
                      }}
                    >
                      {variable}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {selectedElement && (
                <div>
                  <h4>🎨 Element Properties</h4>
                  <label style={{ fontSize: '12px', color: '#666', marginBottom: '5px', display: 'block' }}>
                    Content {selectedElement.type === 'variable' && '(Use {variableName} format)'}:
                  </label>
                  {selectedElement.type === 'variable' ? (
                    <select
                      value={selectedElement.content}
                      onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                      style={inputStyle}
                    >
                      {availableVariables[templateType]?.map(variable => (
                        <option key={variable} value={variable}>{variable}</option>
                      ))}
                    </select>
                  ) : selectedElement.type === 'line' || selectedElement.type === 'rectangle' || selectedElement.type === 'image' ? (
                    <div style={{ marginBottom: '10px', color: '#666', fontSize: '12px' }}>
                      {selectedElement.type === 'line' && 'Line element (no content)'}
                      {selectedElement.type === 'rectangle' && 'Rectangle element (background shape)'}
                      {selectedElement.type === 'image' && 'Image placeholder - will show company logo'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Content"
                      value={selectedElement.content}
                      onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                      style={inputStyle}
                    />
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                    <div>
                      <label style={{ fontSize: '10px', color: '#666' }}>Width:</label>
                      <input
                        type="number"
                        value={selectedElement.width}
                        onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) || 20 })}
                        style={{ ...inputStyle, marginBottom: '5px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: '#666' }}>Height:</label>
                      <input
                        type="number"
                        value={selectedElement.height}
                        onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) || 15 })}
                        style={{ ...inputStyle, marginBottom: '5px' }}
                      />
                    </div>
                  </div>

                  {selectedElement.type !== 'line' && selectedElement.type !== 'rectangle' && (
                    <>
                      <input
                        type="number"
                        placeholder="Font Size"
                        value={selectedElement.fontSize}
                        onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) || 12 })}
                        style={inputStyle}
                      />
                      <select
                        value={selectedElement.fontWeight}
                        onChange={(e) => updateElement(selectedElement.id, { fontWeight: e.target.value })}
                        style={inputStyle}
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                      </select>
                    </>
                  )}
                  
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '10px', color: '#666', marginBottom: '3px', display: 'block' }}>Color:</label>
                    <input
                      type="color"
                      value={selectedElement.color}
                      onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                      style={{ width: '100%', height: '30px', border: 'none', borderRadius: '4px' }}
                    />
                  </div>
                  <button 
                    onClick={() => deleteElement(selectedElement.id)}
                    style={{ ...buttonStyle, background: '#ef4444', width: '100%' }}
                  >
                    🗑️ Delete Element
                  </button>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PDFTemplateCreator;
