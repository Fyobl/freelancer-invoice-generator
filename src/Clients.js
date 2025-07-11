
import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase.js';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import Navigation from './Navigation.js';
import { useDarkMode } from './DarkModeContext.js';

function Clients() {
  const { isDarkMode } = useDarkMode();
  const [clients, setClients] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [expandedClientId, setExpandedClientId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const user = auth.currentUser;

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const q = query(collection(db, 'clients'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setClients(data);
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
    setShowAddForm(false);
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
    setExpandedClientId(null);
  };

  const deleteClient = async (id) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      await deleteDoc(doc(db, 'clients', id));
      fetchClients();
      setExpandedClientId(null);
    }
  };

  const editClient = (client) => {
    setEditingId(client.id);
    setName(client.name);
    setEmail(client.email);
    setPhone(client.phone || '');
    setAddress(client.address || '');
    setNotes(client.notes || '');
    setExpandedClientId(client.id);
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setNotes('');
    setEditingId(null);
  };

  const toggleClientExpanded = (clientId) => {
    if (expandedClientId === clientId) {
      setExpandedClientId(null);
      resetForm();
    } else {
      setExpandedClientId(clientId);
      resetForm();
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Styles
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
    color: isDarkMode ? '#f1f5f9' : '#1e293b',
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
    background: isDarkMode 
      ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' 
      : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    padding: '20px',
    borderRadius: '12px',
    textAlign: 'center',
    color: isDarkMode ? '#f1f5f9' : '#1e293b',
    border: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0',
    boxShadow: isDarkMode 
      ? '0 8px 20px rgba(0,0,0,0.3)' 
      : '0 8px 20px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  };

  const formStyle = {
    background: isDarkMode 
      ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' 
      : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    padding: '30px',
    borderRadius: '16px',
    marginBottom: '30px',
    boxShadow: isDarkMode 
      ? '0 20px 40px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.3)' 
      : '0 20px 40px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.05)',
    color: isDarkMode ? '#f1f5f9' : '#1e293b',
    border: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 15px',
    border: isDarkMode ? '2px solid #475569' : '2px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '15px',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
    backgroundColor: isDarkMode ? '#334155' : '#ffffff',
    color: isDarkMode ? '#f1f5f9' : '#1e293b',
    boxSizing: 'border-box',
    outline: 'none',
    height: '44px',
    lineHeight: '20px',
    verticalAlign: 'top'
  };

  const textareaStyle = {
    ...inputStyle,
    minHeight: '80px',
    resize: 'vertical',
    lineHeight: '1.5'
  };

  const buttonStyle = {
    background: isDarkMode 
      ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 25px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginRight: '10px',
    boxShadow: isDarkMode 
      ? '0 4px 12px rgba(59, 130, 246, 0.4)' 
      : '0 4px 12px rgba(102, 126, 234, 0.4)'
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    background: isDarkMode 
      ? 'linear-gradient(135deg, #64748b 0%, #475569 100%)' 
      : 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)'
  };

  const clientListItemStyle = {
    background: isDarkMode 
      ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' 
      : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    border: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0',
    borderRadius: '12px',
    marginBottom: '15px',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    color: isDarkMode ? '#f1f5f9' : '#1e293b',
    overflow: 'hidden',
    boxShadow: isDarkMode 
      ? '0 4px 12px rgba(0,0,0,0.3)' 
      : '0 4px 12px rgba(0,0,0,0.1)'
  };

  const clientHeaderStyle = {
    padding: '20px 25px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: expandedClientId ? (isDarkMode ? '1px solid #4a5568' : '1px solid #e2e8f0') : 'none'
  };

  const clientDetailsStyle = {
    padding: '25px',
    borderTop: isDarkMode ? '1px solid #4a5568' : '1px solid #e2e8f0'
  };

  const searchStyle = {
    background: isDarkMode ? 'rgba(26,32,46,0.95)' : 'rgba(255,255,255,0.9)',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '30px',
    backdropFilter: 'blur(10px)',
    color: isDarkMode ? '#ffffff' : '#333333',
    border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : 'none'
  };

  return (
    <div style={containerStyle}>
      <Navigation user={user} />
      <div style={contentStyle}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '300' }}>
            👥 Client Management
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
            Manage your clients and build lasting relationships
          </p>
        </div>

        {/* Statistics */}
        <div style={statsStyle}>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Total Clients</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
              {clients.length}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Active Clients</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
              {clients.length}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Contacts</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
              {clients.filter(c => c.email).length}
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={searchStyle}>
          <h3 style={{ margin: '0 0 15px 0' }}>🔍 Search Clients</h3>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Add Client Button */}
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={buttonStyle}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            {showAddForm ? '❌ Cancel' : '➕ Add New Client'}
          </button>
        </div>

        {/* Add Client Form */}
        {showAddForm && (
          <div style={formStyle}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.5rem' }}>
              ➕ Add New Client
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: isDarkMode ? '#e5e7eb' : '#555' }}>
                  Client Name *
                </label>
                <input
                  placeholder="Enter client name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                />

                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: isDarkMode ? '#e5e7eb' : '#555' }}>
                  Email Address *
                </label>
                <input
                  placeholder="client@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                />

                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: isDarkMode ? '#e5e7eb' : '#555' }}>
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
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: isDarkMode ? '#e5e7eb' : '#555' }}>
                  Address
                </label>
                <textarea
                  placeholder="Client's full address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={textareaStyle}
                />

                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: isDarkMode ? '#e5e7eb' : '#555' }}>
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
                onClick={addClient}
                style={buttonStyle}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                💾 Add Client
              </button>
            </div>
          </div>
        )}

        {/* Clients List */}
        <div style={{ background: isDarkMode ? 'rgba(26,32,46,0.95)' : 'rgba(255,255,255,0.9)', padding: '30px', borderRadius: '16px', backdropFilter: 'blur(15px)', border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.5rem', color: isDarkMode ? '#ffffff' : '#333' }}>
            📋 Your Clients ({filteredClients.length})
          </h3>

          {filteredClients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: isDarkMode ? '#9ca3af' : '#666' }}>
              <p style={{ fontSize: '1.2rem', margin: '0 0 10px 0' }}>
                {searchTerm ? 'No clients match your search.' : 'No clients yet.'}
              </p>
              <p style={{ margin: 0 }}>
                {!searchTerm && 'Add your first client using the button above!'}
              </p>
            </div>
          ) : (
            <div>
              {filteredClients.map(client => (
                <div key={client.id} style={clientListItemStyle}>
                  {/* Client Header - Always Visible */}
                  <div 
                    style={clientHeaderStyle}
                    onClick={() => !editingId && toggleClientExpanded(client.id)}
                  >
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', fontSize: '1.3rem' }}>
                        {client.name}
                      </h4>
                      <p style={{ margin: 0, opacity: '0.7', fontSize: '0.9rem' }}>
                        {client.email}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <span style={{ fontSize: '1.2rem', opacity: '0.6' }}>
                        {expandedClientId === client.id ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>

                  {/* Client Details - Show when expanded */}
                  {expandedClientId === client.id && (
                    <div style={clientDetailsStyle}>
                      {editingId === client.id ? (
                        // Edit Form
                        <div>
                          <h4 style={{ margin: '0 0 20px 0', fontSize: '1.2rem' }}>
                            ✏️ Edit Client Details
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                            <div>
                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: isDarkMode ? '#e5e7eb' : '#555' }}>
                                Client Name *
                              </label>
                              <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={inputStyle}
                              />

                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: isDarkMode ? '#e5e7eb' : '#555' }}>
                                Email Address *
                              </label>
                              <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={inputStyle}
                              />

                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: isDarkMode ? '#e5e7eb' : '#555' }}>
                                Phone Number
                              </label>
                              <input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                style={inputStyle}
                              />
                            </div>

                            <div>
                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: isDarkMode ? '#e5e7eb' : '#555' }}>
                                Address
                              </label>
                              <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                style={textareaStyle}
                              />

                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: isDarkMode ? '#e5e7eb' : '#555' }}>
                                Notes
                              </label>
                              <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                style={textareaStyle}
                              />
                            </div>
                          </div>

                          <div style={{ marginTop: '20px' }}>
                            <button
                              onClick={updateClient}
                              style={buttonStyle}
                              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                            >
                              💾 Update Client
                            </button>
                            <button
                              onClick={() => {
                                resetForm();
                                setExpandedClientId(null);
                              }}
                              style={cancelButtonStyle}
                              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                            >
                              ❌ Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View Details
                        <div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                            <div>
                              <p style={{ margin: '0 0 10px 0', color: isDarkMode ? '#e5e7eb' : '#666' }}>
                                <strong>📧 Email:</strong> {client.email}
                              </p>
                              {client.phone && (
                                <p style={{ margin: '0 0 10px 0', color: isDarkMode ? '#e5e7eb' : '#666' }}>
                                  <strong>📱 Phone:</strong> {client.phone}
                                </p>
                              )}
                            </div>

                            <div>
                              {client.address && (
                                <p style={{ margin: '0 0 10px 0', color: isDarkMode ? '#e5e7eb' : '#666' }}>
                                  <strong>📍 Address:</strong> {client.address}
                                </p>
                              )}
                              {client.notes && (
                                <p style={{ margin: '0 0 10px 0', color: isDarkMode ? '#e5e7eb' : '#666' }}>
                                  <strong>📝 Notes:</strong> {client.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => editClient(client)}
                              style={{
                                ...buttonStyle,
                                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                fontSize: '12px',
                                padding: '8px 16px',
                                marginRight: 0
                              }}
                              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => deleteClient(client.id)}
                              style={{
                                ...buttonStyle,
                                background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                                fontSize: '12px',
                                padding: '8px 16px',
                                marginRight: 0
                              }}
                              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      )}
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
