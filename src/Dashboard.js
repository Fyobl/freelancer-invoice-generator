
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase.js';
import Navigation from './Navigation.js';
import { generatePDFWithLogo } from './pdfService.js';

function Dashboard() {
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchInvoices(currentUser.uid);
        fetchProducts(currentUser.uid);
        fetchClients(currentUser.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchInvoices = async (userId) => {
    try {
      console.log('Fetching invoices for user:', userId);
      const q = query(collection(db, 'invoices'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const invoiceList = [];
      querySnapshot.forEach((doc) => {
        invoiceList.push({ id: doc.id, ...doc.data() });
      });
      setInvoices(invoiceList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setLoading(false);
    }
  };

  const fetchProducts = async (userId) => {
    try {
      const q = query(collection(db, 'products'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const productList = [];
      querySnapshot.forEach((doc) => {
        productList.push({ id: doc.id, ...doc.data() });
      });
      setProducts(productList);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchClients = async (userId) => {
    try {
      const q = query(collection(db, 'clients'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const clientList = [];
      querySnapshot.forEach((doc) => {
        clientList.push({ id: doc.id, ...doc.data() });
      });
      setClients(clientList);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      await generatePDFWithLogo(invoice, 'invoice');
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
    }
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cardStyle = {
    background: 'rgba(255,255,255,0.95)',
    padding: '25px',
    borderRadius: '15px',
    marginBottom: '25px',
    backdropFilter: 'blur(15px)',
    border: '2px solid rgba(255,255,255,0.2)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 15px',
    border: '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    marginBottom: '15px'
  };

  const buttonStyle = {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
    margin: '5px'
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      paddingTop: '80px'
    }}>
      <Navigation />

      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={cardStyle}>
          <h1 style={{ color: '#333', marginBottom: '30px', textAlign: 'center' }}>
            📊 Dashboard
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={{ 
              ...cardStyle, 
              textAlign: 'center', 
              background: 'linear-gradient(135deg, #4CAF50, #45a049)',
              color: 'white'
            }}>
              <h3>📄 Total Invoices</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{invoices.length}</p>
            </div>

            <div style={{ 
              ...cardStyle, 
              textAlign: 'center', 
              background: 'linear-gradient(135deg, #2196F3, #1976D2)',
              color: 'white'
            }}>
              <h3>👥 Total Clients</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{clients.length}</p>
            </div>

            <div style={{ 
              ...cardStyle, 
              textAlign: 'center', 
              background: 'linear-gradient(135deg, #FF9800, #F57C00)',
              color: 'white'
            }}>
              <h3>📦 Total Products</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{products.length}</p>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={{ color: '#333', marginBottom: '20px' }}>Recent Invoices</h2>

          <input
            style={inputStyle}
            placeholder="🔍 Search invoices by number or client name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Invoice #</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Client</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Total</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px' }}>{invoice.invoiceNumber}</td>
                      <td style={{ padding: '12px' }}>{invoice.clientName}</td>
                      <td style={{ padding: '12px' }}>${invoice.total?.toFixed(2) || '0.00'}</td>
                      <td style={{ padding: '12px' }}>
                        {invoice.createdAt ? new Date(invoice.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button
                          style={{
                            ...buttonStyle,
                            backgroundColor: '#4CAF50',
                            color: 'white'
                          }}
                          onClick={() => handleDownloadPDF(invoice)}
                        >
                          📄 Download PDF
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
