import React, { useState, useEffect } from 'react';
import { db } from './firebase.js';
import {
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { useDarkMode } from './DarkModeContext.js';

function Reports({ user }) {
  const { isDarkMode } = useDarkMode();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalInvoices: 0,
    paidCount: 0,
    unpaidCount: 0,
    overdueCount: 0
  });

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    if (!user) return;

    try {
      const q = query(collection(db, 'invoices'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      let totalRevenue = 0;
      let paidCount = 0;
      let unpaidCount = 0;
      let overdueCount = 0;
      const today = new Date();

      const paidInvoices = [];
      const unpaidInvoices = [];
      const overdueInvoices = [];

      snapshot.docs.forEach(doc => {
        const invoice = doc.data();
        const amount = parseFloat(invoice.amount) || 0;

        if (invoice.status === 'paid') {
          totalRevenue += amount;
          paidCount++;
          paidInvoices.push(invoice);
        } else {
          const dueDate = invoice.dueDate ? new Date(invoice.dueDate.seconds * 1000) : null;

          if (dueDate && dueDate < today) {
            overdueCount++;
            overdueInvoices.push(invoice);
          } else {
            unpaidCount++;
            unpaidInvoices.push(invoice);
          }
        }
      });

      const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

      setStats({
        totalRevenue: totalRevenue.toFixed(2),
        totalInvoices: snapshot.docs.length,
        paidCount,
        unpaidCount,
        overdueCount,
        unpaidAmount: unpaidAmount.toFixed(2),
        overdueAmount: overdueAmount.toFixed(2)
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

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
    gap: '25px',
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
    textAlign: 'center',
    transition: 'transform 0.2s ease'
  };

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '300' }}>
            📈 Reports & Analytics
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
            Track your business performance and revenue insights
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

          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#fd7e14', fontSize: '1.2rem' }}>
              💸 Unpaid Amount
            </h3>
            <p style={{ fontSize: '2.2rem', fontWeight: 'bold', margin: 0 }}>
              £{stats.unpaidAmount}
            </p>
          </div>

          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#e83e8c', fontSize: '1.2rem' }}>
              ⚠️ Overdue Amount
            </h3>
            <p style={{ fontSize: '2.2rem', fontWeight: 'bold', margin: 0 }}>
              £{stats.overdueAmount}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;