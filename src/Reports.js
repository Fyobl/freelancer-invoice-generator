
import React, { useState, useEffect } from 'react';
import { db } from './firebase.js';
import {
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

function Reports({ user }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
  }, [user]);

  const fetchInvoices = async () => {
    try {
      console.log('Fetching invoices for user:', user.uid);
      const q = query(
        collection(db, 'invoices'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const invoicesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      console.log('This is likely due to Firestore security rules requiring authentication');
    } finally {
      setLoading(false);
    }
  };

  const paidInvoices = invoices.filter(invoice => invoice.status === 'paid');
  const unpaidInvoices = invoices.filter(invoice => invoice.status === 'unpaid');
  const overdueInvoices = invoices.filter(invoice => {
    if (invoice.status === 'paid') return false;
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    return dueDate < today;
  });

  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
  const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
    fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    paddingLeft: '300px',
    paddingRight: '20px',
    paddingTop: '40px',
    paddingBottom: '40px',
    color: '#1e293b'
  };

  const contentStyle = {
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '40px',
    color: '#1e293b'
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '25px',
    marginBottom: '40px'
  };

  const statCardStyle = {
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    padding: '30px',
    borderRadius: '16px',
    textAlign: 'center',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0'
  };

  const tableContainerStyle = {
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    borderRadius: '16px',
    padding: '30px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    marginBottom: '30px'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px'
  };

  const thStyle = {
    backgroundColor: '#f1f5f9',
    padding: '15px',
    textAlign: 'left',
    borderBottom: '2px solid #e2e8f0',
    fontWeight: '600',
    color: '#475569'
  };

  const tdStyle = {
    padding: '15px',
    borderBottom: '1px solid #e2e8f0',
    color: '#64748b'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={contentStyle}>
          <div style={{ textAlign: 'center', fontSize: '18px' }}>Loading reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={headerStyle}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '800',
            margin: '0 0 20px 0',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Reports & Analytics
          </h1>
          <p style={{ fontSize: '20px', opacity: 0.7, margin: 0 }}>
            Comprehensive overview of your invoicing performance
          </p>
        </div>

        <div style={statsGridStyle}>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#059669', fontSize: '24px' }}>Total Revenue</h3>
            <p style={{ fontSize: '36px', fontWeight: '700', margin: 0, color: '#059669' }}>
              ${totalRevenue.toFixed(2)}
            </p>
            <p style={{ margin: '10px 0 0 0', opacity: 0.7 }}>
              From {paidInvoices.length} paid invoices
            </p>
          </div>

          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#dc2626', fontSize: '24px' }}>Outstanding Amount</h3>
            <p style={{ fontSize: '36px', fontWeight: '700', margin: 0, color: '#dc2626' }}>
              ${unpaidAmount.toFixed(2)}
            </p>
            <p style={{ margin: '10px 0 0 0', opacity: 0.7 }}>
              From {unpaidInvoices.length} unpaid invoices
            </p>
          </div>

          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#ea580c', fontSize: '24px' }}>Overdue Amount</h3>
            <p style={{ fontSize: '36px', fontWeight: '700', margin: 0, color: '#ea580c' }}>
              ${overdueAmount.toFixed(2)}
            </p>
            <p style={{ margin: '10px 0 0 0', opacity: 0.7 }}>
              From {overdueInvoices.length} overdue invoices
            </p>
          </div>

          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#7c3aed', fontSize: '24px' }}>Total Invoices</h3>
            <p style={{ fontSize: '36px', fontWeight: '700', margin: 0, color: '#7c3aed' }}>
              {invoices.length}
            </p>
            <p style={{ margin: '10px 0 0 0', opacity: 0.7 }}>
              All time invoices created
            </p>
          </div>
        </div>

        {overdueInvoices.length > 0 && (
          <div style={tableContainerStyle}>
            <h2 style={{ margin: '0 0 20px 0', color: '#ea580c' }}>Overdue Invoices</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Invoice #</th>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Due Date</th>
                  <th style={thStyle}>Days Overdue</th>
                </tr>
              </thead>
              <tbody>
                {overdueInvoices.map((invoice) => {
                  const daysOverdue = Math.floor((new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={invoice.id}>
                      <td style={tdStyle}>{invoice.invoiceNumber}</td>
                      <td style={tdStyle}>{invoice.clientName}</td>
                      <td style={tdStyle}>${parseFloat(invoice.amount || 0).toFixed(2)}</td>
                      <td style={tdStyle}>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                      <td style={{...tdStyle, color: '#ea580c', fontWeight: '600'}}>{daysOverdue} days</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={tableContainerStyle}>
          <h2 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>All Invoices</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Invoice #</th>
                <th style={thStyle}>Client</th>
                <th style={thStyle}>Amount</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td style={tdStyle}>{invoice.invoiceNumber}</td>
                  <td style={tdStyle}>{invoice.clientName}</td>
                  <td style={tdStyle}>${parseFloat(invoice.amount || 0).toFixed(2)}</td>
                  <td style={{
                    ...tdStyle,
                    color: invoice.status === 'paid' ? '#059669' : '#dc2626',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}>
                    {invoice.status}
                  </td>
                  <td style={tdStyle}>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Reports;
