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
    if (!user) return;

    try {
      console.log('Fetching invoices for user:', user.uid);
      const q = query(collection(db, 'invoices'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      console.log('This is likely due to Firestore security rules requiring authentication');
    } finally {
      setLoading(false);
    }
  };

  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const unpaidInvoices = invoices.filter(inv => inv.status === 'unpaid');
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');

  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
  const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading Reports...</h2>
      </div>
    );
  }

  const containerStyle = {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    background: '#f8fafc',
    minHeight: '100vh'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '30px',
    textAlign: 'center'
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  };

  const statCardStyle = {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    textAlign: 'center'
  };

  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>📊 Reports & Analytics</h1>

      <div style={statsGridStyle}>
        <div style={statCardStyle}>
          <h3 style={{ margin: '0 0 10px 0', color: '#10b981' }}>Total Revenue</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#10b981' }}>
            ${totalRevenue.toFixed(2)}
          </p>
        </div>

        <div style={statCardStyle}>
          <h3 style={{ margin: '0 0 10px 0', color: '#f59e0b' }}>Unpaid Amount</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#f59e0b' }}>
            ${unpaidAmount.toFixed(2)}
          </p>
        </div>

        <div style={statCardStyle}>
          <h3 style={{ margin: '0 0 10px 0', color: '#ef4444' }}>Overdue Amount</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#ef4444' }}>
            ${overdueAmount.toFixed(2)}
          </p>
        </div>

        <div style={statCardStyle}>
          <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Total Invoices</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#667eea' }}>
            {invoices.length}
          </p>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h3>No invoices found</h3>
          <p>Create some invoices to see your reports here.</p>
        </div>
      ) : (
        <div style={{ marginTop: '30px' }}>
          <h3>Invoice Summary</h3>
          <ul>
            <li>Paid Invoices: {paidInvoices.length}</li>
            <li>Unpaid Invoices: {unpaidInvoices.length}</li>
            <li>Overdue Invoices: {overdueInvoices.length}</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default Reports;