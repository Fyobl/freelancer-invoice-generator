
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

function Dashboard({ user }) {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [newInvoice, setNewInvoice] = useState({
    invoiceNumber: '',
    clientName: '',
    clientEmail: '',
    amount: '',
    dueDate: '',
    status: 'unpaid',
    description: ''
  });

  useEffect(() => {
    if (user) {
      fetchInvoices();
      fetchClients();
      fetchProducts();
    }
  }, [user]);

  const fetchInvoices = async () => {
    try {
      console.log('Fetching invoices for user:', user.uid);
      const q = query(
        collection(db, 'invoices'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
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

  const fetchClients = async () => {
    try {
      const q = query(
        collection(db, 'clients'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const clientsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const q = query(
        collection(db, 'products'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingInvoice) {
        await updateDoc(doc(db, 'invoices', editingInvoice.id), {
          ...newInvoice,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'invoices'), {
          ...newInvoice,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
      }
      
      setNewInvoice({
        invoiceNumber: '',
        clientName: '',
        clientEmail: '',
        amount: '',
        dueDate: '',
        status: 'unpaid',
        description: ''
      });
      setShowModal(false);
      setEditingInvoice(null);
      fetchInvoices();
    } catch (error) {
      console.error('Error saving invoice:', error);
    }
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setNewInvoice({
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      amount: invoice.amount,
      dueDate: invoice.dueDate,
      status: invoice.status,
      description: invoice.description
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteDoc(doc(db, 'invoices', id));
        fetchInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

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
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  };

  const statCardStyle = {
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    color: '#1e293b'
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
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0'
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
    background: '#ffffff',
    padding: '40px',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '500px',
    border: '1px solid #e2e8f0',
    color: '#1e293b'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={contentStyle}>
          <div style={{ textAlign: 'center', fontSize: '18px' }}>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

  const pendingAmount = invoices
    .filter(inv => inv.status === 'unpaid')
    .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

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
            Dashboard
          </h1>
          <p style={{ fontSize: '20px', opacity: 0.7, margin: 0 }}>
            Welcome back! Here's your business overview.
          </p>
        </div>

        <div style={statsGridStyle}>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#059669' }}>Total Revenue</h3>
            <p style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>
              ${totalRevenue.toFixed(2)}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#dc2626' }}>Pending Amount</h3>
            <p style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>
              ${pendingAmount.toFixed(2)}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#7c3aed' }}>Total Invoices</h3>
            <p style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>
              {invoices.length}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#ea580c' }}>Total Clients</h3>
            <p style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>
              {clients.length}
            </p>
          </div>
        </div>

        <button
          style={buttonStyle}
          onClick={() => setShowModal(true)}
          onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
        >
          + Create New Invoice
        </button>

        <table style={tableStyle}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '20px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Invoice #</th>
              <th style={{ padding: '20px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Client</th>
              <th style={{ padding: '20px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Amount</th>
              <th style={{ padding: '20px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Status</th>
              <th style={{ padding: '20px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '20px', color: '#64748b' }}>{invoice.invoiceNumber}</td>
                <td style={{ padding: '20px', color: '#64748b' }}>{invoice.clientName}</td>
                <td style={{ padding: '20px', color: '#64748b' }}>${parseFloat(invoice.amount || 0).toFixed(2)}</td>
                <td style={{ padding: '20px' }}>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    background: invoice.status === 'paid' ? '#d1fae5' : '#fef3c7',
                    color: invoice.status === 'paid' ? '#059669' : '#d97706'
                  }}>
                    {invoice.status}
                  </span>
                </td>
                <td style={{ padding: '20px' }}>
                  <button
                    onClick={() => handleEdit(invoice)}
                    style={{
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      marginRight: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(invoice.id)}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
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

        {showModal && (
          <div style={modalStyle}>
            <div style={modalContentStyle}>
              <h2 style={{ marginTop: 0 }}>
                {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                    Invoice Number:
                  </label>
                  <input
                    type="text"
                    value={newInvoice.invoiceNumber}
                    onChange={(e) => setNewInvoice({...newInvoice, invoiceNumber: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#1e293b'
                    }}
                    required
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                    Client Name:
                  </label>
                  <input
                    type="text"
                    value={newInvoice.clientName}
                    onChange={(e) => setNewInvoice({...newInvoice, clientName: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#1e293b'
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                    Amount:
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice({...newInvoice, amount: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#1e293b'
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                    Due Date:
                  </label>
                  <input
                    type="date"
                    value={newInvoice.dueDate}
                    onChange={(e) => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#1e293b'
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                    Status:
                  </label>
                  <select
                    value={newInvoice.status}
                    onChange={(e) => setNewInvoice({...newInvoice, status: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#1e293b'
                    }}
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingInvoice(null);
                      setNewInvoice({
                        invoiceNumber: '',
                        clientName: '',
                        clientEmail: '',
                        amount: '',
                        dueDate: '',
                        status: 'unpaid',
                        description: ''
                      });
                    }}
                    style={{
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      padding: '12px 20px',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '12px 20px',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
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
