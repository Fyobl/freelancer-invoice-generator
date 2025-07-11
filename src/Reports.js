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
    
    const overdueInvoices = invoices.filter(invoice => {
      const dueDate = new Date(invoice.dueDate);
      const today = new Date();
      return dueDate < today && invoice.status !== 'Paid';
    });

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

  const containerStyle = {
    minHeight: '100vh',
    background: isDarkMode 
      ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' 
      : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
    fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    paddingLeft: '20px',
    paddingRight: '20px',
    paddingTop: '80px',
    paddingBottom: '40px',
    color: isDarkMode ? '#f8fafc' : '#1e293b'
  };

  const contentStyle = {
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '40px',
    color: isDarkMode ? '#f1f5f9' : '#1e293b'
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  };

  const statCardStyle = {
    background: isDarkMode 
      ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' 
      : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: isDarkMode 
      ? '0 20px 40px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.3)' 
      : '0 20px 40px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.05)',
    border: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0',
    color: isDarkMode ? '#f1f5f9' : '#1e293b'
  };

  const chartsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '30px'
  };

  const chartContainerStyle = {
    background: isDarkMode 
      ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' 
      : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: isDarkMode 
      ? '0 20px 40px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.3)' 
      : '0 20px 40px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.05)',
    border: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0',
    color: isDarkMode ? '#f1f5f9' : '#1e293b'
  };

  const listItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 0',
    borderBottom: isDarkMode ? '1px solid #475569' : '1px solid #cbd5e1'
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
          </div>

          <div style={statCardStyle}>
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
          </div>
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