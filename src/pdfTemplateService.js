
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

// Template-based PDF generation removed - using original emailService functions instead
