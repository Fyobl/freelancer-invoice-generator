
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase.js';
import Navigation from './Navigation.js';
import { generatePDFWithLogo } from './pdfService.js';

function Dashboard() {
  const [clientName, setClientName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [vat, setVat] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('Unpaid');
  const [notes, setNotes] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [template, setTemplate] = useState('standard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(1);
  const [companySettings, setCompanySettings] = useState({});
  const [userData, setUserData] = useState(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, invoiceId: null, invoiceName: '' });

  const user = auth.currentUser;

  // Styling objects
  const containerStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minHeight: '100vh',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  };

  const contentStyle = {
    padding: '30px',
    maxWidth: '1400px',
    margin: '0 auto',
    paddingTop: '100px'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '40px',
    color: 'white',
    padding: '20px 0'
  };

  const statsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '25px',
    marginBottom: '40px'
  };

  const statCardStyle = {
    background: 'rgba(255,255,255,0.95)',
    padding: '30px',
    borderRadius: '16px',
    textAlign: 'center',
    backdropFilter: 'blur(15px)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    border: '2px solid rgba(255,255,255,0.2)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
  };

  const formStyle = {
    background: 'rgba(255,255,255,0.95)',
    padding: '40px',
    borderRadius: '20px',
    marginBottom: '40px',
    backdropFilter: 'blur(15px)',
    boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
    border: '2px solid rgba(255,255,255,0.2)'
  };

  const inputStyle = {
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
    display: 'block'
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
    padding: '15px 30px',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
  };

  const tableStyle = {
    background: 'rgba(255,255,255,0.95)',
    borderRadius: '20px',
    overflow: 'hidden',
    backdropFilter: 'blur(15px)',
    boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
    border: '2px solid rgba(255,255,255,0.2)'
  };

  const searchFilterStyle = {
    background: 'rgba(255,255,255,0.9)',
    padding: '25px',
    borderRadius: '16px',
    marginBottom: '30px',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 15px 30px rgba(0,0,0,0.1)',
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
    flexWrap: 'wrap'
  };

  const cardStyle = {
    background: 'rgba(255,255,255,0.95)',
    padding: '20px',
    borderRadius: '16px',
    marginBottom: '30px',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 15px 30px rgba(0,0,0,0.1)',
  };

  useEffect(() => {
    if (!user) return;
    fetchAllData();
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

  const fetchAllData = async () => {
    // Fetch invoices
    const invoicesQuery = query(collection(db, 'invoices'), where('userId', '==', user.uid));
    const invoicesSnapshot = await getDocs(invoicesQuery);
    const invoicesData = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setInvoices(invoicesData);

    // Calculate next invoice number
    const invoiceNumbers = invoicesData
      .map(inv => parseInt(inv.invoiceNumber?.replace('INV-', '') || '0'))
      .filter(num => !isNaN(num));
    const maxNumber = invoiceNumbers.length > 0 ? Math.max(...invoiceNumbers) : 0;
    setNextInvoiceNumber(maxNumber + 1);

    // Fetch products
    const productsQuery = query(collection(db, 'products'), where('userId', '==', user.uid));
    const productsSnapshot = await getDocs(productsQuery);
    const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setProducts(productsData);

    // Fetch clients
    const clientsQuery = query(collection(db, 'clients'), where('userId', '==', user.uid));
    const clientsSnapshot = await getDocs(clientsQuery);
    const clientsData = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setClients(clientsData);

    // Fetch company settings
    const companyQuery = query(collection(db, 'companySettings'), where('userId', '==', user.uid));
    const companySnapshot = await getDocs(companyQuery);
    if (!companySnapshot.empty) {
      const companyData = companySnapshot.docs[0].data();
      setCompanySettings(companyData);
    }
  };

  const fetchProducts = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'products'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const productList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productList);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchClients = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'clients'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const clientList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClients(clientList);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchCompanySettings = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'companySettings'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const companyData = snapshot.docs[0].data();
        setCompanySettings(companyData);
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInvoices();
      fetchProducts();
      fetchClients();
      fetchCompanySettings();
      fetchUserData();
    }
  }, [user]);

  const fetchInvoices = async () => {
    if (!user) return;

    console.log('Fetching invoices for user:', user.uid);
    try {
      const q = query(collection(db, 'invoices'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      const invoiceList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setInvoices(invoiceList);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      console.log('This is likely due to Firestore security rules requiring authentication');
    }
  };

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const checkSubscriptionStatus = async (userId) => {
    try {
      const response = await fetch('/api/check-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to check subscription');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error checking subscription:', error);
      return { success: false };
    }
  };

  const incrementInvoiceCount = async (userId) => {
    try {
      const response = await fetch('/api/increment-invoice-count', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to increment invoice count');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error incrementing invoice count:', error);
      return { success: false };
    }
  };

  const handleAddInvoice = async () => {
    // Check subscription status and limits first
    const subscriptionCheck = await checkSubscriptionStatus(user.uid);
    if (!subscriptionCheck.success) {
      alert('Error checking subscription status. Please try again.');
      return;
    }

    if (subscriptionCheck.expired) {
      alert('Your subscription has expired. Please upgrade to continue creating invoices.');
      return;
    }

    // Check invoice limit
    const incrementResult = await incrementInvoiceCount(user.uid);
    if (!incrementResult.success) {
      if (incrementResult.limitReached) {
        alert('You have reached your invoice limit for this billing period. Please upgrade your subscription to create more invoices.');
        return;
      } else {
        alert('Error checking invoice limits. Please try again.');
        return;
      }
    }

    if (!clientName || !amount) return;

    const invoiceNumber = `INV-${String(nextInvoiceNumber).padStart(4, '0')}`;

    const newInvoice = {
      userId: user.uid,
      clientName,
      clientId: selectedClientId || null,
      amount: parseFloat(amount),
      vat: parseFloat(vat) || 0,
      dueDate,
      status,
      notes,
      template,
      productId: selectedProductId || null,
      selectedProducts: selectedProducts || [],
      createdAt: serverTimestamp(),
      invoiceNumber
    };

    const docRef = await addDoc(collection(db, 'invoices'), newInvoice);
    setInvoices(prev => [...prev, { ...newInvoice, id: docRef.id }]);
    setNextInvoiceNumber(prev => prev + 1);

    // Reset form
    resetForm();
  };

  const handleStatusChange = async (invoiceId, newStatus) => {
    await updateDoc(doc(db, 'invoices', invoiceId), { status: newStatus });
    setInvoices(prev => prev.map(inv => 
      inv.id === invoiceId ? { ...inv, status: newStatus } : inv
    ));
  };

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

  const deleteInvoice = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        const invoiceToDelete = invoices.find(invoice => invoice.id === id);
        await deleteDoc(doc(db, 'invoices', id));

        // Add audit log
        await addAuditLog('INVOICE_DELETED', {
          invoiceId: id,
          invoiceNumber: invoiceToDelete?.invoiceNumber || 'Unknown',
          amount: invoiceToDelete?.amount || 0,
          clientName: invoiceToDelete?.clientName || 'Unknown',
          deletedAt: new Date()
        });

        fetchInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  const downloadInvoicePDF = async (invoice) => {
    try {
      // Get client data if available
      let clientData = null;
      if (invoice.clientId) {
        const clientDoc = await getDoc(doc(db, 'clients', invoice.clientId));
        if (clientDoc.exists()) {
          clientData = clientDoc.data();
        }
      }

      // Generate PDF with logo
      const pdfDoc = await generatePDFWithLogo('invoice', invoice, companySettings, clientData);

      // Download the PDF
      pdfDoc.save(`${invoice.invoiceNumber || 'Invoice'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
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
      console.error('Error generating Quote PDF:', error);
      alert('Error generating Quote PDF. Please try again.');
    }
  };

  const downloadStatementPDF = async (client, statements) => {
    try {
      // Generate PDF with logo
      const pdfDoc = await generatePDFWithLogo('statement', statements, companySettings, client);

      // Download the PDF
      pdfDoc.save(`${client.name || 'Client'}_Statement.pdf`);
    } catch (error) {
      console.error('Error generating Statement PDF:', error);
      alert('Error generating Statement PDF. Please try again.');
    }
  };

  const handleDelete = (invoice) => {
    setDeleteConfirmation({ 
      show: true, 
      invoiceId: invoice.id, 
      invoiceName: invoice.invoiceNumber 
    });
  };

  const confirmDelete = async () => {
    if (deleteConfirmation.invoiceId) {
      try {
        // Get the invoice data before deleting
        const invoiceDoc = await getDoc(doc(db, 'invoices', deleteConfirmation.invoiceId));
        if (invoiceDoc.exists()) {
          const invoiceData = invoiceDoc.data();

          // Add audit log before deletion
          await addAuditLog('INVOICE_DELETED', {
            invoiceId: deleteConfirmation.invoiceId,
            invoiceNumber: invoiceData.invoiceNumber || 'Unknown',
            amount: invoiceData.amount || 0,
            clientName: invoiceData.clientName || 'Unknown',
            deletedAt: new Date()
          });

          // Move to recycle bin
          await addDoc(collection(db, 'recycleBin'), {
            ...invoiceData,
            originalId: deleteConfirmation.invoiceId,
            originalCollection: 'invoices',
            deletedAt: serverTimestamp(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            userId: user.uid
          });

          // Delete from original collection
          await deleteDoc(doc(db, 'invoices', deleteConfirmation.invoiceId));
        }
        fetchInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
    setDeleteConfirmation({ show: false, invoiceId: null, invoiceName: '' });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, invoiceId: null, invoiceName: '' });
  };

  const handleClientSelect = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setSelectedClientId(clientId);
      setClientName(client.name);
    } else {
      setSelectedClientId('');
      setClientName('');
    }
  };

  const addProductToInvoice = (productId) => {
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
      calculateInvoiceTotals([...selectedProducts, { ...product, quantity: 1 }]);
      setSelectedProductId('');
      setProductSearchTerm('');
    }
  };

  const removeProductFromInvoice = (productIndex) => {
    const updatedProducts = selectedProducts.filter((_, index) => index !== productIndex);
    setSelectedProducts(updatedProducts);
    calculateInvoiceTotals(updatedProducts);
  };

  const updateProductQuantity = (productIndex, quantity) => {
    if (quantity <= 0) {
      removeProductFromInvoice(productIndex);
      return;
    }

    const updatedProducts = [...selectedProducts];
    updatedProducts[productIndex].quantity = quantity;
    setSelectedProducts(updatedProducts);
    calculateInvoiceTotals(updatedProducts);
  };

  const calculateInvoiceTotals = (products) => {
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

  const resetForm = () => {
    setClientName('');
    setSelectedClientId('');
    setSelectedProducts([]);
    setSelectedProductId('');
    setProductSearchTerm('');
    setAmount('');
    setVat('');
    setDueDate('');
    setNotes('');
  };

  // Filter invoices based on search and status
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    // Sort by invoice number (extract numeric part)
    const numA = parseInt(a.invoiceNumber?.replace('INV-', '') || '0');
    const numB = parseInt(b.invoiceNumber?.replace('INV-', '') || '0');
    return numB - numA;
  });

  return (
    <div style={containerStyle}>
      <Navigation user={user} userData={userData}/>
      <div style={contentStyle}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: 'bold' }}>
            📄 Eazee Invoice Dashboard
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
            Welcome back, {userData?.firstName || user?.email?.split('@')[0]}! Here's your business overview.
          </p>
        </div>

        {/* Statistics Cards */}
        <div style={statsStyle}>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#667eea', fontSize: '1.1rem' }}>Total Invoices</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
              {invoices.length}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#667eea', fontSize: '1.1rem' }}>Total Revenue</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
              £{invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0).toFixed(2)}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#667eea', fontSize: '1.1rem' }}>Outstanding</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
              £{invoices.filter(inv => inv.status === 'Unpaid').reduce((sum, inv) => sum + (inv.amount || 0), 0).toFixed(2)}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#667eea', fontSize: '1.1rem' }}>This Month</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
              £{invoices.filter(inv => {
                const invoiceDate = new Date(inv.createdAt?.seconds * 1000);
                const currentMonth = new Date().getMonth();
                return invoiceDate.getMonth() === currentMonth;
              }).reduce((sum, inv) => sum + (inv.amount || 0), 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Create Invoice Form */}
        <div style={formStyle}>
          <h2 style={{ marginTop: 0, color: '#333', fontSize: '1.8rem', marginBottom: '10px' }}>
            ✨ Create New Invoice
          </h2>
          <p style={{ color: '#666', marginBottom: '30px', fontSize: '1.1rem' }}>
            Next Invoice Number: <strong style={{ color: '#667eea' }}>INV-{String(nextInvoiceNumber).padStart(4, '0')}</strong>
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
                Select Client
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
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
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
                    {/* Close button */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      padding: '8px 12px',
                      borderBottom: '1px solid #f0f0f0',
                      background: '#f8f9fa'
                    }}>
                      <button
                        onClick={() => setClientName('')}
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
                            // Dropdown will close naturally since clientName is set
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
                        No existing clients found. Press Enter to create "{clientName}" as new client.
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
                              addProductToInvoice(product.id);
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
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
              />

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={selectStyle}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
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
                      onClick={() => removeProductFromInvoice(index)}
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

          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555', marginTop: '20px' }}>
            Notes
          </label>
          <textarea
            placeholder="Add any additional notes or terms..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
          />

          <button
            onClick={handleAddInvoice}
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 12px 25px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
            }}
          >
            🚀 Create Invoice
          </button>
        </div>

        {/* Search and Filter Section */}
        <div style={searchFilterStyle}>
          <h2 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '1.6rem', width: '100%' }}>
            📋 Invoice Management
          </h2>

          <input
            placeholder="🔍 Search invoices by client or number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, marginBottom: 0, minWidth: '300px', flex: 1 }}
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ ...selectStyle, marginBottom: 0, minWidth: '150px' }}
          >
            <option value="all">All Status</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        {/* Invoice Table */}
        {filteredInvoices.length === 0 ? (
          <div style={{ ...formStyle, textAlign: 'center', padding: '60px' }}>
            <h3 style={{ color: '#666', fontSize: '1.4rem', marginBottom: '15px' }}>
              📄 No invoices found
            </h3>
            <p style={{ color: '#999', fontSize: '1.1rem' }}>
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first invoice to get started!'}
            </p>
          </div>
        ) : (
          <div style={tableStyle}>
            <div style={{ padding: '25px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                      <th style={{ padding: '15px', textAlign: 'left', color: 'white', fontWeight: 'bold' }}>Invoice #</th>
                      <th style={{ padding: '15px', textAlign: 'left', color: 'white', fontWeight: 'bold' }}>Client</th>
                      <th style={{ padding: '15px', textAlign: 'right', color: 'white', fontWeight: 'bold' }}>Amount</th>
                      <th style={{ padding: '15px', textAlign: 'center', color: 'white', fontWeight: 'bold' }}>Status</th>
                      <th style={{ padding: '15px', textAlign: 'center', color: 'white', fontWeight: 'bold' }}>Due Date</th>
                      <th style={{ padding: '15px', textAlign: 'center', color: 'white', fontWeight: 'bold' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((inv, index) => (
                      <tr key={inv.id} style={{
                        borderBottom: '1px solid #f1f3f4',
                        backgroundColor: index % 2 === 0 ? '#fafbfc' : 'white',
                        transition: 'background-color 0.2s ease'
                      }}>
                        <td style={{ padding: '15px', fontWeight: 'bold', color: '#667eea' }}>{inv.invoiceNumber}</td>
                        <td style={{ padding: '15px', color: '#333' }}>{inv.clientName}</td>
                        <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: '#333' }}>
                          £{Number(inv.amount).toFixed(2)}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <select
                            value={inv.status}
                            onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                            style={{
                              padding: '6px 12px',
                              background: inv.status === 'Paid' ? '#d4edda' : inv.status === 'Overdue' ? '#f8d7da' : '#fff3cd',
                              border: '2px solid',
                              borderColor: inv.status === 'Paid' ? '#c3e6cb' : inv.status === 'Overdue' ? '#f5c6cb' : '#ffeaa7',
                              borderRadius: '8px',
                              fontWeight: 'bold',
                              fontSize: '12px'
                            }}
                          >
                            <option value="Unpaid">Unpaid</option>
                            <option value="Paid">Paid</option>
                            <option value="Overdue">Overdue</option>
                          </select>
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center', color: '#666' }}>{inv.dueDate}</td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <button
                            onClick={() => downloadInvoicePDF(inv)}
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
                            onClick={() => handleDelete(inv)}
                            style={{
                              padding: '8px 15px',
                              background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Popup */}
      {deleteConfirmation.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            textAlign: 'center'
          }}>
            <h2 style={{ marginBottom: '15px', color: '#333' }}>Confirm Delete</h2>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Are you sure you want to delete invoice <strong>{deleteConfirmation.invoiceName}</strong>?
            </p>
            <button onClick={confirmDelete} style={{
              padding: '10px 20px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginRight: '10px'
            }}>
              Yes, Delete
            </button>
            <button onClick={cancelDelete} style={{
              padding: '10px 20px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
