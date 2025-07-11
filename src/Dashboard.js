
import React, { useState, useEffect } from 'react';
import { db } from './firebase.js';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { useDarkMode } from './DarkModeContext.js';

function Dashboard({ user }) {
  const { isDarkMode } = useDarkMode();
  const [invoices, setInvoices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    clientName: '',
    amount: '',
    dueDate: '',
    status: 'Unpaid'
  });

  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
  }, [user]);

  const fetchInvoices = async () => {
    if (!user) return;
    
    try {
      const q = query(
        collection(db, 'invoices'), 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
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

  const addInvoice = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addDoc(collection(db, 'invoices'), {
        ...formData,
        userId: user.uid,
        amount: parseFloat(formData.amount),
        createdAt: serverTimestamp()
      });
      
      setFormData({
        invoiceNumber: '',
        clientName: '',
        amount: '',
        dueDate: '',
        status: 'Unpaid'
      });
      setShowModal(false);
      fetchInvoices();
    } catch (error) {
      console.error('Error adding invoice:', error);
    }
  };

  const deleteInvoice = async (id) => {
    try {
      await deleteDoc(doc(db, 'invoices', id));
      fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const updateInvoiceStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'invoices', id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      fetchInvoices();
    } catch (error) {
      console.error('Error updating invoice:', error);
    }
  };

  const calculateStats = () => {
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
    const unpaidInvoices = invoices.filter(inv => inv.status === 'Unpaid');
    
    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalInvoices: invoices.length,
      paidCount: paidInvoices.length,
      unpaidCount: unpaidInvoices.length
    };
  };

  const stats = calculateStats();

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

  const buttonStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '15px 30px',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
    transition: 'all 0.3s ease',
    marginBottom: '30px'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    background: isDarkMode 
      ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' 
      : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: isDarkMode 
      ? '0 20px 40px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.3)' 
      : '0 20px 40px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.05)',
    border: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0'
  };

  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  };

  const modalContentStyle = {
    background: isDarkMode ? '#1e293b' : '#ffffff',
    padding: '40px',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '500px',
    border: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0',
    color: isDarkMode ? '#f1f5f9' : '#1e293b'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    borderRadius: '8px',
    border: isDarkMode ? '1px solid #475569' : '1px solid #cbd5e1',
    background: isDarkMode ? '#374151' : '#ffffff',
    color: isDarkMode ? '#f1f5f9' : '#1e293b',
    fontSize: '16px'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={contentStyle}>
          <div style={headerStyle}>
            <h1 style={{ fontSize: '2.5rem', margin: 0 }}>📊 Loading Dashboard...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '300' }}>
            📊 Invoice Dashboard
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
            Manage your invoices and track payments
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
              ✅ Paid
            </h3>
            <p style={{ fontSize: '2.2rem', fontWeight: 'bold', margin: 0 }}>
              {stats.paidCount}
            </p>
          </div>

          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#dc3545', fontSize: '1.2rem' }}>
              ⏰ Unpaid
            </h3>
            <p style={{ fontSize: '2.2rem', fontWeight: 'bold', margin: 0 }}>
              {stats.unpaidCount}
            </p>
          </div>
        </div>

        <button style={buttonStyle} onClick={() => setShowModal(true)}>
          ➕ Create New Invoice
        </button>

        {/* Invoices Table */}
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: isDarkMode ? '#374151' : '#f1f5f9' }}>
              <th style={{ padding: '15px', textAlign: 'left' }}>Invoice #</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Client</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Amount</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Due Date</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} style={{ borderBottom: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0' }}>
                <td style={{ padding: '15px' }}>{invoice.invoiceNumber}</td>
                <td style={{ padding: '15px' }}>{invoice.clientName}</td>
                <td style={{ padding: '15px' }}>£{invoice.amount?.toFixed(2)}</td>
                <td style={{ padding: '15px' }}>{invoice.dueDate}</td>
                <td style={{ padding: '15px' }}>
                  <span style={{
                    padding: '5px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    background: invoice.status === 'Paid' ? '#28a745' : '#ffc107',
                    color: 'white'
                  }}>
                    {invoice.status}
                  </span>
                </td>
                <td style={{ padding: '15px' }}>
                  {invoice.status !== 'Paid' && (
                    <button
                      onClick={() => updateInvoiceStatus(invoice.id, 'Paid')}
                      style={{
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '5px',
                        marginRight: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      Mark Paid
                    </button>
                  )}
                  <button
                    onClick={() => deleteInvoice(invoice.id)}
                    style={{
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Modal */}
        {showModal && (
          <div style={modalStyle}>
            <div style={modalContentStyle}>
              <h2 style={{ marginTop: 0 }}>Create New Invoice</h2>
              <form onSubmit={addInvoice}>
                <input
                  type="text"
                  placeholder="Invoice Number"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})}
                  style={inputStyle}
                  required
                />
                <input
                  type="text"
                  placeholder="Client Name"
                  value={formData.clientName}
                  onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                  style={inputStyle}
                  required
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  style={inputStyle}
                  required
                />
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  style={inputStyle}
                  required
                />
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  style={inputStyle}
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                </select>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button type="submit" style={buttonStyle}>
                    Create Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      ...buttonStyle,
                      background: '#6c757d'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
