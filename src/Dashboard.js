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
import { generateInvoicePDF, downloadPDF } from './pdfService.js';

function Dashboard() {
  const [invoices, setInvoices] = useState([]);
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
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(1);
  const [status, setStatus] = useState('Unpaid');

  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      fetchInvoices();
      fetchUserData();
      fetchClients();
      fetchProducts();
      fetchCompanySettings();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.client-dropdown-container')) {
        if (!selectedClientId) {
        }
      }
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
      const q = query(collection(db, 'companySettings'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setCompanySettings(snapshot.docs[0].data());
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
    }
  };

  const fetchInvoices = async () => {
    console.log('Fetching invoices for user:', user.uid);
    try {
      const q = query(collection(db, 'invoices'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInvoices(data);

      const maxInvoiceNumber = data.reduce((max, invoice) => {
        const num = parseInt(invoice.invoiceNumber?.replace('INV-', '')) || 0;
        return Math.max(max, num);
      }, 0);
      setNextInvoiceNumber(maxInvoiceNumber + 1);
    } catch (error) {
      console.error('Error fetching invoices:', error);
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

  const addProductToInvoice = (productId) => {
    if (!productId) return;

    const product = products.find(p => p.id === productId);
    if (product) {
      const existingProductIndex = selectedProducts.findIndex(p => p.id === productId);

      if (existingProductIndex >= 0) {
        const updatedProducts = [...selectedProducts];
        updatedProducts[existingProductIndex].quantity += 1;
        setSelectedProducts(updatedProducts);
      } else {
        setSelectedProducts([...selectedProducts, {
          ...product,
          quantity: 1
        }]);
      }

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

  const addInvoice = async () => {
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

    const invoiceNumber = `INV-${String(nextInvoiceNumber).padStart(4, '0')}`;
    const dueDateValue = dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      await addDoc(collection(db, 'invoices'), {
        invoiceNumber,
        clientName: clientName.trim(),
        clientId: selectedClientId || null,
        amount: finalAmount,
        vat: finalVat,
        dueDate: dueDateValue,
        notes: notes.trim(),
        status: status,
        userId: user.uid,
        selectedProducts: selectedProducts.length > 0 ? selectedProducts : null,
        createdAt: serverTimestamp()
      });

      setClientName('');
      setSelectedClientId('');
      setSelectedProductId('');
      setSelectedProducts([]);
      setProductSearchTerm('');
      setAmount('');
      setVat('');
      setDueDate('');
      setNotes('');
      setStatus('Unpaid');
      fetchInvoices();
    } catch (error) {
      console.error('Error adding invoice:', error);
      alert('Error creating invoice. Please try again.');
    }
  };

  const updateInvoiceStatus = async (invoiceId, newStatus) => {
    try {
      await updateDoc(doc(db, 'invoices', invoiceId), {
        status: newStatus
      });
      fetchInvoices();
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
  };

  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, invoiceId: null, invoiceName: '' });

  const handleDeleteInvoice = (invoice) => {
    setDeleteConfirmation({ 
      show: true, 
      invoiceId: invoice.id, 
      invoiceName: invoice.invoiceNumber 
    });
  };

  const confirmDelete = async () => {
    if (deleteConfirmation.invoiceId) {
      try {
        const invoiceDoc = await getDoc(doc(db, 'invoices', deleteConfirmation.invoiceId));
        if (invoiceDoc.exists()) {
          const invoiceData = invoiceDoc.data();

          await addAuditLog('INVOICE_DELETED', {
            invoiceId: deleteConfirmation.invoiceId,
            invoiceNumber: invoiceData.invoiceNumber || 'Unknown',
            amount: invoiceData.amount || 0,
            clientName: invoiceData.clientName || 'Unknown',
            deletedAt: new Date()
          });

          await addDoc(collection(db, 'recycleBin'), {
            ...invoiceData,
            originalId: deleteConfirmation.invoiceId,
            originalCollection: 'invoices',
            deletedAt: serverTimestamp(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            userId: user.uid
          });

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

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    const numA = parseInt(a.invoiceNumber?.replace('INV-', '') || '0');
    const numB = parseInt(b.invoiceNumber?.replace('INV-', '') || '0');
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

  const downloadInvoicePDF = async (invoice) => {
    try {
      let clientData = null;
      if (invoice.clientId) {
        const clientDoc = await getDoc(doc(db, 'clients', invoice.clientId));
        if (clientDoc.exists()) {
          clientData = clientDoc.data();
        }
      }

      const pdfDoc = await generateInvoicePDF(invoice, companySettings, clientData);
      downloadPDF(pdfDoc, `Invoice-${invoice.invoiceNumber || 'Unknown'}.pdf`);

      await addAuditLog('INVOICE_PDF_DOWNLOADED', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber || 'Unknown',
        clientName: invoice.clientName || 'Unknown',
        downloadedAt: new Date()
      });
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

  const invoiceCardStyle = {
    background: 'white',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '8px',
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
      case 'Paid': return '#28a745';
      case 'Unpaid': return '#ffc107';
      case 'Overdue': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const unpaidInvoices = invoices.filter(i => i.status === 'Unpaid');
  const paidInvoices = invoices.filter(i => i.status === 'Paid');
  const overdueInvoices = invoices.filter(i => i.status === 'Overdue');
  const totalRevenue = invoices.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

  return (
    <div style={containerStyle}>
      <Navigation user={user} />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', paddingTop: '100px' }}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '300' }}>
            📊 Invoice Dashboard
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
            Hello {userData?.firstName || user?.email?.split('@')[0]}! Manage your invoices here
          </p>
        </div>

        {/* Statistics */}
        <div style={statsStyle}>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Total Invoices</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
              {invoices.length}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Unpaid</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
              {unpaidInvoices.length}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Paid</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
              {paidInvoices.length}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Total Value</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
              £{totalRevenue.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Create Invoice Form */}
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, color: '#333', fontSize: '1.5rem' }}>
            ✨ Create New Invoice
          </h2>
          <p style={{ color: '#666', marginBottom: '30px', fontSize: '1.1rem' }}>
            Next Invoice Number: <strong style={{ color: '#667eea' }}>INV-{String(nextInvoiceNumber).padStart(4, '0')}</strong>
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
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                Due Date
              </label>
              <input
                style={inputStyle}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                Status
              </label>
              <select
                style={selectStyle}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Selected Products Display */}
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
            onClick={addInvoice}
            style={buttonStyle}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            📊 Create Invoice
          </button>
        </div>

        {/* Search and Filter */}
        <div style={cardStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                🔍 Search Invoices
              </label>
              <input
                style={inputStyle}
                placeholder="Search invoices by client name or invoice number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}