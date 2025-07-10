
import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase.js';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import Navigation from './Navigation.js';
import { useDarkMode } from './DarkModeContext.js';

function Dashboard() {
  const { isDarkMode } = useDarkMode();
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
  const [template, setTemplate] = useState('standard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(1);
  const [companySettings, setCompanySettings] = useState({});

  const user = auth.currentUser;

  // Styling objects
  const containerStyle = {
    minHeight: '100vh',
    background: isDarkMode 
      ? 'linear-gradient(135deg, #1a202c 0%, #2d3748 50%, #1a202c 100%)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    paddingLeft: '20px',
    paddingRight: '20px',
    paddingTop: '80px',
    paddingBottom: '40px'
  };

  const contentStyle = {
    maxWidth: '1400px',
    margin: '0 auto'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '40px',
    color: 'white',
    padding: '20px 0'
  };

  const statsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  };

  const statCardStyle = {
    background: isDarkMode ? 'rgba(26,32,46,0.95)' : 'rgba(255,255,255,0.95)',
    padding: '25px',
    borderRadius: '16px',
    textAlign: 'center',
    backdropFilter: 'blur(15px)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.2)',
    color: isDarkMode ? '#ffffff' : '#333333'
  };

  const formStyle = {
    background: isDarkMode ? 'rgba(26,32,46,0.95)' : 'rgba(255,255,255,0.95)',
    padding: '40px',
    borderRadius: '20px',
    marginBottom: '40px',
    backdropFilter: 'blur(15px)',
    boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
    border: '2px solid rgba(255,255,255,0.2)',
    color: isDarkMode ? '#ffffff' : '#333333'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 15px',
    border: isDarkMode ? '2px solid #4a5568' : '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '15px',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    fontFamily: 'inherit',
    backgroundColor: isDarkMode ? '#2d3748' : '#fff',
    color: isDarkMode ? '#ffffff' : '#333333',
    boxSizing: 'border-box',
    outline: 'none',
    height: '44px'
  };

  const textareaStyle = {
    ...inputStyle,
    minHeight: '80px',
    resize: 'vertical',
    lineHeight: '1.5'
  };

  const selectStyle = {
    ...inputStyle,
    appearance: 'none'
  };

  const buttonStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '15px 30px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginRight: '15px',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
  };

  const invoiceCardStyle = {
    background: isDarkMode ? 'rgba(26,32,46,0.95)' : 'white',
    border: isDarkMode ? '2px solid #4a5568' : '2px solid #f8f9fa',
    borderRadius: '16px',
    padding: '25px',
    marginBottom: '20px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    color: isDarkMode ? '#ffffff' : '#333333'
  };

  const searchFilterStyle = {
    background: isDarkMode ? 'rgba(26,32,46,0.95)' : 'rgba(255,255,255,0.95)',
    padding: '25px',
    borderRadius: '16px',
    marginBottom: '30px',
    backdropFilter: 'blur(15px)',
    border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.2)',
    color: isDarkMode ? '#ffffff' : '#333333'
  };

  useEffect(() => {
    if (user) {
      fetchInvoices();
      fetchProducts();
      fetchClients();
      fetchCompanySettings();
    }
  }, [user]);

  const fetchInvoices = async () => {
    try {
      const q = query(
        collection(db, 'invoices'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInvoices(data);

      const invoiceNumbers = data.map(inv => parseInt(inv.invoiceNumber) || 0);
      const maxNumber = Math.max(...invoiceNumbers, 0);
      setNextInvoiceNumber(maxNumber + 1);
    } catch (error) {
      console.error('Error fetching invoices:', error);
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

  const fetchCompanySettings = async () => {
    try {
      const q = query(collection(db, 'companySettings'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setCompanySettings(data);
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
    }
  };

  const handleProductSelect = (productId) => {
    setSelectedProductId(productId);
    if (productId) {
      const product = products.find(p => p.id === productId);
      if (product) {
        setAmount(product.price);
      }
    }
  };

  const handleClientSelect = (clientId) => {
    setSelectedClientId(clientId);
    if (clientId) {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        setClientName(client.name);
      }
    }
  };

  const addInvoice = async () => {
    if (!clientName.trim() || !amount.trim()) return;

    try {
      const invoiceData = {
        invoiceNumber: nextInvoiceNumber.toString(),
        clientName: clientName.trim(),
        clientId: selectedClientId || null,
        amount: parseFloat(amount) || 0,
        vat: parseFloat(vat) || 0,
        dueDate: dueDate || null,
        status: status,
        notes: notes.trim(),
        template: template,
        userId: user.uid,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'invoices'), invoiceData);
      resetForm();
      fetchInvoices();
    } catch (error) {
      console.error('Error adding invoice:', error);
    }
  };

  const updateInvoice = async (id, updates) => {
    try {
      await updateDoc(doc(db, 'invoices', id), updates);
      fetchInvoices();
    } catch (error) {
      console.error('Error updating invoice:', error);
    }
  };

  const deleteInvoice = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteDoc(doc(db, 'invoices', id));
        fetchInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  const resetForm = () => {
    setClientName('');
    setSelectedClientId('');
    setAmount('');
    setVat('');
    setDueDate('');
    setStatus('Unpaid');
    setNotes('');
    setSelectedProductId('');
    setTemplate('standard');
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const calculateStats = () => {
    const total = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const paid = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const unpaid = invoices.filter(inv => inv.status === 'Unpaid').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const overdue = invoices.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

    return { total, paid, unpaid, overdue };
  };

  const stats = calculateStats();

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return '#28a745';
      case 'Unpaid': return '#ffc107';
      case 'Overdue': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div style={containerStyle}>
      <Navigation user={user} />
      <div style={contentStyle}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '3rem', margin: '0 0 10px 0', fontWeight: '300' }}>
            📋 Invoice Dashboard
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: '0.9', margin: 0 }}>
            Create and manage your invoices with ease
          </p>
        </div>

        {/* Statistics */}
        <div style={statsStyle}>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Total Revenue</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
              £{stats.total.toFixed(2)}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#28a745' }}>Paid</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
              £{stats.paid.toFixed(2)}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#ffc107' }}>Unpaid</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
              £{stats.unpaid.toFixed(2)}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#dc3545' }}>Overdue</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
              £{stats.overdue.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Create Invoice Form */}
        <div style={formStyle}>
          <h2 style={{ margin: '0 0 30px 0', fontSize: '2rem', fontWeight: '300' }}>
            ✨ Create New Invoice
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: isDarkMode ? '#e5e7eb' : '#555' }}>
                Client Name *
              </label>
              <input
                placeholder="Enter client name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                style={inputStyle}
              />

              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: isDarkMode ? '#e5e7eb' : '#555' }}>
                Select Product (Optional)
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductSelect(e.target.value)}
                style={selectStyle}
              >
                <option value="">Select a product</option>
                {products.map(prod => (
                  <option key={prod.id} value={prod.id}>
                    {prod.name} - £{Number(prod.price).toFixed(2)}
                  </option>
                ))}
              </select>

              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: isDarkMode ? '#e5e7eb' : '#555' }}>
                Amount (£) *
              </label>
              <input
                placeholder="0.00"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={inputStyle}
              />

              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: isDarkMode ? '#e5e7eb' : '#555' }}>
                VAT (£)
              </label>
              <input
                placeholder="0.00"
                type="number"
                step="0.01"
                value={vat}
                onChange={(e) => setVat(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: isDarkMode ? '#e5e7eb' : '#555' }}>
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={inputStyle}
              />

              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: isDarkMode ? '#e5e7eb' : '#555' }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={selectStyle}
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>

              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: isDarkMode ? '#e5e7eb' : '#555' }}>
                Template Style
              </label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                style={selectStyle}
              >
                <option value="standard">Standard</option>
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
              </select>

              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: isDarkMode ? '#e5e7eb' : '#555' }}>
                Notes
              </label>
              <textarea
                placeholder="Additional notes or terms..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={textareaStyle}
              />
            </div>
          </div>

          <div style={{ marginTop: '30px' }}>
            <button onClick={addInvoice} style={buttonStyle}>
              🚀 Create Invoice
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div style={searchFilterStyle}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.5rem' }}>🔍 Search & Filter</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: isDarkMode ? '#e5e7eb' : '#555' }}>
                Search Invoices
              </label>
              <input
                placeholder="Search by client name or invoice number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: isDarkMode ? '#e5e7eb' : '#555' }}>
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={selectStyle}
              >
                <option value="all">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div style={{ background: isDarkMode ? 'rgba(26,32,46,0.95)' : 'rgba(255,255,255,0.95)', padding: '30px', borderRadius: '20px', backdropFilter: 'blur(15px)', border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.2)' }}>
          <h3 style={{ margin: '0 0 25px 0', fontSize: '1.8rem', fontWeight: '300', color: isDarkMode ? '#ffffff' : '#333' }}>
            📄 Your Invoices ({filteredInvoices.length})
          </h3>

          {filteredInvoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: isDarkMode ? '#9ca3af' : '#666' }}>
              <h3 style={{ fontSize: '1.5rem', margin: '0 0 15px 0', fontWeight: '300' }}>
                📄 No invoices found
              </h3>
              <p style={{ fontSize: '1.2rem', opacity: '0.9', margin: 0 }}>
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Create your first invoice using the form above!'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {filteredInvoices.map(invoice => (
                <div key={invoice.id} style={invoiceCardStyle}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', alignItems: 'start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                        <h4 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '600' }}>
                          Invoice #{invoice.invoiceNumber}
                        </h4>
                        <span style={{
                          background: getStatusColor(invoice.status),
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}>
                          {invoice.status}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        <div>
                          <p style={{ margin: '0 0 8px 0', color: isDarkMode ? '#e5e7eb' : '#666' }}>
                            <strong>Client:</strong> {invoice.clientName}
                          </p>
                          <p style={{ margin: '0 0 8px 0', color: isDarkMode ? '#e5e7eb' : '#666' }}>
                            <strong>Amount:</strong> £{Number(invoice.amount).toFixed(2)}
                          </p>
                          {invoice.vat > 0 && (
                            <p style={{ margin: '0 0 8px 0', color: isDarkMode ? '#e5e7eb' : '#666' }}>
                              <strong>VAT:</strong> £{Number(invoice.vat).toFixed(2)}
                            </p>
                          )}
                        </div>

                        <div>
                          {invoice.dueDate && (
                            <p style={{ margin: '0 0 8px 0', color: isDarkMode ? '#e5e7eb' : '#666' }}>
                              <strong>Due Date:</strong> {invoice.dueDate}
                            </p>
                          )}
                          <p style={{ margin: '0 0 8px 0', color: isDarkMode ? '#e5e7eb' : '#666' }}>
                            <strong>Template:</strong> {invoice.template}
                          </p>
                          {invoice.notes && (
                            <p style={{ margin: '0 0 8px 0', color: isDarkMode ? '#e5e7eb' : '#666' }}>
                              <strong>Notes:</strong> {invoice.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '120px' }}>
                      <select
                        value={invoice.status}
                        onChange={(e) => updateInvoice(invoice.id, { status: e.target.value })}
                        style={{
                          ...selectStyle,
                          marginBottom: '8px',
                          fontSize: '12px',
                          padding: '6px 10px',
                          height: '32px'
                        }}
                      >
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                      <button
                        onClick={() => deleteInvoice(invoice.id)}
                        style={{
                          background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
