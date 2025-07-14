import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

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

  const createNewTemplate = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    const newTemplate = {
      name: templateName,
      type: templateType,
      elements: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const templateId = `custom_${templateType}_${Date.now()}`;
      await setDoc(doc(db, 'pdfTemplates', templateId), newTemplate);

      setTemplates(prev => [...prev, { id: templateId, ...newTemplate }]);
      setSelectedTemplate({ id: templateId, ...newTemplate });
      setElements([]);
      setTemplateName('');
      setIsEditing(true);
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Error creating template');
    }
  };

  const saveTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const updatedTemplate = {
        ...selectedTemplate,
        elements: elements,
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'pdfTemplates', selectedTemplate.id), updatedTemplate);

      setTemplates(prev => 
        prev.map(t => t.id === selectedTemplate.id ? updatedTemplate : t)
      );

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
      setTemplates(prev => prev.filter(t => t.id !== templateId));

      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null);
        setElements([]);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error deleting template');
    }
  };

  const loadTemplate = (template) => {
    setSelectedTemplate(template);
    setElements(template.elements || []);
    setIsEditing(true);
  };

  const addElement = (type) => {
    const newElement = {
      id: `element_${Date.now()}`,
      type: type,
      x: 50,
      y: 100,
      width: type === 'line' ? 100 : 150,
      height: type === 'line' ? 2 : 30,
      content: type === 'text' ? 'Sample Text' : type === 'variable' ? '{clientName}' : '',
      fontSize: 12,
      fontWeight: 'normal',
      color: '#000000'
    };

    setElements(prev => [...prev, newElement]);
  };

  const updateElement = (elementId, updates) => {
    setElements(prev => 
      prev.map(el => el.id === elementId ? { ...el, ...updates } : el)
    );
  };

  const deleteElement = (elementId) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (!draggedElement) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    updateElement(draggedElement.id, { x, y });
    setDraggedElement(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>PDF Template Creator</h2>

      {/* Template Creation */}
      {!isEditing && (
        <div style={{ marginBottom: '30px' }}>
          <h3>Create New Template</h3>
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
        </div>
      )}

      {/* Template List */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Existing Templates</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          {templates.map(template => (
            <div
              key={template.id}
              style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <h4 style={{ margin: '0 0 5px 0' }}>{template.name}</h4>
                <p style={{ margin: 0, color: '#666' }}>Type: {template.type}</p>
              </div>
              <div>
                <button
                  onClick={() => loadTemplate(template)}
                  style={{
                    padding: '5px 10px',
                    marginRight: '5px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteTemplate(template.id)}
                  style={{
                    padding: '5px 10px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Template Editor */}
      {isEditing && selectedTemplate && (
        <div>
          <h3>Editing: {selectedTemplate.name}</h3>

          {/* Controls */}
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => addElement('text')} style={{ padding: '8px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Add Text
            </button>
            <button onClick={() => addElement('variable')} style={{ padding: '8px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Add Variable
            </button>
            <button onClick={() => addElement('line')} style={{ padding: '8px 12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Add Line
            </button>
            <button onClick={() => addElement('rectangle')} style={{ padding: '8px 12px', background: '#ffc107', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Add Rectangle
            </button>
            <button onClick={saveTemplate} style={{ padding: '8px 12px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Save Template
            </button>
            <button onClick={() => setIsEditing(false)} style={{ padding: '8px 12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Back to List
            </button>
          </div>

          {/* Canvas */}
          <div
            style={{
              width: '595px',
              height: '842px',
              border: '1px solid #000',
              position: 'relative',
              background: 'white',
              margin: '0 auto'
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {elements.map(element => (
              <div
                key={element.id}
                draggable
                onDragStart={() => setDraggedElement(element)}
                style={{
                  position: 'absolute',
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.height,
                  border: '1px dashed #007bff',
                  background: element.type === 'rectangle' ? element.color : 'transparent',
                  cursor: 'move',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: element.fontSize,
                  fontWeight: element.fontWeight,
                  color: element.type !== 'rectangle' ? element.color : 'transparent'
                }}
                onClick={() => {
                  const newContent = prompt('Edit content:', element.content);
                  if (newContent !== null) {
                    updateElement(element.id, { content: newContent });
                  }
                }}
              >
                {element.type === 'line' ? (
                  <div style={{ width: '100%', height: '1px', background: element.color }} />
                ) : (
                  element.content
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteElement(element.id);
                  }}
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    width: '20px',
                    height: '20px',
                    background: 'red',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PDFTemplateCreator;