import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Navigation from './Navigation.js';
import { useDarkMode } from './DarkModeContext.js';

function Reports() {
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [invoicesSnapshot, productsSnapshot, clientsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'invoices'), where('userId', '==', user.uid))),
        getDocs(query(collection(db, 'products'), where('userId', '==', user.uid))),
        getDocs(query(collection(db, 'clients'), where('userId', '==', user.uid)))
      ]);

      setInvoices(invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setProducts(productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setClients(clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalRevenue = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.amount || 0), 0);
    const paidInvoices = invoices.filter(invoice => invoice.status === 'Paid');
    const unpaidInvoices = invoices.filter(invoice => invoice.status === 'Unpaid');

    return {
      totalRevenue,
      totalInvoices: invoices.length,
      paidInvoices: paidInvoices.length,
      unpaidInvoices: unpaidInvoices.length,
      paidRevenue: paidInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.amount || 0), 0),
      unpaidRevenue: unpaidInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.amount || 0), 0)
    };
  };

  const getTopClients = () => {
    const clientRevenue = {};

    invoices.forEach(invoice => {
      const clientId = invoice.selectedClientId || invoice.clientName;
      if (!clientRevenue[clientId]) {
        clientRevenue[clientId] = { revenue: 0, invoiceCount: 0 };
      }
      clientRevenue[clientId].revenue += parseFloat(invoice.amount || 0);
      clientRevenue[clientId].invoiceCount += 1;
    });

    return Object.entries(clientRevenue)
      .map(([clientId, data]) => {
        const client = clients.find(c => c.id === clientId);
        return {
          clientId,
          clientName: client ? client.name : clientId,
          ...data
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
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

  const cardStyle = {
    background: isDarkMode ? 'rgba(26,32,46,0.95)' : 'rgba(255,255,255,0.95)',
    padding: '30px',
    borderRadius: '16px',
    marginBottom: '30px',
    backdropFilter: 'blur(15px)',
    border: '2px solid rgba(255,255,255,0.1)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  };

  const statCardStyle = {
    background: isDarkMode ? 'rgba(40,44,52,0.8)' : 'rgba(255,255,255,0.9)',
    padding: '20px',
    borderRadius: '12px',
    textAlign: 'center',
    border: '2px solid rgba(102, 126, 234, 0.1)',
    color: isDarkMode ? '#ffffff' : '#333333'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <Navigation user={user} />
        <div style={contentStyle}>
          <div style={headerStyle}>
            <h1>📈 Reports</h1>
            <p>Loading your business analytics...</p>
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
            Track your business performance and insights
          </p>
        </div>

        <div style={statsGridStyle}>
          <div style={statCardStyle}>
            <h3 style={{ color: '#667eea', margin: '0 0 10px 0' }}>Total Revenue</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
              £{stats.totalRevenue.toFixed(2)}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ color: '#667eea', margin: '0 0 10px 0' }}>Total Invoices</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
              {stats.totalInvoices}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ color: '#28a745', margin: '0 0 10px 0' }}>Paid Revenue</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
              £{stats.paidRevenue.toFixed(2)}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ color: '#dc3545', margin: '0 0 10px 0' }}>Unpaid Revenue</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
              £{stats.unpaidRevenue.toFixed(2)}
            </p>
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={{ color: isDarkMode ? '#ffffff' : '#333333', marginBottom: '20px' }}>
            👥 Top Clients
          </h2>
          {topClients.length > 0 ? (
            <div>
              {topClients.map((client, index) => (
                <div key={client.clientId} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '15px 0',
                  borderBottom: index < topClients.length - 1 ? '1px solid rgba(0,0,0,0.1)' : 'none'
                }}>
                  <div>
                    <h4 style={{ margin: 0, color: isDarkMode ? '#ffffff' : '#333333' }}>
                      {client.clientName}
                    </h4>
                    <p style={{ margin: 0, color: isDarkMode ? '#cccccc' : '#666666' }}>
                      {client.invoiceCount} invoices
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#667eea' }}>
                      £{client.revenue.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: isDarkMode ? '#cccccc' : '#666666' }}>No client data available</p>
          )}
        </div>

        <div style={cardStyle}>
          <h2 style={{ color: isDarkMode ? '#ffffff' : '#333333', marginBottom: '20px' }}>
            📦 Top Products
          </h2>
          {topProducts.length > 0 ? (
            <div>
              {topProducts.map((product, index) => (
                <div key={product.productId} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '15px 0',
                  borderBottom: index < topProducts.length - 1 ? '1px solid rgba(0,0,0,0.1)' : 'none'
                }}>
                  <div>
                    <h4 style={{ margin: 0, color: isDarkMode ? '#ffffff' : '#333333' }}>
                      {product.productName}
                    </h4>
                    <p style={{ margin: 0, color: isDarkMode ? '#cccccc' : '#666666' }}>
                      {product.salesCount} sales
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#667eea' }}>
                      £{product.revenue.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: isDarkMode ? '#cccccc' : '#666666' }}>No product data available</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;