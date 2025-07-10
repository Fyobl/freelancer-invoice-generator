import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Navigation from './Navigation.js';
import { useDarkMode } from './DarkModeContext.js';

function Reports() {
  const { isDarkMode } = useDarkMode();
  const [invoices, setInvoices] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const q = query(collection(db, 'invoices'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const invoiceData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setInvoices(invoiceData);

      // Calculate totals
      const total = invoiceData.reduce((sum, invoice) => sum + (parseFloat(invoice.amount) || 0), 0);
      const pending = invoiceData
        .filter(invoice => invoice.status === 'Unpaid' || invoice.status === 'Overdue')
        .reduce((sum, invoice) => sum + (parseFloat(invoice.amount) || 0), 0);
      const paid = invoiceData
        .filter(invoice => invoice.status === 'Paid')
        .reduce((sum, invoice) => sum + (parseFloat(invoice.amount) || 0), 0);

      setTotalRevenue(total);
      setPendingAmount(pending);
      setPaidAmount(paid);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
    setLoading(false);
  };

  const containerStyle = {
    minHeight: '100vh',
    background: isDarkMode ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: isDarkMode ? 'white' : 'black'
  };

  const contentStyle = {
    padding: '30px',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const headerStyle = {
    color: isDarkMode ? '#f0f0f0' : 'white',
    textAlign: 'center',
    marginBottom: '40px'
  };

  const statsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '25px',
    marginBottom: '40px'
  };

  const statCardStyle = {
    background: isDarkMode ? 'rgba(40,40,40,0.95)' : 'rgba(255,255,255,0.95)',
    padding: '25px',
    borderRadius: '16px',
    textAlign: 'center',
    backdropFilter: 'blur(15px)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    border: '2px solid #f8f9fa',
    color: isDarkMode ? 'white' : 'black'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    background: isDarkMode ? 'rgba(40,40,40,0.95)' : 'rgba(255,255,255,0.95)',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
  };

  const thStyle = {
    background: isDarkMode ? '#2d3748' : '#f8f9fa',
    padding: '15px',
    textAlign: 'left',
    fontWeight: 'bold',
    color: isDarkMode ? '#e2e8f0' : '#333',
    borderBottom: '2px solid #e9ecef'
  };

  const tdStyle = {
    padding: '15px',
    borderBottom: '1px solid #e9ecef',
    color: isDarkMode ? '#e2e8f0' : '#333'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <Navigation user={user} />
        <div style={contentStyle}>
          <div style={{ textAlign: 'center', color: 'white', fontSize: '18px' }}>
            Loading reports...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <Navigation user={user} />
      <div style={contentStyle}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '300' }}>
            📈 Reports & Analytics
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
            Track your business performance and revenue
          </p>
        </div>

        {/* Stats Cards */}
        <div style={statsStyle}>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>💰 Total Revenue</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
              £{totalRevenue.toFixed(2)}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#28a745' }}>✅ Paid Amount</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
              £{paidAmount.toFixed(2)}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#dc3545' }}>⏳ Pending Amount</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
              £{pendingAmount.toFixed(2)}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#6f42c1' }}>📄 Total Invoices</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
              {invoices.length}
            </p>
          </div>
        </div>

        {/* Invoice Table */}
        <div style={{
          background: isDarkMode ? 'rgba(40,40,40,0.95)' : 'rgba(255,255,255,0.95)',
          padding: '30px',
          borderRadius: '16px',
          backdropFilter: 'blur(15px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: isDarkMode ? '#e2e8f0' : '#333' }}>
            📋 Recent Invoices
          </h2>
          {invoices.length > 0 ? (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Invoice #</th>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td style={tdStyle}>#{invoice.invoiceNumber}</td>
                    <td style={tdStyle}>{invoice.clientName}</td>
                    <td style={tdStyle}>£{parseFloat(invoice.amount || 0).toFixed(2)}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: invoice.status === 'Paid' ? '#d4edda' : 
                                       invoice.status === 'Overdue' ? '#f8d7da' : '#fff3cd',
                        color: invoice.status === 'Paid' ? '#155724' : 
                               invoice.status === 'Overdue' ? '#721c24' : '#856404'
                      }}>
                        {invoice.status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {invoice.createdAt ? new Date(invoice.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: isDarkMode ? '#a0aec0' : '#666' }}>
              <p style={{ fontSize: '18px', margin: 0 }}>📊 No invoices found</p>
              <p style={{ margin: '10px 0 0 0' }}>Create your first invoice to see reports here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;