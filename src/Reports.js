
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
      const invoicesList = [];
      querySnapshot.forEach((doc) => {
        invoicesList.push({ id: doc.id, ...doc.data() });
      });
      setInvoices(invoicesList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      console.log('This is likely due to Firestore security rules requiring authentication');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: isDarkMode 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' 
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: isDarkMode ? '#f8fafc' : '#1e293b'
      }}>
        Loading reports...
      </div>
    );
  }

  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const unpaidInvoices = invoices.filter(inv => inv.status === 'unpaid');
  const overdueInvoices = invoices.filter(inv => {
    if (inv.status === 'unpaid' && inv.dueDate) {
      const dueDate = new Date(inv.dueDate);
      return dueDate < new Date();
    }
    return false;
  });

  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
  const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

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

  const statsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  };

  const statCardStyle = {
    background: isDarkMode 
      ? 'rgba(30, 41, 59, 0.8)' 
      : 'rgba(255, 255, 255, 0.9)',
    borderRadius: '15px',
    padding: '25px',
    boxShadow: isDarkMode 
      ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
      : '0 8px 32px rgba(0, 0, 0, 0.1)',
    border: isDarkMode 
      ? '1px solid rgba(148, 163, 184, 0.1)' 
      : '1px solid rgba(148, 163, 184, 0.2)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  };

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ 
          textAlign: 'center', 
          marginBottom: '40px',
          fontSize: '2.5rem',
          fontWeight: '700',
          background: isDarkMode 
            ? 'linear-gradient(135deg, #60a5fa, #a78bfa)' 
            : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          📊 Reports & Analytics
        </h1>

        <div style={statsStyle}>
          <div style={statCardStyle}>
            <h3 style={{ 
              color: '#10b981', 
              marginBottom: '10px',
              fontSize: '1.1rem',
              fontWeight: '600'
            }}>
              💰 Total Revenue
            </h3>
            <p style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              margin: '0',
              color: isDarkMode ? '#f8fafc' : '#1e293b'
            }}>
              ${totalRevenue.toFixed(2)}
            </p>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '0.9rem',
              margin: '5px 0 0 0'
            }}>
              From {paidInvoices.length} paid invoices
            </p>
          </div>

          <div style={statCardStyle}>
            <h3 style={{ 
              color: '#f59e0b', 
              marginBottom: '10px',
              fontSize: '1.1rem',
              fontWeight: '600'
            }}>
              ⏳ Outstanding Amount
            </h3>
            <p style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              margin: '0',
              color: isDarkMode ? '#f8fafc' : '#1e293b'
            }}>
              ${unpaidAmount.toFixed(2)}
            </p>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '0.9rem',
              margin: '5px 0 0 0'
            }}>
              From {unpaidInvoices.length} unpaid invoices
            </p>
          </div>

          <div style={statCardStyle}>
            <h3 style={{ 
              color: '#ef4444', 
              marginBottom: '10px',
              fontSize: '1.1rem',
              fontWeight: '600'
            }}>
              🚨 Overdue Amount
            </h3>
            <p style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              margin: '0',
              color: isDarkMode ? '#f8fafc' : '#1e293b'
            }}>
              ${overdueAmount.toFixed(2)}
            </p>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '0.9rem',
              margin: '5px 0 0 0'
            }}>
              From {overdueInvoices.length} overdue invoices
            </p>
          </div>

          <div style={statCardStyle}>
            <h3 style={{ 
              color: '#8b5cf6', 
              marginBottom: '10px',
              fontSize: '1.1rem',
              fontWeight: '600'
            }}>
              📋 Total Invoices
            </h3>
            <p style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              margin: '0',
              color: isDarkMode ? '#f8fafc' : '#1e293b'
            }}>
              {invoices.length}
            </p>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '0.9rem',
              margin: '5px 0 0 0'
            }}>
              Total invoices created
            </p>
          </div>
        </div>

        {invoices.length === 0 && (
          <div style={{
            background: isDarkMode 
              ? 'rgba(30, 41, 59, 0.8)' 
              : 'rgba(255, 255, 255, 0.9)',
            borderRadius: '15px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: isDarkMode 
              ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: isDarkMode 
              ? '1px solid rgba(148, 163, 184, 0.1)' 
              : '1px solid rgba(148, 163, 184, 0.2)'
          }}>
            <h3 style={{ 
              color: isDarkMode ? '#f8fafc' : '#1e293b',
              marginBottom: '15px' 
            }}>
              No Invoices Yet
            </h3>
            <p style={{ 
              color: '#6b7280',
              fontSize: '1.1rem' 
            }}>
              Create your first invoice to see reports and analytics here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
