
import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Navigation from './Navigation.js';

function Reports() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [dateRange, setDateRange] = useState('all');
  const [stats, setStats] = useState({});

  const user = auth.currentUser;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [invoices, dateRange]);

  const fetchData = async () => {
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
  };

  const calculateStats = () => {
    let filteredInvoices = invoices;

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (dateRange) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filteredInvoices = invoices.filter(inv => {
        const invDate = inv.createdAt?.toDate() || new Date(inv.dueDate);
        return invDate >= cutoffDate;
      });
    }

    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const paidRevenue = filteredInvoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const unpaidRevenue = filteredInvoices.filter(inv => inv.status === 'Unpaid').reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const overdueRevenue = filteredInvoices.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + (inv.amount || 0), 0);
    
    const statusCounts = {
      paid: filteredInvoices.filter(inv => inv.status === 'Paid').length,
      unpaid: filteredInvoices.filter(inv => inv.status === 'Unpaid').length,
      overdue: filteredInvoices.filter(inv => inv.status === 'Overdue').length
    };

    // Client analysis
    const clientStats = {};
    filteredInvoices.forEach(inv => {
      if (!clientStats[inv.clientName]) {
        clientStats[inv.clientName] = { count: 0, revenue: 0 };
      }
      clientStats[inv.clientName].count++;
      clientStats[inv.clientName].revenue += inv.amount || 0;
    });

    const topClients = Object.entries(clientStats)
      .sort(([,a], [,b]) => b.revenue - a.revenue)
      .slice(0, 5);

    setStats({
      totalInvoices: filteredInvoices.length,
      totalRevenue,
      paidRevenue,
      unpaidRevenue,
      overdueRevenue,
      statusCounts,
      topClients,
      averageInvoiceValue: filteredInvoices.length > 0 ? totalRevenue / filteredInvoices.length : 0
    });
  };

  const statCardStyle = {
    background: 'white',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  return (
    <div>
      <Navigation user={user} />
      <div style={{ padding: '30px', fontFamily: 'Arial' }}>
        <h2>Reports & Analytics</h2>

        <div style={{ marginBottom: '30px' }}>
          <label>Time Period: </label>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            style={{ padding: '5px 10px', marginLeft: '10px' }}
          >
            <option value="all">All Time</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>

        {/* Revenue Statistics */}
        <h3>Revenue Overview</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={statCardStyle}>
            <h4 style={{ color: '#007bff', margin: '0 0 10px 0' }}>Total Revenue</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>£{stats.totalRevenue?.toFixed(2) || '0.00'}</p>
          </div>
          
          <div style={statCardStyle}>
            <h4 style={{ color: '#28a745', margin: '0 0 10px 0' }}>Paid</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>£{stats.paidRevenue?.toFixed(2) || '0.00'}</p>
          </div>
          
          <div style={statCardStyle}>
            <h4 style={{ color: '#ffc107', margin: '0 0 10px 0' }}>Unpaid</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>£{stats.unpaidRevenue?.toFixed(2) || '0.00'}</p>
          </div>
          
          <div style={statCardStyle}>
            <h4 style={{ color: '#dc3545', margin: '0 0 10px 0' }}>Overdue</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>£{stats.overdueRevenue?.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        {/* Invoice Statistics */}
        <h3>Invoice Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={statCardStyle}>
            <h4 style={{ margin: '0 0 10px 0' }}>Total Invoices</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{stats.totalInvoices || 0}</p>
          </div>
          
          <div style={statCardStyle}>
            <h4 style={{ margin: '0 0 10px 0' }}>Average Value</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>£{stats.averageInvoiceValue?.toFixed(2) || '0.00'}</p>
          </div>
          
          <div style={statCardStyle}>
            <h4 style={{ margin: '0 0 10px 0' }}>Total Clients</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{clients.length}</p>
          </div>
          
          <div style={statCardStyle}>
            <h4 style={{ margin: '0 0 10px 0' }}>Total Products</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{products.length}</p>
          </div>
        </div>

        {/* Status Breakdown */}
        <h3>Invoice Status Breakdown</h3>
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '20px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <p style={{ margin: '0 0 5px 0', color: '#28a745' }}>Paid</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{stats.statusCounts?.paid || 0}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 5px 0', color: '#ffc107' }}>Unpaid</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{stats.statusCounts?.unpaid || 0}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 5px 0', color: '#dc3545' }}>Overdue</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{stats.statusCounts?.overdue || 0}</p>
            </div>
          </div>
        </div>

        {/* Top Clients */}
        <h3>Top Clients by Revenue</h3>
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '20px' }}>
          {stats.topClients?.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Client</th>
                  <th style={{ textAlign: 'right', padding: '10px' }}>Invoices</th>
                  <th style={{ textAlign: 'right', padding: '10px' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stats.topClients.map(([clientName, data], index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '10px' }}>{clientName}</td>
                    <td style={{ textAlign: 'right', padding: '10px' }}>{data.count}</td>
                    <td style={{ textAlign: 'right', padding: '10px' }}>£{data.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No client data available for the selected period.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;
