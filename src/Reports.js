import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Navigation from './Navigation.js';
import { useDarkMode } from './DarkModeContext.js';

function Reports() {
  const { isDarkMode } = useDarkMode();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const user = auth.currentUser;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch invoices
      const invoicesQuery = query(collection(db, 'invoices'), where('userId', '==', user.uid));
      const invoicesSnapshot = await getDocs(invoicesQuery);
      const invoicesData = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvoices(invoicesData);

      // Fetch clients
      const clientsQuery = query(collection(db, 'clients'), where('userId', '==', user.uid));
      const clientsSnapshot = await getDocs(clientsQuery);
      const clientsData = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientsData);

      // Fetch products
      const productsQuery = query(collection(db, 'products'), where('userId', '==', user.uid));
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const containerStyle = {
    background: isDarkMode ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minHeight: '100vh',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  };

  const contentStyle = {
    padding: '30px',
    maxWidth: '1400px',
    margin: '0 auto'
  };

  const cardStyle = {
    background: isDarkMode ? 'rgba(45,55,72,0.95)' : 'rgba(255,255,255,0.95)',
    padding: '30px',
    borderRadius: '16px',
    marginBottom: '30px',
    backdropFilter: 'blur(15px)',
    boxShadow: isDarkMode ? '0 20px 40px rgba(0,0,0,0.3)' : '0 20px 40px rgba(0,0,0,0.1)',
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
    height: '44px',
    lineHeight: '20px',
    verticalAlign: 'top'
  };

  const selectStyle = {
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
    height: '44px',
    lineHeight: '20px',
    verticalAlign: 'top',
    appearance: 'none'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <Navigation user={user} />
        <div style={contentStyle}>
          <div style={cardStyle}>
            <h2>Loading reports...</h2>
          </div>
        </div>
      </div>
    );
  }

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const paidAmount = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const unpaidAmount = invoices.filter(inv => inv.status === 'Unpaid').reduce((sum, inv) => sum + (inv.amount || 0), 0);

  return (
    <div style={containerStyle}>
      <Navigation user={user} />
      <div style={contentStyle}>
        <div style={cardStyle}>
          <h1 style={{ marginTop: 0, color: isDarkMode ? '#ffffff' : '#333', fontSize: '2.5rem', marginBottom: '30px' }}>
            📈 Business Reports
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: isDarkMode ? '#a0aec0' : '#555' }}>
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                style={selectStyle}
              >
                <option value="all">All Time</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="thisYear">This Year</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: isDarkMode ? '#a0aec0' : '#555' }}>
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={selectStyle}
              >
                <option value="all">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <h3 style={{ color: '#667eea', marginBottom: '10px' }}>Total Revenue</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                £{totalRevenue.toFixed(2)}
              </p>
            </div>

            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <h3 style={{ color: '#28a745', marginBottom: '10px' }}>Paid Amount</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                £{paidAmount.toFixed(2)}
              </p>
            </div>

            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <h3 style={{ color: '#dc3545', marginBottom: '10px' }}>Outstanding</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                £{unpaidAmount.toFixed(2)}
              </p>
            </div>

            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <h3 style={{ color: '#6f42c1', marginBottom: '10px' }}>Total Invoices</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                {invoices.length}
              </p>
            </div>
          </div>

          <div style={{ ...cardStyle, marginTop: '30px' }}>
            <h3 style={{ marginBottom: '20px' }}>Recent Invoices</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e1e5e9' }}>Invoice #</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e1e5e9' }}>Client</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e1e5e9' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e1e5e9' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.slice(0, 10).map((invoice, index) => (
                    <tr key={invoice.id} style={{ backgroundColor: index % 2 === 0 ? (isDarkMode ? '#2d3748' : '#f8f9fa') : 'transparent' }}>
                      <td style={{ padding: '12px' }}>{invoice.invoiceNumber}</td>
                      <td style={{ padding: '12px' }}>{invoice.clientName}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>£{Number(invoice.amount).toFixed(2)}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: invoice.status === 'Paid' ? '#d4edda' : invoice.status === 'Overdue' ? '#f8d7da' : '#fff3cd',
                          color: invoice.status === 'Paid' ? '#155724' : invoice.status === 'Overdue' ? '#721c24' : '#856404'
                        }}>
                          {invoice.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;