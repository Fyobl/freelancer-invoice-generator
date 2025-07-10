
import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Navigation from './Navigation.js';
import { useDarkMode } from './DarkModeContext.js';

function Reports() {
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [dateRange, setDateRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const { isDarkMode } = useDarkMode();

  const user = auth.currentUser;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch invoices
      const invoicesQuery = query(collection(db, 'invoices'), where('userId', '==', user.uid));
      const invoicesSnapshot = await getDocs(invoicesQuery);
      const invoicesData = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvoices(invoicesData);

      // Fetch products
      const productsQuery = query(collection(db, 'products'), where('userId', '==', user.uid));
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);

      // Fetch clients
      const clientsQuery = query(collection(db, 'clients'), where('userId', '==', user.uid));
      const clientsSnapshot = await getDocs(clientsQuery);
      const clientsData = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientsData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalRevenue = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
    const unpaidInvoices = invoices.filter(inv => inv.status === 'Unpaid');
    const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue');

    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalInvoices: invoices.length,
      paidAmount: paidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0).toFixed(2),
      unpaidAmount: unpaidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0).toFixed(2),
      overdueAmount: overdueInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0).toFixed(2),
      paidCount: paidInvoices.length,
      unpaidCount: unpaidInvoices.length,
      overdueCount: overdueInvoices.length
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

  const getTopProducts = () => {
    const productSales = {};
    
    invoices.forEach(invoice => {
      const productId = invoice.selectedProductId;
      if (productId && productId !== '') {
        if (!productSales[productId]) {
          productSales[productId] = { revenue: 0, salesCount: 0 };
        }
        productSales[productId].revenue += parseFloat(invoice.amount || 0);
        productSales[productId].salesCount += 1;
      }
    });

    return Object.entries(productSales)
      .map(([productId, data]) => {
        const product = products.find(p => p.id === productId);
        return {
          productId,
          productName: product ? product.name : 'Unknown Product',
          ...data
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const stats = calculateStats();
  const topClients = getTopClients();
  const topProducts = getTopProducts();

  const containerStyle = {
    minHeight: '100vh',
    background: isDarkMode 
      ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
    color: 'white'
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '25px',
    marginBottom: '40px'
  };

  const statCardStyle = {
    background: isDarkMode ? 'rgba(15,15,35,0.95)' : 'rgba(255,255,255,0.95)',
    padding: '30px',
    borderRadius: '16px',
    textAlign: 'center',
    backdropFilter: 'blur(15px)',
    boxShadow: isDarkMode ? '0 20px 40px rgba(0,0,0,0.3)' : '0 20px 40px rgba(0,0,0,0.1)',
    border: isDarkMode ? '2px solid rgba(55,65,81,0.3)' : '2px solid rgba(255,255,255,0.2)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    color: isDarkMode ? '#ffffff' : '#333333'
  };

  const chartContainerStyle = {
    background: isDarkMode ? 'rgba(15,15,35,0.95)' : 'rgba(255,255,255,0.95)',
    padding: '30px',
    borderRadius: '16px',
    marginBottom: '30px',
    backdropFilter: 'blur(15px)',
    boxShadow: isDarkMode ? '0 20px 40px rgba(0,0,0,0.3)' : '0 20px 40px rgba(0,0,0,0.1)',
    border: isDarkMode ? '2px solid rgba(55,65,81,0.3)' : '2px solid rgba(255,255,255,0.2)',
    color: isDarkMode ? '#ffffff' : '#333333'
  };

  const listItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    borderBottom: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
    color: isDarkMode ? '#ffffff' : '#333333'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <Navigation user={user} />
        <div style={contentStyle}>
          <div style={{ textAlign: 'center', padding: '100px', color: 'white' }}>
            <h2>Loading reports...</h2>
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
          <h1 style={{ fontSize: '3rem', margin: '0 0 15px 0', fontWeight: '300' }}>
            📈 Business Reports
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: '0.9', margin: 0 }}>
            Analyze your business performance and track key metrics
          </p>
        </div>

        {/* Statistics Cards */}
        <div style={statsGridStyle}>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#667eea', fontSize: '1.1rem' }}>Total Revenue</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: isDarkMode ? '#ffffff' : '#333' }}>
              £{stats.totalRevenue}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#667eea', fontSize: '1.1rem' }}>Total Invoices</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: isDarkMode ? '#ffffff' : '#333' }}>
              {stats.totalInvoices}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#28a745', fontSize: '1.1rem' }}>Paid</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: isDarkMode ? '#ffffff' : '#333' }}>
              £{stats.paidAmount}
            </p>
            <p style={{ fontSize: '1rem', color: '#666', margin: '5px 0 0 0' }}>
              {stats.paidCount} invoices
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#ffc107', fontSize: '1.1rem' }}>Unpaid</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: isDarkMode ? '#ffffff' : '#333' }}>
              £{stats.unpaidAmount}
            </p>
            <p style={{ fontSize: '1rem', color: '#666', margin: '5px 0 0 0' }}>
              {stats.unpaidCount} invoices
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#dc3545', fontSize: '1.1rem' }}>Overdue</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: isDarkMode ? '#ffffff' : '#333' }}>
              £{stats.overdueAmount}
            </p>
            <p style={{ fontSize: '1rem', color: '#666', margin: '5px 0 0 0' }}>
              {stats.overdueCount} invoices
            </p>
          </div>
        </div>

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

        {/* Top Products */}
        <div style={chartContainerStyle}>
          <h2 style={{ marginTop: 0, color: isDarkMode ? '#ffffff' : '#333', fontSize: '1.8rem' }}>
            📦 Top Products
          </h2>
          {topProducts.length === 0 ? (
            <p style={{ color: isDarkMode ? '#9ca3af' : '#666', fontSize: '1.1rem' }}>
              No product data available yet. Create some products and invoices to see your top products.
            </p>
          ) : (
            <div>
              {topProducts.map((product, index) => (
                <div key={index} style={listItemStyle}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{product.productName}</div>
                    <div style={{ fontSize: '0.9rem', color: isDarkMode ? '#9ca3af' : '#666' }}>
                      {product.salesCount} sales
                    </div>
                  </div>
                  <span style={{ fontWeight: 'bold', color: '#667eea' }}>
                    £{product.revenue.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;
