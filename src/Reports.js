
import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Navigation from './Navigation.js';
import { useDarkMode } from './DarkModeContext.js';

function Reports() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { isDarkMode } = useDarkMode();

  const user = auth.currentUser;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch invoices
      const invoicesQuery = query(collection(db, 'invoices'), where('userId', '==', user.uid));
      const invoicesSnapshot = await getDocs(invoicesQuery);
      const invoicesData = invoicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch clients
      const clientsQuery = query(collection(db, 'clients'), where('userId', '==', user.uid));
      const clientsSnapshot = await getDocs(clientsQuery);
      const clientsData = clientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch products
      const productsQuery = query(collection(db, 'products'), where('userId', '==', user.uid));
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setInvoices(invoicesData);
      setClients(clientsData);
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

  // Calculate statistics
  const totalRevenue = invoices.reduce((sum, invoice) => {
    return sum + (parseFloat(invoice.amount) || 0);
  }, 0);

  const paidInvoices = invoices.filter(invoice => invoice.status === 'Paid');
  const unpaidInvoices = invoices.filter(invoice => invoice.status === 'Unpaid');
  const overdueInvoices = invoices.filter(invoice => 
    invoice.status === 'Unpaid' && new Date(invoice.dueDate) < new Date()
  );

  return (
    <div style={containerStyle}>
      <Navigation user={user} />
      <div style={contentStyle}>
        <div style={{ textAlign: 'center', marginBottom: '40px', color: isDarkMode ? '#ffffff' : 'white', padding: '20px 0' }}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '300' }}>
            📈 Reports & Analytics
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
            Track your business performance and insights
          </p>
        </div>

        {/* Filter Section */}
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.3rem' }}>🔍 Filters</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date Range</label>
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
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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

        {/* Statistics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={cardStyle}>
            <h4 style={{ margin: '0 0 10px 0', color: '#667eea' }}>💰 Total Revenue</h4>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
              £{totalRevenue.toFixed(2)}
            </p>
          </div>
          <div style={cardStyle}>
            <h4 style={{ margin: '0 0 10px 0', color: '#28a745' }}>✅ Paid Invoices</h4>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
              {paidInvoices.length}
            </p>
          </div>
          <div style={cardStyle}>
            <h4 style={{ margin: '0 0 10px 0', color: '#ffc107' }}>⏳ Unpaid Invoices</h4>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
              {unpaidInvoices.length}
            </p>
          </div>
          <div style={cardStyle}>
            <h4 style={{ margin: '0 0 10px 0', color: '#dc3545' }}>🚨 Overdue Invoices</h4>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
              {overdueInvoices.length}
            </p>
          </div>
        </div>

        {/* Recent Invoices */}
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.3rem' }}>📋 Recent Invoices</h3>
          {loading ? (
            <p>Loading invoices...</p>
          ) : invoices.length === 0 ? (
            <p>No invoices found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: isDarkMode ? '2px solid #4a5568' : '2px solid #e1e5e9' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Invoice #</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Client</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Amount</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.slice(0, 10).map((invoice, index) => (
                    <tr key={invoice.id} style={{ borderBottom: isDarkMode ? '1px solid #4a5568' : '1px solid #f1f1f1' }}>
                      <td style={{ padding: '10px' }}>#{invoice.invoiceNumber || index + 1}</td>
                      <td style={{ padding: '10px' }}>{invoice.clientName}</td>
                      <td style={{ padding: '10px' }}>£{parseFloat(invoice.amount || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: invoice.status === 'Paid' ? '#28a745' : 
                                         invoice.status === 'Unpaid' ? '#ffc107' : '#dc3545',
                          color: 'white'
                        }}>
                          {invoice.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>{invoice.dueDate || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.3rem' }}>📊 Business Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <h4 style={{ margin: '0 0 10px 0' }}>Total Clients</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{clients.length}</p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 10px 0' }}>Total Products</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{products.length}</p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 10px 0' }}>Total Invoices</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{invoices.length}</p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 10px 0' }}>Average Invoice Value</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                £{invoices.length > 0 ? (totalRevenue / invoices.length).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
