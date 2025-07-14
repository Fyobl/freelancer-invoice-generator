
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { createDefaultTemplates } from './pdfTemplateService';

const PDFTemplateCreator = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const createDefaults = async () => {
    setLoading(true);
    try {
      await createDefaultTemplates();
      await fetchTemplates();
      alert('Default templates created successfully!');
    } catch (error) {
      console.error('Error creating default templates:', error);
      alert('Error creating default templates: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAllTemplates = async () => {
    if (!window.confirm('Are you sure you want to delete all templates? This cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      for (const template of templates) {
        await deleteDoc(doc(db, 'pdfTemplates', template.id));
      }
      setTemplates([]);
      alert('All templates deleted successfully!');
    } catch (error) {
      console.error('Error deleting templates:', error);
      alert('Error deleting templates: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const defaultTemplates = templates.filter(t => t.isDefault);
  const invoiceTemplate = defaultTemplates.find(t => t.type === 'invoice');
  const quoteTemplate = defaultTemplates.find(t => t.type === 'quote');
  const statementTemplate = defaultTemplates.find(t => t.type === 'statement');

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ color: '#333', marginBottom: '20px' }}>PDF Template Manager</h2>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Manage the default PDF templates for invoices, quotes, and statements.
      </p>
      
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <button 
          onClick={createDefaults}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Creating...' : 'Create Default Templates'}
        </button>
        
        <button 
          onClick={deleteAllTemplates}
          disabled={loading || templates.length === 0}
          style={{
            padding: '12px 24px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: (loading || templates.length === 0) ? 'not-allowed' : 'pointer',
            opacity: (loading || templates.length === 0) ? 0.6 : 1
          }}
        >
          {loading ? 'Deleting...' : 'Delete All Templates'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{
          padding: '20px',
          border: '2px solid #e9ecef',
          borderRadius: '8px',
          backgroundColor: invoiceTemplate ? '#d4edda' : '#f8d7da'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Invoice Template</h3>
          <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
            {invoiceTemplate ? 'Default template is available' : 'No default template found'}
          </p>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Status: <strong style={{ color: invoiceTemplate ? '#28a745' : '#dc3545' }}>
              {invoiceTemplate ? 'Active' : 'Missing'}
            </strong>
          </div>
        </div>

        <div style={{
          padding: '20px',
          border: '2px solid #e9ecef',
          borderRadius: '8px',
          backgroundColor: quoteTemplate ? '#d4edda' : '#f8d7da'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Quote Template</h3>
          <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
            {quoteTemplate ? 'Default template is available' : 'No default template found'}
          </p>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Status: <strong style={{ color: quoteTemplate ? '#28a745' : '#dc3545' }}>
              {quoteTemplate ? 'Active' : 'Missing'}
            </strong>
          </div>
        </div>

        <div style={{
          padding: '20px',
          border: '2px solid #e9ecef',
          borderRadius: '8px',
          backgroundColor: statementTemplate ? '#d4edda' : '#f8d7da'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Statement Template</h3>
          <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
            {statementTemplate ? 'Default template is available' : 'No default template found'}
          </p>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Status: <strong style={{ color: statementTemplate ? '#28a745' : '#dc3545' }}>
              {statementTemplate ? 'Active' : 'Missing'}
            </strong>
          </div>
        </div>
      </div>

      {templates.length === 0 && (
        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          color: '#856404'
        }}>
          <strong>No templates found!</strong> Click "Create Default Templates" to set up the required templates.
        </div>
      )}
    </div>
  );
};

export default PDFTemplateCreator;
