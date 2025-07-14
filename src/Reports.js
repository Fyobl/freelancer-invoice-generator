import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase.js';
import Navigation from './Navigation.js';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function Reports() {
  const [invoices, setInvoices] = useState([]);
  const [userData, setUserData] = useState(null);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [dateRange, setDateRange] = useState('all');
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      fetchData();
      fetchUserData();
    }
  }, [user]);

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

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
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

  const generateReportPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let currentY = 20;

      // Header
      doc.setFillColor(41, 128, 185);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('Business Report', pageWidth / 2, 25, { align: 'center' });

      currentY = 60;
      doc.setTextColor(0, 0, 0);

      // Report period
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      const periodText = dateRange === 'all' ? 'All Time' : 
                        dateRange === 'week' ? 'Last 7 Days' :
                        dateRange === 'month' ? 'Last Month' :
                        dateRange === 'quarter' ? 'Last Quarter' : 'Last Year';
      doc.text(`Report Period: ${periodText}`, 20, currentY);
      currentY += 20;

      // Revenue Overview
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Revenue Overview', 20, currentY);
      currentY += 10;

      const revenueData = [
        ['Total Revenue', `£${stats.totalRevenue?.toFixed(2) || '0.00'}`],
        ['Paid Revenue', `£${stats.paidRevenue?.toFixed(2) || '0.00'}`],
        ['Unpaid Revenue', `£${stats.unpaidRevenue?.toFixed(2) || '0.00'}`],
        ['Overdue Revenue', `£${stats.overdueRevenue?.toFixed(2) || '0.00'}`]
      ];

      doc.autoTable({
        startY: currentY,
        head: [['Metric', 'Amount']],
        body: revenueData,
        theme: 'grid',
        headStyles: { fillColor: [102, 126, 234] }
      });

      currentY = doc.lastAutoTable.finalY + 20;

      // Invoice Statistics
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Invoice Statistics', 20, currentY);
      currentY += 10;

      const invoiceData = [
        ['Total Invoices', stats.totalInvoices || 0],
        ['Average Invoice Value', `£${stats.averageInvoiceValue?.toFixed(2) || '0.00'}`],
        ['Paid Invoices', stats.statusCounts?.paid || 0],
        ['Unpaid Invoices', stats.statusCounts?.unpaid || 0],
        ['Overdue Invoices', stats.statusCounts?.overdue || 0]
      ];

      doc.autoTable({
        startY: currentY,
        head: [['Metric', 'Value']],
        body: invoiceData,
        theme: 'grid',
        headStyles: { fillColor: [102, 126, 234] }
      });

      currentY = doc.lastAutoTable.finalY + 20;

      // Top Clients
      if (stats.topClients && stats.topClients.length > 0) {
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Top Clients by Revenue', 20, currentY);
        currentY += 10;

        const clientData = stats.topClients.map(([clientName, data], index) => [
          index + 1,
          clientName,
          data.count,
          `£${data.revenue.toFixed(2)}`
        ]);

        doc.autoTable({
          startY: currentY,
          head: [['Rank', 'Client Name', 'Invoices', 'Revenue']],
          body: clientData,
          theme: 'grid',
          headStyles: { fillColor: [102, 126, 234] }
        });
      }

      // Footer
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(10);
      doc.setFont(undefined, 'italic');
      doc.setTextColor(128, 128, 128);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 20, { align: 'center' });

      // Save the PDF
      const fileName = `business_report_${periodText.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      alert('Error generating PDF report: ' + (error.message || 'Unknown error occurred'));
    }
  };

  // Styles
  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  };

  const contentStyle = {
    padding: '30px',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const headerStyle = {
    color: 'white',
    textAlign: 'center',
    marginBottom: '40px'
  };

  const filterStyle = {
    background: 'rgba(255,255,255,0.9)',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '30px',
    backdropFilter: 'blur(10px)'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 15px',
    border: '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '15px',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
    height: '44px',
    lineHeight: '20px',
    verticalAlign: 'top'
  };

  const selectStyle = {
    width: '100%',
    padding: '12px 15px',
    border: '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '15px',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
    height: '44px',
    lineHeight: '20px',
    verticalAlign: 'top',
    appearance: 'none'
  };

  const statCardStyle = {
    background: 'rgba(255,255,255,0.95)',
    border: '2px solid #f8f9fa',
    borderRadius: '12px',
    padding: '25px',
    textAlign: 'center',
    backdropFilter: 'blur(15px)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  };

  const sectionStyle = {
    background: 'rgba(255,255,255,0.95)',
    padding: '30px',
    borderRadius: '16px',
    marginBottom: '30px',
    backdropFilter: 'blur(15px)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  };

  const thStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '15px',
    textAlign: 'left',
    fontWeight: 'bold',
    fontSize: '14px'
  };

  const tdStyle = {
    padding: '15px',
    borderBottom: '1px solid #f8f9fa',
    fontSize: '14px'
  };

  return (
    <div style={containerStyle}>
      <Navigation user={user} />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', paddingTop: '100px' }}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: 'bold' }}>
            📊 Reports & Analytics
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
            Hello {userData?.firstName || user?.email?.split('@')[0]}! View your business performance
          </p>
        </div>

        {/* Date Filter and Download */}
        <div style={filterStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', alignItems: 'end' }}>
            <div>
              <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>📅 Time Period</h3>
              <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#666' }}>
                Select time range:
                <select 
                  value={dateRange} 
                  onChange={(e) => setDateRange(e.target.value)}
                  style={selectStyle}
                >
                  <option value="all">All Time</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last Quarter</option>
                  <option value="year">Last Year</option>
                </select>
              </label>
            </div>
            <div>
              <button
                onClick={generateReportPDF}
                style={{
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 25px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                  height: '44px'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                📄 Download PDF Report
              </button>
            </div>
          </div>
        </div>

        {/* Revenue Statistics */}
        <div style={sectionStyle}>
          <h3 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '1.5rem' }}>
            💰 Revenue Overview
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div 
              style={statCardStyle}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(102, 126, 234, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
              }}
            >
              <h4 style={{ color: '#667eea', margin: '0 0 10px 0', fontSize: '1.1rem' }}>Total Revenue</h4>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
                £{stats.totalRevenue?.toFixed(2) || '0.00'}
              </p>
            </div>

            <div 
              style={statCardStyle}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(40, 167, 69, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
              }}
            >
              <h4 style={{ color: '#28a745', margin: '0 0 10px 0', fontSize: '1.1rem' }}>Paid</h4>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
                £{stats.paidRevenue?.toFixed(2) || '0.00'}
              </p>
            </div>

            <div 
              style={statCardStyle}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(255, 193, 7, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
              }}
            >
              <h4 style={{ color: '#ffc107', margin: '0 0 10px 0', fontSize: '1.1rem' }}>Unpaid</h4>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
                £{stats.unpaidRevenue?.toFixed(2) || '0.00'}
              </p>
            </div>

            <div 
              style={statCardStyle}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(220, 53, 69, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
              }}
            >
              <h4 style={{ color: '#dc3545', margin: '0 0 10px 0', fontSize: '1.1rem' }}>Overdue</h4>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
                £{stats.overdueRevenue?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>

        {/* Invoice Statistics */}
        <div style={sectionStyle}>
          <h3 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '1.5rem' }}>
            📋 Invoice Statistics
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div 
              style={statCardStyle}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(102, 126, 234, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
              }}
            >
              <h4 style={{ margin: '0 0 10px 0', color: '#667eea', fontSize: '1.1rem' }}>Total Invoices</h4>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
                {stats.totalInvoices || 0}
              </p>
            </div>

            <div 
              style={statCardStyle}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(102, 126, 234, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
              }}
            >
              <h4 style={{ margin: '0 0 10px 0', color: '#667eea', fontSize: '1.1rem' }}>Average Value</h4>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
                £{stats.averageInvoiceValue?.toFixed(2) || '0.00'}
              </p>
            </div>

            <div 
              style={statCardStyle}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(102, 126, 234, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
              }}
            >
              <h4 style={{ margin: '0 0 10px 0', color: '#667eea', fontSize: '1.1rem' }}>Total Clients</h4>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
                {clients.length}
              </p>
            </div>

            <div 
              style={statCardStyle}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(102, 126, 234, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
              }}
            >
              <h4 style={{ margin: '0 0 10px 0', color: '#667eea', fontSize: '1.1rem' }}>Total Products</h4>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
                {products.length}
              </p>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div style={sectionStyle}>
          <h3 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '1.5rem' }}>
            📈 Invoice Status Breakdown
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ ...statCardStyle, background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', color: 'white' }}>
              <h4 style={{ margin: '0 0 10px 0', color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem' }}>Paid</h4>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>
                {stats.statusCounts?.paid || 0}
              </p>
            </div>
            <div style={{ ...statCardStyle, background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)', color: 'white' }}>
              <h4 style={{ margin: '0 0 10px 0', color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem' }}>Unpaid</h4>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>
                {stats.statusCounts?.unpaid || 0}
              </p>
            </div>
            <div style={{ ...statCardStyle, background: 'linear-gradient(135deg, #dc3545 0%, #e83e8c 100%)', color: 'white' }}>
              <h4 style={{ margin: '0 0 10px 0', color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem' }}>Overdue</h4>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>
                {stats.statusCounts?.overdue || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Top Clients */}
        <div style={sectionStyle}>
          <h3 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '1.5rem' }}>
            🏆 Top Clients by Revenue
          </h3>
          {stats.topClients?.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, textAlign: 'left' }}>Client</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Invoices</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topClients.map(([clientName, data], index) => (
                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '10px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            {index + 1}
                          </span>
                          <strong>{clientName}</strong>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{ 
                          background: '#e9ecef',
                          color: '#495057',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {data.count}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <strong style={{ color: '#28a745' }}>£{data.revenue.toFixed(2)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p style={{ fontSize: '1.2rem', margin: '0 0 10px 0' }}>
                No client data available for the selected period.
              </p>
              <p style={{ margin: 0, opacity: '0.8' }}>
                Start creating invoices to see your top clients here!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;