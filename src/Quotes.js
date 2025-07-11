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

function Quotes({ user }) {
  const [quotes, setQuotes] = useState([]);
  const [userData, setUserData] = useState(null);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [companySettings, setCompanySettings] = useState({});
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
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
    if (productId) {
      const product = products.find(p => p.id === productId);
      if (product) {
        setAmount(product.price.toString());
        setVat(product.vat.toString());
      }
    } else {
      setAmount('');
      setVat('');
    }
  };

  const addQuote = async () => {
    if (!clientName.trim() || !amount.trim()) {
      alert('Please fill in client name and amount');
      return;
    }

    const parsedAmount = parseFloat(amount);
    const parsedVat = parseFloat(vat) || 0;

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Amount must be a valid positive number');
      return;
    }

    const quoteNumber = `QUO-${String(nextQuoteNumber).padStart(4, '0')}`;
    const validUntilDate = validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      await addDoc(collection(db, 'quotes'), {
        quoteNumber,
        clientName: clientName.trim(),
        clientId: selectedClientId || null,
        amount: parsedAmount,
        vat: parsedVat,
        validUntil: validUntilDate,
        notes: notes.trim(),
        status: 'Pending',
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      // Reset form
      setClientName('');
      setSelectedClientId('');
      setSelectedProductId('');
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

  const deleteQuote = async (id) => {
    if (window.confirm('Are you sure you want to delete this quote?')) {
      try {
        await deleteDoc(doc(db, 'quotes', id));
        fetchQuotes();
      } catch (error) {
        console.error('Error deleting quote:', error);
      }
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || quote.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
    ...inputStyle,
    appearance: 'none'
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                Select Client
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                style={selectStyle}
              >
                <option value="">Select existing client or enter new</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.email})
                  </option>
                ))}
              </select>

              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                Client Name *
              </label>
              <input
                style={inputStyle}
                placeholder="Enter client name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />

              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                Select Product/Service
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductSelect(e.target.value)}
                style={selectStyle}
              >
                <option value="">Select product or enter manually</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - £{product.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                Amount (£) *
              </label>
              <input
                style={inputStyle}
                placeholder="0.00"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                VAT (%)
              </label>
              <input
                style={inputStyle}
                placeholder="20"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={vat}
                onChange={(e) => setVat(e.target.value)}
              />

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
                      onClick={() => deleteQuote(quote.id)}
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


      </div>
    </div>
  );
}

export default Quotes;