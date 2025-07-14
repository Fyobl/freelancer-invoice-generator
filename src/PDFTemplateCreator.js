The code is modified to import existing PDF designs, enable drag-and-drop variable boxes, and update element handling for resizing and variable detection.
```

```replit_final_file
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
      '{companyName}', '{companyEmail}', '{companyPhone}', '{companyAddress}',
      '{clientName}', '{invoiceNumber}', '{createdDate}', '{dueDate}', 
      '{status}', '{amount}', '{notes}'
    ],
    quote: [
      '{companyName}', '{companyEmail}', '{companyPhone}', '{companyAddress}',
      '{clientName}', '{quoteNumber}', '{createdDate}', '{validUntil}', 
      '{status}', '{amount}', '{notes}', '{productName}'
    ],
    statement: [
      '{companyName}', '{companyEmail}', '{companyPhone}', '{companyAddress}',
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
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (draggedElement) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      updateElement(draggedElement.id, { x, y });
      setDraggedElement(null);
    }
  };

  const importExistingDesigns = async () => {
    try {
      let importedTemplates;
      if (templateType === 'invoice') {
        importedTemplates = await generateInvoicePDF();
      } else if (templateType === 'quote') {
        importedTemplates = await generateQuotePDF();
      } else if (templateType === 'statement') {
        importedTemplates = await generateStatementPDF();
      }
  
      // Assuming the generate functions return an object containing the template data
      if (importedTemplates) {
          const newTemplate = {
              id: Date.now().toString(),
              name: `Imported ${templateType} Template`,
              type: templateType,
              isDefault: false,
              elements: importedTemplates.elements || [], // Adjust based on the actual structure
              createdBy: user.uid,
              createdAt: new Date()
          };
  
          setCurrentTemplate(newTemplate);
          setElements(newTemplate.elements);
          setTemplateName(newTemplate.name);
          setIsDefault(false);
      } else {
          alert('Failed to import existing designs.');
      }
    } catch (error) {
      console.error('Error importing existing designs:', error);
      alert('Error importing existing designs.');
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
            Create and customize PDF templates for invoices, quotes, and statements
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 300px', gap: '20px' }}>
          {/* Left Panel - Templates & Tools */}
          <div style={cardStyle}>
            <h3>📋 Templates</h3>

            {/* Import Existing Designs Button */}
            <div style={{ marginBottom: '20px' }}>
              <button 
                onClick={importExistingDesigns} 
                style={{ ...buttonStyle, background: '#22c55e', marginBottom: '15px', width: '100%' }}
              >
                📥 Import Existing PDF Designs
              </button>
            </div>

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
                      <div style={{ width: '100%', height: '100%' }} />
                    ) : (
                      element.content
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

              {/* Available Variables */}
              <div style={{ marginTop: '15px' }}>
                <h5 style={{ color: '#667eea', marginBottom: '10px' }}>📋 Available Variables:</h5>
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
                        onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) })}
                        style={{ ...inputStyle, marginBottom: '5px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: '#666' }}>Height:</label>
                      <input
                        type="number"
                        value={selectedElement.height}
                        onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) })}
                        style={{ ...inputStyle, marginBottom: '5px' }}
                      />
                    </div>
                  </div>

                  <input
                    type="number"
                    placeholder="Font Size"
                    value={selectedElement.fontSize}
                    onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
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
                    onClick={() => {
                      setElements(prev => prev.filter(el => el.id !== selectedElement.id));
                      setSelectedElement(null);
                    }}
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