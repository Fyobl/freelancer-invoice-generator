import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from './firebase.js';
import {
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import Navigation from './Navigation.js';
import { generatePDFWithLogo } from './pdfService.js';


function Clients() {
  const [clients, setClients] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userData, setUserData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [companySettings, setCompanySettings] = useState({});
  const [expandedClients, setExpandedClients] = useState({});

  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      fetchClients();
      fetchUserData();
      fetchInvoices();
      fetchCompanySettings();
    }
  }, [user]);

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

  const fetchClients = async () => {
    const q = query(collection(db, 'clients'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setClients(data);
  };

  const fetchInvoices = async () => {
    const q = query(collection(db, 'invoices'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setInvoices(data);
  };

  const fetchCompanySettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'companySettings', user.uid));
      if (settingsDoc.exists()) {
        setCompanySettings(settingsDoc.data());
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
    }
  };

  const addClient = async () => {
    if (!name.trim() || !email.trim()) return;

    await addDoc(collection(db, 'clients'), {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      notes: notes.trim(),
      userId: user.uid,
      createdAt: serverTimestamp()
    });

    resetForm();
    fetchClients();
  };

  const updateClient = async () => {
    if (!name.trim() || !email.trim()) return;

    await updateDoc(doc(db, 'clients', editingId), {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      notes: notes.trim()
    });

    resetForm();
    fetchClients();
  };

  const deleteClient = async (id) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      await deleteDoc(doc(db, 'clients', id));
      fetchClients();
    }
  };

  const editClient = (client) => {
    setEditingId(client.id);
    setName(client.name);
    setEmail(client.email);
    setPhone(client.phone || '');
    setAddress(client.address || '');
    setNotes(client.notes || '');
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setNotes('');
    setEditingId(null);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get client invoices for statements
  const getClientInvoices = (clientId, period = 'full') => {
    let clientInvoices = invoices.filter(inv => inv.clientId === clientId);

    if (period !== 'full') {
      const now = new Date();
      const cutoffDate = new Date();

      switch (period) {
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

      clientInvoices = clientInvoices.filter(inv => {
        const invDate = inv.createdAt?.toDate() || new Date(inv.dueDate);
        return invDate >= cutoffDate;
      });
    }

    return clientInvoices;
  };

  // Calculate total owed by client
  const getClientTotalOwed = (clientId) => {
    const clientInvoices = invoices.filter(inv => inv.clientId === clientId);
    return clientInvoices
      .filter(inv => inv.status === 'Unpaid' || inv.status === 'Overdue')
      .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
  };

  const downloadClientStatement = async (client, period = 'full') => {
    try {
      const clientInvoices = getClientInvoices(client.id, period);
      
      // Generate PDF with logo
      const pdfDoc = await generatePDFWithLogo('statement', { client, invoices: clientInvoices }, companySettings, null, period);
      
      // Download the PDF
      const periodText = period === 'full' ? 'Full' : period;
      pdfDoc.save(`Statement-${client.name}-${periodText}.pdf`);
    } catch (error) {
      console.error('Error generating statement PDF:', error);
      alert('Error generating statement PDF. Please try again.');
    }
  };

  // Show client invoice history
  const showClientHistory = (client) => {
    const clientInvoices = getClientInvoices(client.id);

    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      backdrop-filter: blur(4px);
    `;

    const popup = document.createElement('div');
    popup.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      max-width: 800px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      border: 2px solid #667eea;
    `;

    const totalOwed = getClientTotalOwed(client.id);
    const totalRevenue = clientInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

    popup.innerHTML = `
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="font-size: 36px; margin-bottom: 15px;">📋📊</div>
        <h2 style="color: #333; margin-bottom: 10px; font-size: 1.5rem;">Invoice History - ${client.name}</h2>
        <p style="color: #666; margin-bottom: 20px;">Complete invoice history for this client</p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
            <h4 style="margin: 0 0 5px 0; color: #28a745; font-size: 0.9rem;">Total Revenue</h4>
            <p style="margin: 0; font-size: 1.3rem; font-weight: bold; color: #333;">£${totalRevenue.toFixed(2)}</p>
          </div>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">
            <h4 style="margin: 0 0 5px 0; color: #dc3545; font-size: 0.9rem;">Amount Owed</h4>
            <p style="margin: 0; font-size: 1.3rem; font-weight: bold; color: #333;">£${totalOwed.toFixed(2)}</p>
          </div>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
            <h4 style="margin: 0 0 5px 0; color: #667eea; font-size: 0.9rem;">Total Invoices</h4>
            <p style="margin: 0; font-size: 1.3rem; font-weight: bold; color: #333;">${clientInvoices.length}</p>
          </div>
        </div>
      </div>

      ${clientInvoices.length > 0 ? `
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                <th style="padding: 12px; text-align: left; font-size: 13px;">Invoice #</th>
                <th style="padding: 12px; text-align: left; font-size: 13px;">Date</th>
                <th style="padding: 12px; text-align: left; font-size: 13px;">Due Date</th>
                <th style="padding: 12px; text-align: left; font-size: 13px;">Status</th>
                <th style="padding: 12px; text-align: right; font-size: 13px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${clientInvoices.map((invoice, index) => `
                <tr style="background: ${index % 2 === 0 ? '#f8f9fa' : 'white'}; border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 12px; font-size: 12px;">${invoice.invoiceNumber || 'N/A'}</td>
                  <td style="padding: 12px; font-size: 12px;">${invoice.createdAt ? new Date(invoice.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                  <td style="padding: 12px; font-size: 12px;">${invoice.dueDate || 'N/A'}</td>
                  <td style="padding: 12px;">
                    <span style="
                      padding: 4px 8px; 
                      border-radius: 12px; 
                      font-size: 11px; 
                      font-weight: bold;
                      background: ${invoice.status === 'Paid' ? '#d4edda' : invoice.status === 'Overdue' ? '#f8d7da' : '#fff3cd'};
                      color: ${invoice.status === 'Paid' ? '#155724' : invoice.status === 'Overdue' ? '#721c24' : '#856404'};
                    ">
                      ${invoice.status || 'Unknown'}
                    </span>
                  </td>
                  <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 12px;">£${(parseFloat(invoice.amount) || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : `
        <div style="text-align: center; padding: 40px; color: #666;">
          <p style="font-size: 1.1rem; margin: 0;">No invoices found for this client.</p>
        </div>
      `}

      <div style="text-align: center; margin-top: 25px;">
        <button onclick="closeHistoryModal()" style="background: #6c757d; color: white; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-size: 14px;">Close</button>
      </div>
    `;

    modal.appendChild(popup);
    document.body.appendChild(modal);

    // Add global function for the popup
    window.closeHistoryModal = () => {
      document.body.removeChild(modal);
      delete window.closeHistoryModal;
    };

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        window.closeHistoryModal();
      }
    });
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

  const statsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  };

  const statCardStyle = {
    background: 'rgba(255,255,255,0.9)',
    padding: '20px',
    borderRadius: '12px',
    textAlign: 'center',
    backdropFilter: 'blur(10px)'
  };

  const formStyle = {
    background: 'rgba(255,255,255,0.95)',
    padding: '30px',
    borderRadius: '16px',
    marginBottom: '30px',
    backdropFilter: 'blur(15px)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
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

  const textareaStyle = {
    ...inputStyle,
    minHeight: '80px',
    resize: 'vertical'
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
    backgroundColor: 'fff',
    boxSizing: 'border-box',
    outline: 'none',
    height: '44px',
    lineHeight: '20px',
    verticalAlign: 'top',
    appearance: 'none'
  };

  const buttonStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 25px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    marginRight: '10px'
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)'
  };

  const clientCardStyle = {
    background: 'white',
    border: '2px solid #f8f9fa',
    borderRadius: '12px',
    padding: '25px',
    marginBottom: '20px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease'
  };

  const searchStyle = {
    background: 'rgba(255,255,255,0.9)',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '30px',
    backdropFilter: 'blur(10px)'
  };

  return (
    <div style={containerStyle}>
      <Navigation user={user} />
      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', paddingTop: '100px' }}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: 'bold' }}>
            👥 Client Management
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
            Hello {userData?.firstName || user?.email?.split('@')[0]}! Manage your clients and their information here.
          </p>
        </div>

        {/* Statistics */}
        <div style={statsStyle}>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Total Clients</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
              {clients.length}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Active Clients</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
              {clients.length}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Contacts</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
              {clients.filter(c => c.email).length}
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={searchStyle}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>🔍 Search Clients</h3>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Add/Edit Client Form */}
        <div style={formStyle}>
          <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '1.5rem' }}>
            {editingId ? '✏️ Edit Client' : '➕ Add New Client'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                Client Name *
              </label>
              <input
                placeholder="Enter client name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
              />

              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                Email Address *
              </label>
              <input
                placeholder="client@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />

              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                Phone Number
              </label>
              <input
                placeholder="+44 7123 456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                Address
              </label>
              <textarea
                placeholder="Client's full address..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={textareaStyle}
              />

              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                Notes
              </label>
              <textarea
                placeholder="Additional notes about this client..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={textareaStyle}
              />
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button
              onClick={editingId ? updateClient : addClient}
              style={buttonStyle}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              {editingId ? '💾 Update Client' : '➕ Add Client'}
            </button>

            {editingId && (
              <button
                onClick={resetForm}
                style={cancelButtonStyle}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                ❌ Cancel
              </button>
            )}
          </div>
        </div>

        {/* Clients List */}
        <div style={{ background: 'rgba(255,255,255,0.9)', padding: '30px', borderRadius: '16px', backdropFilter: 'blur(15px)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '1.5rem' }}>
            📋 Your Clients ({filteredClients.length})
          </h3>

          {filteredClients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p style={{ fontSize: '1.2rem', margin: '0 0 10px 0' }}>
                {searchTerm ? 'No clients match your search.' : 'No clients yet.'}
              </p>
              <p style={{ margin: 0 }}>
                {!searchTerm && 'Add your first client using the form above!'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {filteredClients.map(client => (
                <div 
                  key={client.id} 
                  style={{
                    background: 'white',
                    border: '2px solid #f8f9fa',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Client Header - Always Visible */}
                  <div 
                    style={{
                      padding: '20px',
                      background: expandedClients[client.id] ? '#f8f9fa' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: expandedClients[client.id] ? '1px solid #e9ecef' : 'none'
                    }}
                    onClick={() => setExpandedClients(prev => ({
                      ...prev,
                      [client.id]: !prev[client.id]
                    }))}
                  >
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', fontSize: '1.3rem', color: '#333' }}>
                        {client.name}
                      </h4>
                      <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '0.9rem' }}>
                        📧 {client.email}
                      </p>
                      <p style={{ margin: 0, color: getClientTotalOwed(client.id) > 0 ? '#dc3545' : '#28a745', fontSize: '0.9rem', fontWeight: 'bold' }}>
                        💰 Total Owed: £{getClientTotalOwed(client.id).toFixed(2)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ 
                        background: '#e9ecef',
                        color: '#495057',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {getClientInvoices(client.id).length} invoices
                      </span>
                      <span style={{ 
                        fontSize: '1.2rem',
                        color: '#667eea',
                        transform: expandedClients[client.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }}>
                        ▼
                      </span>
                    </div>
                  </div>

                  {/* Client Details - Collapsible */}
                  {expandedClients[client.id] && (
                    <div style={{ padding: '20px', background: 'white' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', alignItems: 'start' }}>
                        <div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                            <div>
                              <p style={{ margin: '0 0 8px 0', color: '#666' }}>
                                <strong>📧 Email:</strong> {client.email}
                              </p>
                              {client.phone && (
                                <p style={{ margin: '0 0 8px 0', color: '#666' }}>
                                  <strong>📱 Phone:</strong> {client.phone}
                                </p>
                              )}
                            </div>

                            <div>
                              {client.address && (
                                <p style={{ margin: '0 0 8px 0', color: '#666' }}>
                                  <strong>📍 Address:</strong> {client.address}
                                </p>
                              )}
                              {client.notes && (
                                <p style={{ margin: '0 0 8px 0', color: '#666' }}>
                                  <strong>📝 Notes:</strong> {client.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '140px' }}>
                          <button
                            onClick={() => editClient(client)}
                            style={{
                              ...buttonStyle,
                              background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                              fontSize: '11px',
                              padding: '6px 12px',
                              marginRight: 0
                            }}
                            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => showClientHistory(client)}
                            style={{
                              ...buttonStyle,
                              background: 'linear-gradient(135deg, #6f42c1 0%, #6610f2 100%)',
                              fontSize: '11px',
                              padding: '6px 12px',
                              marginRight: 0
                            }}
                            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                          >
                            📋 History
                          </button>
                          <button
                            onClick={() => downloadClientStatement(client)}
                            style={{
                              ...buttonStyle,
                              background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                              fontSize: '11px',
                              padding: '6px 12px',
                              marginRight: 0
                            }}
                            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                          >
                            📄 Statement PDF
                          </button>
                          
                          <button
                            onClick={() => deleteClient(client.id)}
                            style={{
                              ...buttonStyle,
                              background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                              fontSize: '11px',
                              padding: '6px 12px',
                              marginRight: 0
                            }}
                            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Clients;