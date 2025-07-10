
import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Navigation from './Navigation.js';
import { useDarkMode } from './DarkModeContext.js';

function Reports() {
  const { isDarkMode } = useDarkMode();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const q = query(collection(db, 'invoices'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalRevenue = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
    const unpaidInvoices = invoices.filter(inv => inv.status === 'Unpaid');
    const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue');

    const paidAmount = paidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalInvoices,
      paidCount: paidInvoices.length,
      unpaidCount: unpaidInvoices.length,
      overdueCount: overdueInvoices.length,
      paidAmount: paidAmount.toFixed(2),
      unpaidAmount: unpaidAmount.toFixed(2),
      overdueAmount: overdueAmount.toFixed(2)
    };
  };

  const getTopClients = () => {
    const clientTotals = {};
    invoices.forEach(invoice => {
      const clientName = invoice.clientName;
      if (!clientTotals[clientName]) {
        clientTotals[clientName] = 0;
      }
      clientTotals[clientName] += parseFloat(invoice.amount) || 0;
    });

    return Object.entries(clientTotals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  };

  const stats = calculateStats();
  const topClients = getTopClients();

  // Styles
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
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const headerStyle = {
    color: 'white',
    textAlign: 'center',
    marginBottom: '40px'
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  };

  const statCardStyle = {
    background: isDarkMode ? 'rgba(26,32,46,0.95)' : 'rgba(255,255,255,0.95)',
    padding: '30px',
    borderRadius: '16px',
    backdropFilter: 'blur(15px)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.2)',
    color: isDarkMode ? '#ffffff' : '#333333'
  };

  const chartsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '30px'
  };

  const chartContainerStyle = {
    background: isDarkMode ? 'rgba(26,32,46,0.95)' : 'rgba(255,255,255,0.95)',
    padding: '30px',
    borderRadius: '16px',
    backdropFilter: 'blur(15px)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.2)',
    color: isDarkMode ? '#ffffff' : '#333333'
  };

  const listItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 0',
    borderBottom: isDarkMode ? '1px solid #4a5568' : '1px solid #e2e8f0'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <Navigation user={user} />
        <div style={contentStyle}>
          <div style={headerStyle}>
            <h1 style={{ fontSize: '2.5rem', margin: 0 }}>📊 Loading Reports...</h1>
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
            📊 Business Reports
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
            Track your business performance and growth
          </p>
        </div>

        {/* Statistics Cards */}
        <div style={statsGridStyle}>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#667eea', fontSize: '1.2rem' }}>
              💰 Total Revenue
            </h3>
            <p style={{ fontSize: '2.2rem', fontWeight: 'bold', margin: 0 }}>
              £{stats.totalRevenue}
            </p>
          </div>

          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#28a745', fontSize: '1.2rem' }}>
              📄 Total Invoices
            </h3>
            <p style={{ fontSize: '2.2rem', fontWeight: 'bold', margin: 0 }}>
              {stats.totalInvoices}
            </p>
          </div<div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#ffc107', fontSize: '1.2rem' }}>
              ✅ Paid Invoices
            </h3>
            <p style={{ fontSize: '2.2rem', fontWeight: 'bold', margin: 0 }}>
              {stats.paidCount}
            </p>
          </div>

          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#dc3545', fontSize: '1.2rem' }}>
              ⏰ Pending Invoices
            </h3>
            <p style={{ fontSize: '2.2rem', fontWeight: 'bold', margin: 0 }}>
              {stats.unpaidCount + stats.overdueCount}
            </p>
          </div>v>
        </div>

        {/* Charts */}
        <div style={chartsGridStyle}>
          {/* Top Clients */}
          <div style={chartContainerStyle}>
            <h2 style={{ marginTop: 0, color: isDarkMode ? '#ffffff' : '#333', fontSize: '1.8rem' }}>
              👥 Top Clients
            </h2>
            {topClients.length === 0 ? (
              <p style={{ color: isDarkMode ? '#9ca3af' : '#666', fontSize: '1.1rem' }}>
                No client data available yet. Create some invoices to see your top clients.
              </p>
            ) : (
              <div>
                {topClients.map((client, index) => (
                  <div key={index} style={listItemStyle}>
                    <span style={{ fontWeight: '500' }}>{client.name}</span>
                    <span style={{ fontWeight: 'bold', color: '#667eea' }}>
                      £{client.total.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly Overview */}
          <div style={chartContainerStyle}>
            <h2 style={{ marginTop: 0, color: isDarkMode ? '#ffffff' : '#333', fontSize: '1.8rem' }}>
              📈 Invoice Status Overview
            </h2>
            <div style={{ padding: '20px 0' }}>
              <div style={listItemStyle}>
                <span style={{ fontWeight: '500' }}>✅ Paid</span>
                <span style={{ fontWeight: 'bold', color: '#28a745' }}>
                  {stats.paidCount} (£{stats.paidAmount})
                </span>
              </div>
              <div style={listItemStyle}>
                <span style={{ fontWeight: '500' }}>⏳ Unpaid</span>
                <span style={{ fontWeight: 'bold', color: '#ffc107' }}>
                  {stats.unpaidCount} (£{stats.unpaidAmount})
                </span>
              </div>
              <div style={listItemStyle}>
                <span style={{ fontWeight: '500' }}>🚨 Overdue</span>
                <span style={{ fontWeight: 'bold', color: '#dc3545' }}>
                  {stats.overdueCount} (£{stats.overdueAmount})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
