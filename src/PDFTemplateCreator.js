
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const PDFTemplateCreator = () => {
  const [templates, setTemplates] = useState([]);

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

  const deleteAllTemplates = async () => {
    try {
      console.log('Deleting all PDF templates...');
      for (const template of templates) {
        await deleteDoc(doc(db, 'pdfTemplates', template.id));
        console.log(`Deleted template: ${template.id}`);
      }
      console.log('All PDF templates deleted successfully');
      setTemplates([]);
    } catch (error) {
      console.error('Error deleting templates:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>PDF Template Manager</h2>
      <p>This component manages PDF templates for invoices, quotes, and statements.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={deleteAllTemplates}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Delete All Templates
        </button>
      </div>

      <div>
        <h3>Current Templates ({templates.length})</h3>
        {templates.length === 0 ? (
          <p>No templates found. Default templates will be created automatically when needed.</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {templates.map(template => (
              <div key={template.id} style={{
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '5px',
                backgroundColor: '#f9f9f9'
              }}>
                <strong>{template.name}</strong> ({template.type})
                {template.isDefault && <span style={{ color: 'green', marginLeft: '10px' }}>DEFAULT</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFTemplateCreator;
