
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
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      // Fetch invoices
      const invoicesQuery = query(
        collection(db, 'invoices'),
        where('userId', '==', user.uid)
      );
      const invoicesSnapshot = await getDocs(invoicesQuery);
      const invoicesData = invoicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
      }));

      // Filter by date range
      const filteredInvoices = invoicesData.filter(invoice => {
        const invoiceDate = new Date(invoice.date);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return invoiceDate >= startDate && invoiceDate <= endDate;
      });

      setInvoices(filteredInvoices);

      // Fetch clients
      const clientsQuery = query(
        collection(db, 'clients'),
        where('userId', '==', user.uid)
      );
      const clientsSnapshot = await getDocs(clientsQuery);
      const clientsData = clientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClients(clientsData);

      // Fetch products
      const productsQuery = query(
        collection(db, 'products'),
        where('userId', '==', user.uid)
      );
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalRevenue = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
    const totalInvoices = invoices.length;
    const averageInvoice = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;
    
    return {
      totalRevenue,
      totalInvoices,
      averageInvoice,
      totalClients: clients.length,
      totalProducts: products.length
    };
  };

  const getTopClients = () => {
    const clientRevenue = {};
    
    invoices.forEach(invoice => {
      const clientId = invoice.clientId;
      if (clientRevenue[clientId]) {
        clientRevenue[clientId] += invoice.total || 0;
      } else {
        clientRevenue[clientId] = invoice.total || 0;
      }
    });

    return Object.entries(clientRevenue)
      .map(([clientId, revenue]) => {
        const client = clients.find(c => c.id === clientId);
        return {
          clientId,
          clientName: client ? client.name : 'Unknown Client',
          revenue
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const getTopProducts = () => {
    const productSales = {};
    
    invoices.forEach(invoice => {
      if (invoice.items) {
        invoice.items.forEach(item => {
          if (productSales[item.productId]) {
            productSales[item.productId].quantity += item.quantity || 0;
            productSales[item.productId].revenue += (item.quantity || 0) * (item.price || 0);
          } else {
            productSales[item.productId] = {
              quantity: item.quantity || 0,
              revenue: (item.quantity || 0) * (item.price || 0)
            };
          }
        });
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
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '25px',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <Navigation user={auth.currentUser} />
        <div style={contentStyle}>
          <div style={{ textAlign: 'center', color: 'white', fontSize: '1.2rem' }}>
            Loading reports...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <Navigation user={auth.currentUser} />
      <div style={contentStyle}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '300' }}>
            📈 Reports & Analytics
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
            Analyze your business performance
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={{ marginBottom: '20px', color: isDarkMode ? '#ffffff' : '#333333' }}>
            📅 Date Range
          </h2>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Start Date:
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '2px solid #e1e5e9',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                End Date:
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '2px solid #e1e5e9',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        </div>

        <div style={statsGridStyle}>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', opacity: '0.9' }}>
              Total Revenue
            </h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              ${stats.totalRevenue.toFixed(2)}
            </div>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', opacity: '0.9' }}>
              Total Invoices
            </h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {stats.totalInvoices}
            </div>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', opacity: '0.9' }}>
              Average Invoice
            </h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              ${stats.averageInvoice.toFixed(2)}
            </div>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', opacity: '0.9' }}>
              Total Clients
            </h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {stats.totalClients}
            </div>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', opacity: '0.9' }}>
              Total Products
            </h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {stats.totalProducts}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
          <div style={cardStyle}>
            <h2 style={{ marginBottom: '20px', color: isDarkMode ? '#ffffff' : '#333333' }}>
              👥 Top Clients by Revenue
            </h2>
            {topClients.length > 0 ? (
              <div>
                {topClients.map((client, index) => (
                  <div key={client.clientId} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '15px',
                    marginBottom: '10px',
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(102, 126, 234, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>#{index + 1}</span>
                      <span style={{ marginLeft: '10px' }}>{client.clientName}</span>
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#667eea' }}>
                      ${client.revenue.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#666' }}>No client data available</p>
            )}
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginBottom: '20px', color: isDarkMode ? '#ffffff' : '#333333' }}>
              📦 Top Products by Revenue
            </h2>
            {topProducts.length > 0 ? (
              <div>
                {topProducts.map((product, index) => (
                  <div key={product.productId} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '15px',
                    marginBottom: '10px',
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(102, 126, 234, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>#{index + 1}</span>
                      <span style={{ marginLeft: '10px' }}>{product.productName}</span>
                      <div style={{ fontSize: '0.9rem', opacity: '0.7', marginTop: '5px' }}>
                        Qty: {product.quantity}
                      </div>
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#667eea' }}>
                      ${product.revenue.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#666' }}>No product data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
