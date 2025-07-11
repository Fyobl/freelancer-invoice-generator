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
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import Navigation from './Navigation.js';
import { useDarkMode } from './DarkModeContext.js';

function Dashboard({ user }) {
  const { isDarkMode } = useDarkMode();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [newInvoice, setNewInvoice] = useState({
    clientId: '',
    items: [{ productId: '', quantity: 1 }],
    dueDate: '',
    status: 'Draft'
  });

  const fetchInvoices = async () => {
    try {
      const q = query(
        collection(db, 'invoices'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const invoiceList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInvoices(invoiceList);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const q = query(collection(db, 'clients'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const clientList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientList);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const q = query(collection(db, 'products'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const productList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productList);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchClients();
    fetchProducts();
  }, [user]);

  const addInvoice = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'invoices'), {
        ...newInvoice,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      setNewInvoice({
        clientId: '',
        items: [{ productId: '', quantity: 1 }],
        dueDate: '',
        status: 'Draft'
      });
      fetchInvoices();
    } catch (error) {
      console.error('Error adding invoice:', error);
    }
  };

  const deleteInvoice = async (id) => {
    try {
      await deleteDoc(doc(db, 'invoices', id));
      fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const updateInvoiceStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, 'invoices', id), { status });
      fetchInvoices();
    } catch (error) {
      console.error('Error updating invoice:', error);
    }
  };

  const calculateInvoiceTotal = (items) => {
    return items.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const subtotal = product.price * item.quantity;
        const vatAmount = subtotal * (product.vat / 100);
        return total + subtotal + vatAmount;
      }
      return total;
    }, 0);
  };

  const totalRevenue = invoices
    .filter(invoice => invoice.status === 'Paid')
    .reduce((sum, invoice) => sum + calculateInvoiceTotal(invoice.items || []), 0);

  const pendingAmount = invoices
    .filter(invoice => invoice.status !== 'Paid')
    .reduce((sum, invoice) => sum + calculateInvoiceTotal(invoice.items || []), 0);

  // Styles
  const containerStyle = {
    minHeight: '100vh',
    background: isDarkMode 
      ? 'linear-gradient(135deg, #0f1419 0%, #1a202c 100%)' 
      : 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    paddingLeft: '20px',
    paddingRight: '20px',
    paddingTop: '100px',
    paddingBottom: '60px',
    color: isDarkMode ? '#e2e8f0' : '#2d3748'
  };

  const contentStyle = {
    maxWidth: '1400px',
    margin: '0 auto'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '50px',
    color: isDarkMode ? '#ffffff' : '#1a202c'
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '30px',
    marginBottom: '50px'
  };

  const statCardStyle = {
    background: isDarkMode 
      ? 'linear-gradient(145deg, #1a202c 0%, #2d3748 100%)' 
      : 'linear-gradient(145deg, #ffffff 0%, #f7fafc 100%)',
    padding: '40px 30px',
    borderRadius: '20px',
    textAlign: 'center',
    boxShadow: isDarkMode 
      ? '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)' 
      : '0 20px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
    border: isDarkMode ? '1px solid #4a5568' : '1px solid rgba(226, 232, 240, 0.5)',
    color: isDarkMode ? '#e2e8f0' : '#2d3748',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer'
  };

  const formContainerStyle = {
    background: isDarkMode 
      ? 'linear-gradient(145deg, #1a202c 0%, #2d3748 100%)' 
      : 'linear-gradient(145deg, #ffffff 0%, #f7fafc 100%)',
    padding: '50px',
    borderRadius: '24px',
    marginBottom: '50px',
    boxShadow: isDarkMode 
      ? '0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)' 
      : '0 25px 50px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)',
    border: isDarkMode ? '1px solid #4a5568' : '1px solid rgba(226, 232, 240, 0.5)',
    color: isDarkMode ? '#e2e8f0' : '#2d3748'
  };

  const inputStyle = {
    width: '100%',
    padding: '16px 20px',
    border: isDarkMode ? '2px solid #4a5568' : '2px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '16px',
    marginBottom: '20px',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
    backgroundColor: isDarkMode ? '#2d3748' : '#ffffff',
    color: isDarkMode ? '#e2e8f0' : '#2d3748',
    boxSizing: 'border-box',
    outline: 'none'
  };

  const selectStyle = {
    ...inputStyle,
    appearance: 'none',
    backgroundImage: isDarkMode 
      ? 'url("data:image/svg+xml;charset=UTF-8,<svg xmlns=\'http://www.w3.org/2000/svg\' fill=\'%23e2e8f0\' viewBox=\'0 0 20 20\'><path d=\'M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z\'/></svg>")' 
      : 'url("data:image/svg+xml;charset=UTF-8,<svg xmlns=\'http://www.w3.org/2000/svg\' fill=\'%232d3748\' viewBox=\'0 0 20 20\'><path d=\'M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z\'/></svg>")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 16px center',
    backgroundSize: '20px'
  };

  const buttonStyle = {
    background: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '16px 32px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginRight: '15px',
    boxShadow: '0 10px 20px rgba(66, 153, 225, 0.3)'
  };

  const invoiceGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '30px'
  };

  const invoiceCardStyle = {
    background: isDarkMode 
      ? 'linear-gradient(145deg, #1a202c 0%, #2d3748 100%)' 
      : 'linear-gradient(145deg, #ffffff 0%, #f7fafc 100%)',
    border: isDarkMode ? '1px solid #4a5568' : '1px solid rgba(226, 232, 240, 0.5)',
    borderRadius: '20px',
    padding: '30px',
    transition: 'all 0.3s ease',
    boxShadow: isDarkMode 
      ? '0 15px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' 
      : '0 15px 30px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
    color: isDarkMode ? '#e2e8f0' : '#2d3748'
  };

  return (
    <div style={containerStyle}>
      <Navigation user={user} />
      <div style={contentStyle}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '3.5rem', margin: '0 0 15px 0', fontWeight: '800', letterSpacing: '-0.05em' }}>
            Dashboard
          </h1>
          <p style={{ fontSize: '1.25rem', opacity: '0.8', margin: 0, fontWeight: '400' }}>
            Welcome back, {user?.email}. Here's what's happening with your business.
          </p>
        </div>

        <div style={statsGridStyle}>
          <div style={{...statCardStyle, borderLeft: '5px solid #4299e1'}}>
            <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>📊</div>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 10px 0', opacity: '0.8' }}>Total Invoices</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, color: '#4299e1' }}>{invoices.length}</p>
          </div>

          <div style={{...statCardStyle, borderLeft: '5px solid #48bb78'}}>
            <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>💰</div>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 10px 0', opacity: '0.8' }}>Total Revenue</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, color: '#48bb78' }}>
              £{totalRevenue.toFixed(2)}
            </p>
          </div>

          <div style={{...statCardStyle, borderLeft: '5px solid #ed8936'}}>
            <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>⏳</div>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 10px 0', opacity: '0.8' }}>Pending Amount</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, color: '#ed8936' }}>
              £{pendingAmount.toFixed(2)}
            </p>
          </div>

          <div style={{...statCardStyle, borderLeft: '5px solid #9f7aea'}}>
            <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>👥</div>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 10px 0', opacity: '0.8' }}>Active Clients</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, color: '#9f7aea' }}>{clients.length}</p>
          </div>
        </div>

        <div style={formContainerStyle}>
          <h2 style={{ fontSize: '2rem', marginBottom: '30px', fontWeight: '700' }}>Create New Invoice</h2>
          <form onSubmit={addInvoice}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Client</label>
                <select
                  value={newInvoice.clientId}
                  onChange={(e) => setNewInvoice({ ...newInvoice, clientId: e.target.value })}
                  style={selectStyle}
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Due Date</label>
                <input
                  type="date"
                  value={newInvoice.dueDate}
                  onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>
            </div>

            <button type="submit" style={buttonStyle}>
              Create Invoice
            </button>
          </form>
        </div>

        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '30px', fontWeight: '700' }}>Recent Invoices</h2>
          <div style={invoiceGridStyle}>
            {invoices.map(invoice => {
              const client = clients.find(c => c.id === invoice.clientId);
              const total = calculateInvoiceTotal(invoice.items || []);

              return (
                <div key={invoice.id} style={invoiceCardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                      {client ? client.name : 'Unknown Client'}
                    </h3>
                    <span style={{
                      padding: '6px 16px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: invoice.status === 'Paid' ? '#48bb78' : 
                                     invoice.status === 'Sent' ? '#4299e1' : '#ed8936',
                      color: '#ffffff'
                    }}>
                      {invoice.status}
                    </span>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: '0.8' }}>Due Date</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>{invoice.dueDate}</p>
                  </div>

                  <div style={{ marginBottom: '25px' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: '0.8' }}>Total Amount</p>
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#4299e1' }}>
                      £{total.toFixed(2)}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {invoice.status !== 'Paid' && (
                      <button
                        onClick={() => updateInvoiceStatus(invoice.id, 'Paid')}
                        style={{
                          ...buttonStyle,
                          background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                          padding: '10px 20px',
                          fontSize: '14px'
                        }}
                      >
                        Mark Paid
                      </button>
                    )}
                    <button
                      onClick={() => deleteInvoice(invoice.id)}
                      style={{
                        ...buttonStyle,
                        background: 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)',
                        padding: '10px 20px',
                        fontSize: '14px'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;