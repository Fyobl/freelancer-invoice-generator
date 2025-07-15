import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  updateDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from './firebase.js';
import Navigation from './Navigation.js';
import { generatePDFWithLogo } from './pdfService.js';

function Quotes() {
  const [quotes, setQuotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [companySettings, setCompanySettings] = useState({});
  const [userData, setUserData] = useState(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  
  // Form states
  const [clientName, setClientName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [vat, setVat] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [status, setStatus] = useState('Pending');
  const [notes, setNotes] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [nextQuoteNumber, setNextQuoteNumber] = useState(1);
  
  const user = auth.currentUser;

  // Download Quote PDF function
  const downloadQuotePDF = async (quote) => {
    try {
      // Get client data if available
      let clientData = null;
      if (quote.clientId) {
        const clientDoc = await getDoc(doc(db, 'clients', quote.clientId));
        if (clientDoc.exists()) {
          clientData = clientDoc.data();
        }
      }

      // Generate PDF with logo
      const pdfDoc = await generatePDFWithLogo('quote', quote, companySettings, clientData);

      // Download the PDF
      pdfDoc.save(`${quote.quoteNumber || 'Quote'}.pdf`);
    } catch (error) {
      console.error('Error generating Quote PDF:', error);
      alert('Error generating Quote PDF. Please try again.');
    }
  };

  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      fetchQuotes();
      fetchUserData();
      fetchClients();
      fetchProducts();
      fetchCompanySettings();
    }
  }, [user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close client dropdown if clicking outside
      if (!event.target.closest('.client-dropdown-container')) {
        // Only clear if we haven't selected a client yet
        if (!selectedClientId) {
          // Don't clear clientName as user might be typing a new client name
        }
      }
      // Close product dropdown if clicking outside
      if (!event.target.closest('.product-dropdown-container')) {
        setProductSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const companyDoc = await getDoc(doc(db, 'companySettings', user.uid));
      if (companyDoc.exists()) {
        setCompanySettings(companyDoc.data());
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
    }
  };

  const fetchQuotes = async () => {
    try {
      const q = query(collection(db, 'quotes'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setQuotes(data);

      // Calculate next quote number
      const maxQuoteNumber = data.reduce((max, quote) => {
        const num = parseInt(quote.quoteNumber?.replace('QUO-', '')) || 0;
        return Math.max(max, num);
      }, 0);
      setNextQuoteNumber(maxQuoteNumber + 1);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const q = query(collection(db, 'clients'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const q = query(collection(db, 'products'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleClientSelect = (clientId) => {
    setSelectedClientId(clientId);
    if (clientId) {
      const client = clients.find(c => c.id === clientId);
      setClientName(client ? client.name : '');
    } else {
      setClientName('');
    }
  };

  const handleProductSelect = (productId) => {
    setSelectedProductId(productId);
  };

  const addProductToQuote = (productId) => {
    if (!productId) return;

    const product = products.find(p => p.id === productId);
    if (product) {
      const existingProductIndex = selectedProducts.findIndex(p => p.id === productId);

      if (existingProductIndex >= 0) {
        // Increase quantity if product already exists
        const updatedProducts = [...selectedProducts];
        updatedProducts[existingProductIndex].quantity += 1;
        setSelectedProducts(updatedProducts);
      } else {
        // Add new product
        setSelectedProducts([...selectedProducts, {
          ...product,
          quantity: 1
        }]);
      }

      // Calculate totals
      calculateQuoteTotals([...selectedProducts, { ...product, quantity: 1 }]);
      setSelectedProductId('');
      setProductSearchTerm('');
    }
  };

  const removeProductFromQuote = (productIndex) => {
    const updatedProducts = selectedProducts.filter((_, index) => index !== productIndex);
    setSelectedProducts(updatedProducts);
    calculateQuoteTotals(updatedProducts);
  };

  const updateProductQuantity = (productIndex, quantity) => {
    if (quantity <= 0) {
      removeProductFromQuote(productIndex);
      return;
    }

    const updatedProducts = [...selectedProducts];
    updatedProducts[productIndex].quantity = quantity;
    setSelectedProducts(updatedProducts);
    calculateQuoteTotals(updatedProducts);
  };

  const calculateQuoteTotals = (products) => {
    if (products.length === 0) {
      setAmount('');
      setVat('');
      return;
    }

    const subtotal = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    const avgVatRate = products.reduce((sum, product) => sum + product.vat, 0) / products.length;

    setAmount(subtotal.toFixed(2));
    setVat(avgVatRate.toFixed(1));
  };

  const addQuote = async () => {
    if (!clientName.trim()) {
      alert('Please fill in client name');
      return;
    }

    if (selectedProducts.length === 0 && !amount.trim()) {
      alert('Please select products or enter an amount');
      return;
    }

    let finalAmount, finalVat;

    if (selectedProducts.length > 0) {
      finalAmount = selectedProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);
      finalVat = selectedProducts.reduce((sum, product) => sum + product.vat, 0) / selectedProducts.length;
    } else {
      finalAmount = parseFloat(amount);
      finalVat = parseFloat(vat) || 0;

      if (isNaN(finalAmount) || finalAmount <= 0) {
        alert('Amount must be a valid positive number');
        return;
      }
    }

    const quoteNumber = `QUO-${String(nextQuoteNumber).padStart(4, '0')}`;
    const validUntilDate = validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      await addDoc(collection(db, 'quotes'), {
        quoteNumber,
        clientName: clientName.trim(),
        clientId: selectedClientId || null,
        amount: finalAmount,
        vat: finalVat,
        validUntil: validUntilDate,
        notes: notes.trim(),
        status: 'Pending',
        userId: user.uid,
        selectedProducts: selectedProducts.length > 0 ? selectedProducts : null,
        createdAt: serverTimestamp()
      });

      // Reset form
      setClientName('');
      setSelectedClientId('');
      setSelectedProductId('');
      setSelectedProducts([]);
      setProductSearchTerm('');
      setAmount('');
      setVat('');
      setValidUntil('');
      setNotes('');

      fetchQuotes();
    } catch (error) {
      console.error('Error adding quote:', error);
      alert('Error creating quote. Please try again.');
    }
  };

  const updateQuoteStatus = async (quoteId, newStatus) => {
    try {
      await updateDoc(doc(db, 'quotes', quoteId), {
        status: newStatus
      });
      fetchQuotes();
    } catch (error) {
      console.error('Error updating quote status:', error);
    }
  };

  const convertToInvoice = async (quote) => {
    try {
      // Get next invoice number
      const invoicesQuery = query(collection(db, 'invoices'), where('userId', '==', user.uid));
      const invoicesSnapshot = await getDocs(invoicesQuery);
      const invoices = invoicesSnapshot.docs.map(doc => doc.data());

      const maxInvoiceNumber = invoices.reduce((max, invoice) => {
        const num = parseInt(invoice.invoiceNumber?.replace('INV-', '')) || 0;
        return Math.max(max, num);
      }, 0);

      const invoiceNumber = `INV-${String(maxInvoiceNumber + 1).padStart(4, '0')}`;
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Create invoice from quote
      await addDoc(collection(db, 'invoices'), {
        invoiceNumber,
        clientName: quote.clientName,
        clientId: quote.clientId,
        amount: quote.amount,
        vat: quote.vat,
        dueDate,
        notes: quote.notes,
        status: 'Unpaid',
        userId: user.uid,
        createdAt: serverTimestamp(),
        convertedFromQuote: quote.quoteNumber
      });

      // Update quote status
      await updateQuoteStatus(quote.id, 'Converted');
    } catch (error) {
      console.error('Error converting quote to invoice:', error);
      alert('Error converting quote to invoice. Please try again.');
    }
  };

  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, quoteId: null, quoteName: '' });

  const handleDeleteQuote = (quote) => {
    setDeleteConfirmation({ 
      show: true, 
      quoteId: quote.id, 
      quoteName: quote.quoteNumber 
    });
  };

  const confirmDelete = async () => {
    if (deleteConfirmation.quoteId) {
      try {
        // Get the quote data before deleting
        const quoteDoc = await getDoc(doc(db, 'quotes', deleteConfirmation.quoteId));
        if (quoteDoc.exists()) {
          const quoteData = quoteDoc.data();

          // Move to recycle bin
          await addDoc(collection(db, 'recycleBin'), {
            ...quoteData,
            originalId: deleteConfirmation.quoteId,
            originalCollection: 'quotes',
            deletedAt: serverTimestamp(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            userId: user.uid
          });

          // Delete from original collection
          await deleteDoc(doc(db, 'quotes', deleteConfirmation.quoteId));
        }
        fetchQuotes();
      } catch (error) {
        console.error('Error deleting quote:', error);
      }
    }
    setDeleteConfirmation({ show: false, quoteId: null, quoteName: '' });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, quoteId: null, quoteName: '' });
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || quote.status === filterStatus;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    // Sort by quote number (extract numeric part) - newest first
    const numA = parseInt(a.quoteNumber?.replace('QUO-', '') || '0');
    const numB = parseInt(b.quoteNumber?.replace('QUO-', '') || '0');
    return numB - numA;
  });

  const addAuditLog = async (action, details) => {
    try {
      await addDoc(collection(db, 'auditLogs'), {
        action,
        details,
        userId: user.uid,
        userEmail: user.email,
        timestamp: new Date(),
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error adding audit log:', error);
    }
  };

  const deleteQuote = async (id) => {
    if (window.confirm('Are you sure you want to delete this quote?')) {
      try {
        const quoteToDelete = quotes.find(quote => quote.id === id);
        await deleteDoc(doc(db, 'quotes', id));

        // Add audit log
        await addAuditLog('QUOTE_DELETED', {
          quoteId: id,
          quoteNumber: quoteToDelete?.quoteNumber || 'Unknown',
          amount: quoteToDelete?.amount || 0,
          clientName: quoteToDelete?.clientName || 'Unknown',
          deletedAt: new Date()
        });

        fetchQuotes();
      } catch (error) {
        console.error('Error deleting quote:', error);
      }
    }
  };

  const downloadQuotePDF = async (quote) => {
    try {
      // Get client data if available
      let clientData = null;
      if (quote.clientId) {
        const clientDoc = await getDoc(doc(db, 'clients', quote.clientId));
        if (clientDoc.exists()) {
          clientData = clientDoc.data();
        }
      }

      // Generate PDF with logo
      const pdfDoc = await generatePDFWithLogo('quote', quote, companySettings, clientData);
      
      // Download the PDF
      pdfDoc.save(`${quote.quoteNumber || 'Quote'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };</old_str>
  const [quotes, setQuotes] = useState([]);
  const [userData, setUserData] = useState(null);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [companySettings, setCompanySettings] = useState({});
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [amount, setAmount] = useState('');
  const [vat, setVat] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [nextQuoteNumber, setNextQuoteNumber] = useState(1);

  useEffect(() => {
    if (user) {
      fetchQuotes();
      fetchUserData();
      fetchClients();
      fetchProducts();
      fetchCompanySettings();
    }
  }, [user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close client dropdown if clicking outside
      if (!event.target.closest('.client-dropdown-container')) {
        // Only clear if we haven't selected a client yet
        if (!selectedClientId) {
          // Don't clear clientName as user might be typing a new client name
        }
      }
      // Close product dropdown if clicking outside
      if (!event.target.closest('.product-dropdown-container')) {
        setProductSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const companyDoc = await getDoc(doc(db, 'companySettings', user.uid));
      if (companyDoc.exists()) {
        setCompanySettings(companyDoc.data());
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
    }
  };

  const fetchQuotes = async () => {
    try {
      const q = query(collection(db, 'quotes'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setQuotes(data);

      // Calculate next quote number
      const maxQuoteNumber = data.reduce((max, quote) => {
        const num = parseInt(quote.quoteNumber?.replace('QUO-', '')) || 0;
        return Math.max(max, num);
      }, 0);
      setNextQuoteNumber(maxQuoteNumber + 1);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const q = query(collection(db, 'clients'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const q = query(collection(db, 'products'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleClientSelect = (clientId) => {
    setSelectedClientId(clientId);
    if (clientId) {
      const client = clients.find(c => c.id === clientId);
      setClientName(client ? client.name : '');
    } else {
      setClientName('');
    }
  };

  const handleProductSelect = (productId) => {
    setSelectedProductId(productId);
  };

  const addProductToQuote = (productId) => {
    if (!productId) return;

    const product = products.find(p => p.id === productId);
    if (product) {
      const existingProductIndex = selectedProducts.findIndex(p => p.id === productId);

      if (existingProductIndex >= 0) {
        // Increase quantity if product already exists
        const updatedProducts = [...selectedProducts];
        updatedProducts[existingProductIndex].quantity += 1;
        setSelectedProducts(updatedProducts);
      } else {
        // Add new product
        setSelectedProducts([...selectedProducts, {
          ...product,
          quantity: 1
        }]);
      }

      // Calculate totals
      calculateQuoteTotals([...selectedProducts, { ...product, quantity: 1 }]);
      setSelectedProductId('');
      setProductSearchTerm('');
    }
  };

  const removeProductFromQuote = (productIndex) => {
    const updatedProducts = selectedProducts.filter((_, index) => index !== productIndex);
    setSelectedProducts(updatedProducts);
    calculateQuoteTotals(updatedProducts);
  };

  const updateProductQuantity = (productIndex, quantity) => {
    if (quantity <= 0) {
      removeProductFromQuote(productIndex);
      return;
    }

    const updatedProducts = [...selectedProducts];
    updatedProducts[productIndex].quantity = quantity;
    setSelectedProducts(updatedProducts);
    calculateQuoteTotals(updatedProducts);
  };

  const calculateQuoteTotals = (products) => {
    if (products.length === 0) {
      setAmount('');
      setVat('');
      return;
    }

    const subtotal = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    const avgVatRate = products.reduce((sum, product) => sum + product.vat, 0) / products.length;

    setAmount(subtotal.toFixed(2));
    setVat(avgVatRate.toFixed(1));
  };

  const addQuote = async () => {
    if (!clientName.trim()) {
      alert('Please fill in client name');
      return;
    }

    if (selectedProducts.length === 0 && !amount.trim()) {
      alert('Please select products or enter an amount');
      return;
    }

    let finalAmount, finalVat;

    if (selectedProducts.length > 0) {
      finalAmount = selectedProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);
      finalVat = selectedProducts.reduce((sum, product) => sum + product.vat, 0) / selectedProducts.length;
    } else {
      finalAmount = parseFloat(amount);
      finalVat = parseFloat(vat) || 0;

      if (isNaN(finalAmount) || finalAmount <= 0) {
        alert('Amount must be a valid positive number');
        return;
      }
    }

    const quoteNumber = `QUO-${String(nextQuoteNumber).padStart(4, '0')}`;
    const validUntilDate = validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      await addDoc(collection(db, 'quotes'), {
        quoteNumber,
        clientName: clientName.trim(),
        clientId: selectedClientId || null,
        amount: finalAmount,
        vat: finalVat,
        validUntil: validUntilDate,
        notes: notes.trim(),
        status: 'Pending',
        userId: user.uid,
        selectedProducts: selectedProducts.length > 0 ? selectedProducts : null,
        createdAt: serverTimestamp()
      });

      // Reset form
      setClientName('');
      setSelectedClientId('');
      setSelectedProductId('');
      setSelectedProducts([]);
      setProductSearchTerm('');
      setAmount('');
      setVat('');
      setValidUntil('');
      setNotes('');

      fetchQuotes();
    } catch (error) {
      console.error('Error adding quote:', error);
      alert('Error creating quote. Please try again.');
    }
  };

  const updateQuoteStatus = async (quoteId, newStatus) => {
    try {
      await updateDoc(doc(db, 'quotes', quoteId), {
        status: newStatus
      });
      fetchQuotes();
    } catch (error) {
      console.error('Error updating quote status:', error);
    }
  };

  const convertToInvoice = async (quote) => {
    try {
      // Get next invoice number
      const invoicesQuery = query(collection(db, 'invoices'), where('userId', '==', user.uid));
      const invoicesSnapshot = await getDocs(invoicesQuery);
      const invoices = invoicesSnapshot.docs.map(doc => doc.data());

      const maxInvoiceNumber = invoices.reduce((max, invoice) => {
        const num = parseInt(invoice.invoiceNumber?.replace('INV-', '')) || 0;
        return Math.max(max, num);
      }, 0);

      const invoiceNumber = `INV-${String(maxInvoiceNumber + 1).padStart(4, '0')}`;
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Create invoice from quote
      await addDoc(collection(db, 'invoices'), {
        invoiceNumber,
        clientName: quote.clientName,
        clientId: quote.clientId,
        amount: quote.amount,
        vat: quote.vat,
        dueDate,
        notes: quote.notes,
        status: 'Unpaid',
        userId: user.uid,
        createdAt: serverTimestamp(),
        convertedFromQuote: quote.quoteNumber
      });

      // Update quote status
      await updateQuoteStatus(quote.id, 'Converted');
    } catch (error) {
      console.error('Error converting quote to invoice:', error);
      alert('Error converting quote to invoice. Please try again.');
    }
  };

  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, quoteId: null, quoteName: '' });

  const handleDeleteQuote = (quote) => {
    setDeleteConfirmation({ 
      show: true, 
      quoteId: quote.id, 
      quoteName: quote.quoteNumber 
    });
  };

  const confirmDelete = async () => {
    if (deleteConfirmation.quoteId) {
      try {
        // Get the quote data before deleting
        const quoteDoc = await getDoc(doc(db, 'quotes', deleteConfirmation.quoteId));
        if (quoteDoc.exists()) {
          const quoteData = quoteDoc.data();

          // Move to recycle bin
          await addDoc(collection(db, 'recycleBin'), {
            ...quoteData,
            originalId: deleteConfirmation.quoteId,
            originalCollection: 'quotes',
            deletedAt: serverTimestamp(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            userId: user.uid
          });

          // Delete from original collection
          await deleteDoc(doc(db, 'quotes', deleteConfirmation.quoteId));
        }
        fetchQuotes();
      } catch (error) {
        console.error('Error deleting quote:', error);
      }
    }
    setDeleteConfirmation({ show: false, quoteId: null, quoteName: '' });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, quoteId: null, quoteName: '' });
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || quote.status === filterStatus;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    // Sort by quote number (extract numeric part) - newest first
    const numA = parseInt(a.quoteNumber?.replace('QUO-', '') || '0');
    const numB = parseInt(b.quoteNumber?.replace('QUO-', '') || '0');
    return numB - numA;
  });

  const addAuditLog = async (action, details) => {
    try {
      await addDoc(collection(db, 'auditLogs'), {
        action,
        details,
        userId: user.uid,
        userEmail: user.email,
        timestamp: new Date(),
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error adding audit log:', error);
    }
  };

  const deleteQuote = async (id) => {
    if (window.confirm('Are you sure you want to delete this quote?')) {
      try {
        const quoteToDelete = quotes.find(quote => quote.id === id);
        await deleteDoc(doc(db, 'quotes', id));

        // Add audit log
        await addAuditLog('QUOTE_DELETED', {
          quoteId: id,
          quoteNumber: quoteToDelete?.quoteNumber || 'Unknown',
          amount: quoteToDelete?.amount || 0,
          clientName: quoteToDelete?.clientName || 'Unknown',
          deletedAt: new Date()
        });

        fetchQuotes();
      } catch (error) {
        console.error('Error deleting quote:', error);
      }
    }
  };

  const downloadQuotePDF = async (quote) => {
    try {
      // Get client data if available
      let clientData = null;
      if (quote.clientId) {
        const clientDoc = await getDoc(doc(db, 'clients', quote.clientId));
        if (clientDoc.exists()) {
          clientData = clientDoc.data();
        }
      }

      // Generate PDF with logo
      const pdfDoc = await generatePDFWithLogo('quote', quote, companySettings, clientData);
      
      // Download the PDF
      pdfDoc.save(`${quote.quoteNumber || 'Quote'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };





  // Styles
  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '40px',
    color: 'white'
  };

  const cardStyle = {
    background: 'white',
    borderRadius: '15px',
    padding: '30px',
    marginBottom: '30px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    border: 'none'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 15px',
    border: '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '15px',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
    height: '44px',
    lineHeight: '20px',
    verticalAlign: 'top'
  };

  const selectStyle = {
    width: '100%',
    padding: '15px 18px',
    border: '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '16px',
    marginBottom: '15px',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
    height: '52px',
    lineHeight: '20px',
    verticalAlign: 'top',
    appearance: 'none',
    display: 'block'
  };

  const buttonStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 25px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    marginRight: '10px'
  };

  const quoteCardStyle = {
    background: 'white',
    border: '2px solid #f8f9fa',
    borderRadius: '12px',
    padding: '25px',
    marginBottom: '20px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease'
  };

  const statsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  };

  const statCardStyle = {
    background: 'rgba(255,255,255,0.9)',
    padding: '20px',
    borderRadius: '12px',
    textAlign: 'center',
    backdropFilter: 'blur(10px)'
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#ffc107';
      case 'Accepted': return '#28a745';
      case 'Rejected': return '#dc3545';
      case 'Converted': return '#6f42c1';
      default: return '#6c757d';
    }
  };

  const pendingQuotes = quotes.filter(q => q.status === 'Pending');
  const acceptedQuotes = quotes.filter(q => q.status === 'Accepted');
  const totalQuoteValue = quotes.reduce((sum, q) => sum + (parseFloat(q.amount) || 0), 0);

  return (
    <div style={containerStyle}>
      <Navigation user={user} />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', paddingTop: '100px' }}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '300' }}>
            💰 Quote Management
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
            Hello {userData?.firstName || user?.email?.split('@')[0]}! Create and manage your quotes here
          </p>
        </div>

        {/* Statistics */}
        <div style={statsStyle}>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Total Quotes</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
              {quotes.length}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Pending</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
              {pendingQuotes.length}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Accepted</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
              {acceptedQuotes.length}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Total Value</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
              £{totalQuoteValue.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Create Quote Form */}
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, color: '#333', fontSize: '1.5rem' }}>
            ✨ Create New Quote
          </h2>
          <p style={{ color: '#666', marginBottom: '30px', fontSize: '1.1rem' }}>
            Next Quote Number: <strong style={{ color: '#667eea' }}>QUO-{String(nextQuoteNumber).padStart(4, '0')}</strong>
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                Select Client *
              </label>
              <div className="client-dropdown-container" style={{ position: 'relative', marginBottom: '15px' }}>
                <input
                  type="text"
                  placeholder="🔍 Type to search clients or enter new client name..."
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    setSelectedClientId('');
                  }}
                  style={{ ...inputStyle, marginBottom: '0' }}
                />
                {clientName && !selectedClientId && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '2px solid #e1e5e9',
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }}>
                    {clients
                      .filter(client => 
                        client.name.toLowerCase().includes(clientName.toLowerCase()) ||
                        (client.email && client.email.toLowerCase().includes(clientName.toLowerCase()))
                      )
                      .map(client => (
                        <div
                          key={client.id}
                          onClick={() => {
                            setSelectedClientId(client.id);
                            setClientName(client.name);
                            // Dropdown will close since selectedClientId is set
                          }}
                          style={{
                            padding: '12px 15px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0',
                            backgroundColor: selectedClientId === client.id ? '#f8f9fa' : 'white',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = selectedClientId === client.id ? '#f8f9fa' : 'white'}
                        >
                          <div style={{ fontWeight: 'bold', color: '#333' }}>{client.name}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>{client.email}</div>
                        </div>
                      ))}
                    {clients.filter(client => 
                      client.name.toLowerCase().includes(clientName.toLowerCase()) ||
                      (client.email && client.email.toLowerCase().includes(clientName.toLowerCase()))
                    ).length === 0 && clientName.trim() && (
                      <div style={{ padding: '12px 15px', color: '#666', fontStyle: 'italic' }}>
                        No existing clients found. Creating "{clientName}" as new client.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                Add Product/Service
              </label>
              <div className="product-dropdown-container" style={{ position: 'relative', marginBottom: '15px' }}>
                  <input
                    type="text"
                    placeholder="🔍 Type to search and select product..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    onFocus={() => setSelectedProductId('')}
                    style={{ ...inputStyle, marginBottom: '0' }}
                  />
                  {productSearchTerm && !selectedProductId && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '2px solid #e1e5e9',
                      borderTop: 'none',
                      borderRadius: '0 0 8px 8px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }}>
                      {/* Close button */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        padding: '8px 12px',
                        borderBottom: '1px solid #f0f0f0',
                        background: '#f8f9fa'
                      }}>
                        <button
                          onClick={() => setProductSearchTerm('')}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '16px',
                            color: '#666',
                            padding: '0',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                      {products
                        .filter(product => 
                          product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                          (product.description && product.description.toLowerCase().includes(productSearchTerm.toLowerCase()))
                        )
                        .map(product => (
                          <div
                            key={product.id}
                            onClick={() => {
                              setSelectedProductId(product.id);
                              setProductSearchTerm(product.name);
                              // Auto-add the product
                              addProductToQuote(product.id);
                            }}
                            style={{
                              padding: '12px 15px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f0f0f0',
                              backgroundColor: selectedProductId === product.id ? '#f8f9fa' : 'white',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = selectedProductId === product.id ? '#f8f9fa' : 'white'}
                          >
                            <div style={{ fontWeight: 'bold', color: '#333' }}>{product.name}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>£{product.price.toFixed(2)}</div>
                          </div>
                        ))}
                      {products.filter(product => 
                        product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                        (product.description && product.description.toLowerCase().includes(productSearchTerm.toLowerCase()))
                      ).length === 0 && (
                        <div style={{ padding: '12px 15px', color: '#666', fontStyle: 'italic' }}>
                          No products found
                        </div>
                      )}
                    </div>
                  )}
                </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                Valid Until
              </label>
              <input
                style={inputStyle}
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>

          {/* Selected Products Display - Full Width */}
          {selectedProducts.length > 0 && (
            <div style={{
              background: '#f8f9fa',
              border: '2px solid #e9ecef',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#555', fontSize: '16px' }}>Selected Products:</h4>
              {selectedProducts.map((product, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: index < selectedProducts.length - 1 ? '1px solid #dee2e6' : 'none'
                }}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '14px' }}>{product.name}</strong><br />
                    <small style={{ color: '#666' }}>£{product.price.toFixed(2)} each</small>
                    {product.vat > 0 && (
                      <div style={{ fontSize: '12px', color: '#28a745', fontWeight: 'bold' }}>
                        VAT: {product.vat}%
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '12px', color: '#666' }}>Qty:</span>
                      <input
                        type="number"
                        min="1"
                        value={product.quantity}
                        onChange={(e) => updateProductQuantity(index, parseInt(e.target.value) || 1)}
                        style={{
                          width: '60px',
                          padding: '6px 8px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          textAlign: 'center',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '80px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                        £{(product.price * product.quantity).toFixed(2)}
                      </div>
                      {product.vat > 0 && (
                        <div style={{ fontSize: '12px', color: '#28a745' }}>
                          +£{((product.price * product.quantity) * (product.vat / 100)).toFixed(2)} VAT
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProductFromQuote(index)}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ❌
                    </button>
                  </div>
                </div>
              ))}
              <div style={{
                marginTop: '15px',
                paddingTop: '15px',
                borderTop: '2px solid #dee2e6',
                textAlign: 'right'
              }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
                  Subtotal: £{selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0).toFixed(2)}
                </div>
                {selectedProducts.some(p => p.vat > 0) && (
                  <div style={{ fontSize: '14px', color: '#28a745', marginBottom: '5px' }}>
                    VAT: £{selectedProducts.reduce((sum, p) => sum + ((p.price * p.quantity) * (p.vat / 100)), 0).toFixed(2)}
                  </div>
                )}
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#667eea' }}>
                  Total: £{selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity * (1 + (p.vat / 100))), 0).toFixed(2)}
                </div>
              </div>
            </div>
          )}

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555', marginTop: '20px' }}>
            Notes
          </label>
          <textarea
            placeholder="Add any additional notes or terms..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
          />

          <button
            onClick={addQuote}
            style={buttonStyle}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            💰 Create Quote
          </button>
        </div>

        {/* Search and Filter */}
        <div style={cardStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                🔍 Search Quotes
              </label>
              <input
                style={inputStyle}
                placeholder="Search by client name or quote number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                Filter by Status
              </label>
              <select
                style={selectStyle}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
                <option value="Converted">Converted</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quotes List */}
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, color: '#333', fontSize: '1.5rem' }}>
            📋 Your Quotes ({filteredQuotes.length})
          </h2>

          {filteredQuotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>💰</div>
              <h3>No quotes found</h3>
              <p>{searchTerm ? 'Try adjusting your search terms' : 'Create your first quote to get started!'}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {filteredQuotes.map(quote => (
                <div
                  key={quote.id}
                  style={quoteCardStyle}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 15px 35px rgba(102, 126, 234, 0.1)';
                    e.currentTarget.style.borderColor = '#667eea';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#f8f9fa';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div>
                      <h3 style={{ margin: 0, color: '#333', fontSize: '1.2rem' }}>{quote.quoteNumber}</h3>
                      <p style={{ margin: '5px 0', color: '#666', fontSize: '1rem' }}>{quote.clientName}</p>
                    </div>
                    <span style={{
                      background: getStatusColor(quote.status),
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {quote.status}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                    <div>
                      <p style={{ margin: '5px 0', color: '#666' }}>
                        <strong>Amount:</strong> £{parseFloat(quote.amount).toFixed(2)}
                      </p>
                      {quote.vat > 0 && (
                        <p style={{ margin: '5px 0', color: '#666' }}>
                          <strong>VAT ({quote.vat}%):</strong> £{(parseFloat(quote.amount) * quote.vat / 100).toFixed(2)}
                        </p>
                      )}
                      <p style={{ margin: '5px 0', color: '#666' }}>
                        <strong>Total:</strong> £{(parseFloat(quote.amount) * (1 + (quote.vat || 0) / 100)).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: '5px 0', color: '#666' }}>
                        <strong>Valid Until:</strong> {quote.validUntil}
                      </p>
                      <p style={{ margin: '5px 0', color: '#666' }}>
                        <strong>Created:</strong> {quote.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {quote.notes && (
                    <div style={{ marginBottom: '15px' }}>
                      <p style={{ margin: '5px 0', color: '#666' }}>
                        <strong>Notes:</strong> {quote.notes}
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {quote.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => updateQuoteStatus(quote.id, 'Accepted')}
                          style={{
                            ...buttonStyle,
                            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                            fontSize: '12px',
                            padding: '8px 16px',
                            marginRight: '5px'
                          }}
                        >
                          ✅ Accept
                        </button>
                        <button
                          onClick={() => updateQuoteStatus(quote.id, 'Rejected')}
                          style={{
                            ...buttonStyle,
                            background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                            fontSize: '12px',
                            padding: '8px 16px',
                            marginRight: '5px'
                          }}
                        >
                          ❌ Reject
                        </button>
                      </>
                    )}
                    {quote.status === 'Accepted' && (
                      <button
                        onClick={() => convertToInvoice(quote)}
                        style={{
                          ...buttonStyle,
                          background: 'linear-gradient(135deg, #6f42c1 0%, #563d7c 100%)',
                          fontSize: '12px',
                          padding: '8px 16px',
                          marginRight: '5px'
                        }}
                      >
                        🔄 Convert to Invoice
                      </button>
                    )}

                    <button
                      onClick={() => downloadQuotePDF(quote)}
                      style={{
                        ...buttonStyle,
                        background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                        fontSize: '12px',
                        padding: '8px 16px',
                        marginRight: '5px'
                      }}
                    >
                      📄 PDF
                    </button>

                    <button
                      onClick={() => handleDeleteQuote(quote)}
                      style={{
                        ...buttonStyle,
                        background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                        fontSize: '12px',
                        padding: '8px 16px',
                        marginRight: '5px'
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom Delete Confirmation Popup */}
        {deleteConfirmation.show && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              border: '2px solid #dc3545'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>⚠️</div>
              <h2 style={{ color: '#333', marginBottom: '15px', fontSize: '1.4rem' }}>
                Confirm Deletion
              </h2>
              <p style={{ color: '#666', marginBottom: '25px', lineHeight: '1.5' }}>
                Are you sure you want to delete quote <strong>{deleteConfirmation.quoteName}</strong>?
                <br />This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={confirmDelete}
                  style={{
                    background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  🗑️ Delete Quote
                </button>
                <button
                  onClick={cancelDelete}
                  style={{
                    background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  ↩️ Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Quotes;