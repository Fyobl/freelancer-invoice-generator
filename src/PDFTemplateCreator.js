import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase.js';
import Navigation from './Navigation.js';
import { generateInvoicePDF, generateQuotePDF, generateStatementPDF } from './emailService.js';

function PDFTemplateCreator({ user }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState('invoice');
  const [elements, setElements] = useState([]);
  const [draggedElement, setDraggedElement] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

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

  const createNewTemplate = () => {
    const newTemplate = {
      id: `template_${Date.now()}`,
      name: templateName || `New ${templateType} Template`,
      type: templateType,
      elements: [
        {
          id: 'header',
          type: 'header',
          content: `${templateType.charAt(0).toUpperCase() + templateType.slice(1)}`,
          x: 50,
          y: 30,
          width: 200,
          height: 40,
          fontSize: 24,
          fontWeight: 'bold'
        },
        {
          id: 'logo',
          type: 'logo',
          content: '[Company Logo]',
          x: 50,
          y: 80,
          width: 100,
          height: 50
        },
        {
          id: 'company_address',
          type: 'text',
          content: '[Company Address]',
          x: 400,
          y: 80,
          width: 150,
          height: 60
        },
        {
          id: 'client_details',
          type: 'text',
          content: '[Client Details]',
          x: 50,
          y: 150,
          width: 200,
          height: 80
        },
        {
          id: 'items_table',
          type: 'table',
          content: '[Items Table]',
          x: 50,
          y: 250,
          width: 500,
          height: 200
        },
        {
          id: 'total',
          type: 'text',
          content: '[Total Amount]',
          x: 400,
          y: 470,
          width: 150,
          height: 30,
          fontSize: 14,
          fontWeight: 'bold'
        },
        {
          id: 'footer',
          type: 'footer',
          content: '[Company Details]',
          x: 50,
          y: 750,
          width: 500,
          height: 40
        }
      ]
    };
    setSelectedTemplate(newTemplate);
    setElements(newTemplate.elements);
    setIsEditing(true);
  };

  const saveTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const templateData = {
        ...selectedTemplate,
        elements: elements,
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'pdfTemplates', selectedTemplate.id), templateData);
      await fetchTemplates();
      alert('Template saved successfully!');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template');
    }
  };

  const deleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      await deleteDoc(doc(db, 'pdfTemplates', templateId));
      await fetchTemplates();
      if (selectedTemplate && selectedTemplate.id === templateId) {
        setSelectedTemplate(null);
        setElements([]);
      }
      alert('Template deleted successfully!');
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error deleting template');
    }
  };

  const selectTemplate = (template) => {
    setSelectedTemplate(template);
    setElements(template.elements || []);
    setIsEditing(false);
  };

  const updateElement = (elementId, updates) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    ));
  };

  const handleElementDrag = (e, elementId) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    updateElement(elementId, { x, y });
  };

  const addNewElement = () => {
    const newElement = {
      id: `element_${Date.now()}`,
      type: 'text',
      content: '[New Element]',
      x: 100,
      y: 100,
      width: 150,
      height: 30,
      fontSize: 12
    };
    setElements(prev => [...prev, newElement]);
  };

  const removeElement = (elementId) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
  };

  const previewTemplate = async () => {
    if (!selectedTemplate) return;

    const sampleData = {
      invoiceNumber: 'INV-001',
      clientName: 'Sample Client',
      amount: 1000,
      selectedProducts: [
        { name: 'Sample Product', quantity: 1, price: 1000, vat: 20 }
      ],
      dueDate: '2025-01-31',
      notes: 'Sample notes'
    };

    const sampleCompanySettings = {
      name: 'Sample Company',
      address: '123 Sample Street',
      city: 'Sample City',
      phone: '123-456-7890',
      email: 'info@sample.com'
    };

    try {
      if (selectedTemplate.type === 'invoice') {
        await generateInvoicePDF(sampleData, sampleCompanySettings);
      } else if (selectedTemplate.type === 'quote') {
        await generateQuotePDF(sampleData, sampleCompanySettings);
      } else if (selectedTemplate.type === 'statement') {
        await generateStatementPDF([], sampleCompanySettings, sampleData);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Error generating preview');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', paddingTop: '100px' }}>
      <Navigation user={user} />

      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '15px',
        padding: '30px',
        marginBottom: '30px',
        color: 'white'
      }}>
        <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: 'bold' }}>
          📄 PDF Template Creator
        </h1>
        <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
          Create and customize PDF templates for invoices, quotes, and statements
        </p>
      </div>

      <div style={{ display: 'flex', gap: '20px', height: '80vh' }}>
        {/* Templates List */}
        <div style={{ 
          width: '300px', 
          background: '#f8f9fa', 
          borderRadius: '10px', 
          padding: '20px',
          overflowY: 'auto'
        }}>
          <h3>Templates</h3>

          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Template name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
            <select
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              <option value="invoice">Invoice</option>
              <option value="quote">Quote</option>
              <option value="statement">Statement</option>
            </select>
            <button
              onClick={createNewTemplate}
              style={{
                width: '100%',
                padding: '10px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Create New Template
            </button>
          </div>

          {templates.map(template => (
            <div
              key={template.id}
              onClick={() => selectTemplate(template)}
              style={{
                padding: '10px',
                margin: '5px 0',
                background: selectedTemplate?.id === template.id ? '#007bff' : 'white',
                color: selectedTemplate?.id === template.id ? 'white' : 'black',
                borderRadius: '5px',
                cursor: 'pointer',
                border: '1px solid #ddd'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{template.name}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>{template.type}</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTemplate(template.id);
                }}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  padding: '3px 6px',
                  marginTop: '5px',
                  fontSize: '10px',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        {/* Template Editor */}
        <div style={{ flex: 1, background: 'white', borderRadius: '10px', padding: '20px' }}>
          {selectedTemplate ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3>{selectedTemplate.name}</h3>
                <div>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    style={{
                      padding: '8px 16px',
                      background: isEditing ? '#28a745' : '#ffc107',
                      color: isEditing ? 'white' : 'black',
                      border: 'none',
                      borderRadius: '4px',
                      marginRight: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    {isEditing ? 'View Mode' : 'Edit Mode'}
                  </button>
                  <button
                    onClick={saveTemplate}
                    style={{
                      padding: '8px 16px',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      marginRight: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    Save Template
                  </button>
                  <button
                    onClick={previewTemplate}
                    style={{
                      padding: '8px 16px',
                      background: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Preview
                  </button>
                </div>
              </div>

              {isEditing && (
                <div style={{ marginBottom: '20px' }}>
                  <button
                    onClick={addNewElement}
                    style={{
                      padding: '8px 16px',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Add Element
                  </button>
                </div>
              )}

              {/* Canvas */}
              <div style={{
                width: '595px',
                height: '842px',
                background: 'white',
                border: '1px solid #ddd',
                position: 'relative',
                margin: '0 auto',
                boxShadow: '0 0 10px rgba(0,0,0,0.1)'
              }}>
                {elements.map(element => (
                  <div
                    key={element.id}
                    draggable={isEditing}
                    onDragEnd={(e) => isEditing && handleElementDrag(e, element.id)}
                    style={{
                      position: 'absolute',
                      left: `${element.x}px`,
                      top: `${element.y}px`,
                      width: `${element.width}px`,
                      height: `${element.height}px`,
                      border: isEditing ? '1px dashed #007bff' : 'none',
                      padding: '5px',
                      cursor: isEditing ? 'move' : 'default',
                      fontSize: `${element.fontSize || 12}px`,
                      fontWeight: element.fontWeight || 'normal',
                      backgroundColor: isEditing ? 'rgba(0,123,255,0.1)' : 'transparent'
                    }}
                  >
                    <div style={{ fontSize: '10px', color: '#666' }}>
                      {isEditing && element.type}
                    </div>
                    <div>{element.content}</div>
                    {isEditing && (
                      <button
                        onClick={() => removeElement(element.id)}
                        style={{
                          position: 'absolute',
                          top: '-5px',
                          right: '-5px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          fontSize: '10px',
                          cursor: 'pointer'
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: '#666'
            }}>
              Select a template to edit or create a new one
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PDFTemplateCreator;