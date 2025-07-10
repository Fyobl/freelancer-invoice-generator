
import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Navigation from './Navigation.js';
import { useDarkMode } from './DarkModeContext.js';

function Reports() {
  const { isDarkMode } = useDarkMode();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [dateRange, setDateRange] = useState('all');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        fetchInvoices(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchInvoices = async (userId) => {
    try {
      const q = query(
        collection(db, 'invoices'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const invoiceData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInvoices(invoiceData);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = invoices;

    if (dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateRange) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          break;
      }
      
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.date);
        return invoiceDate >= filterDate;
      });
    }

    if (status !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === status);
    }

    return filtered;
  };

  const calculateTotals = () => {
    const filtered = filterInvoices();
    const total = filtered.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
    const paid = filtered.filter(inv => inv.status === 'paid').reduce((sum, invoice) => sum + (invoice.total || 0), 0);
    const pending = filtered.filter(inv => inv.status === 'pending').reduce((sum, invoice) => sum + (invoice.total || 0), 0);
    
    return { total, paid, pending, count: filtered.length };
  };

  const containerStyle = {
    minHeight: '100vh',
    background: isDarkMode 
      ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    color: isDarkMode ? '#ffffff' : '#333333'
  };

  const contentStyle = {
    padding: '30px',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '40px',
    padding: '40px 20px',
    background: isDarkMode ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.1)',
    borderRadius: '20px',
    backdropFilter: 'blur(20px)',
    border: isDarkMode ? '1px solid rgba(71,85,105,0.3)' : '1px solid rgba(255,255,255,0.2)'
  };

  const cardStyle = {
    background: isDarkMode ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)',
    borderRadius: '15px',
    padding: '25px',
    marginBottom: '25px',
    backdropFilter: 'blur(10px)',
    border: isDarkMode ? '1px solid rgba(71,85,105,0.3)' : '1px solid rgba(255,255,255,0.2)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: isDarkMode ? '2px solid #4a5568' : '2px solid #e2e8f0',
    background: isDarkMode ? '#2d3748' : '#ffffff',
    color: isDarkMode ? '#ffffff' : '#333333',
    fontSize: '16px',
    boxSizing: 'border-box',
    height: '48px',
    display: 'flex',
    alignItems: 'center'
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div style={containerStyle}>
        <Navigation user={user} />
        <div style={contentStyle}>
          <p style={{ textAlign: 'center', fontSize: '18px' }}>Loading reports...</p>
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
            📈 Business Reports
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
            Track your business performance and analytics
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={{ marginBottom: '20px', color: isDarkMode ? '#ffffff' : '#333333' }}>Filters</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Date Range:</label>
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                style={inputStyle}
              >
                <option value="all">All Time</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Status:</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                style={inputStyle}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{...cardStyle, textAlign: 'center'}}>
            <h3 style={{ color: '#667eea', marginBottom: '10px' }}>Total Revenue</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>£{totals.total.toFixed(2)}</p>
          </div>
          <div style={{...cardStyle, textAlign: 'center'}}>
            <h3 style={{ color: '#51cf66', marginBottom: '10px' }}>Paid</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>£{totals.paid.toFixed(2)}</p>
          </div>
          <div style={{...cardStyle, textAlign: 'center'}}>
            <h3 style={{ color: '#ffd43b', marginBottom: '10px' }}>Pending</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>£{totals.pending.toFixed(2)}</p>
          </div>
          <div style={{...cardStyle, textAlign: 'center'}}>
            <h3 style={{ color: '#ff6b6b', marginBottom: '10px' }}>Total Invoices</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{totals.count}</p>
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={{ marginBottom: '20px', color: isDarkMode ? '#ffffff' : '#333333' }}>Recent Invoices</h2>
          {filterInvoices().length === 0 ? (
            <p style={{ textAlign: 'center', fontSize: '16px', opacity: '0.7' }}>No invoices found for the selected criteria.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: isDarkMode ? '2px solid #4a5568' : '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: isDarkMode ? '#ffffff' : '#333333' }}>Invoice #</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: isDarkMode ? '#ffffff' : '#333333' }}>Client</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: isDarkMode ? '#ffffff' : '#333333' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: isDarkMode ? '#ffffff' : '#333333' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: isDarkMode ? '#ffffff' : '#333333' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filterInvoices().map((invoice, index) => (
                    <tr key={invoice.id} style={{ borderBottom: isDarkMode ? '1px solid #4a5568' : '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', color: isDarkMode ? '#ffffff' : '#333333' }}>#{index + 1}</td>
                      <td style={{ padding: '12px', color: isDarkMode ? '#ffffff' : '#333333' }}>{invoice.clientName || 'N/A'}</td>
                      <td style={{ padding: '12px', color: isDarkMode ? '#ffffff' : '#333333' }}>{invoice.date || 'N/A'}</td>
                      <td style={{ padding: '12px', color: isDarkMode ? '#ffffff' : '#333333' }}>£{(invoice.total || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          background: invoice.status === 'paid' ? '#51cf66' : '#ffd43b',
                          color: invoice.status === 'paid' ? 'white' : '#333'
                        }}>
                          {invoice.status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;
