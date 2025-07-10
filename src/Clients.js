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
  const [searchTerm, setSearchTerm] = useState('');

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

  // Styles
  const containerStyle = {
    minHeight: '100vh',
    background: isDarkMode ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    paddingTop: '70px'
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
    backgroundColor: '#fff',
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
    background: isDarkMode ? 'rgba(26,32,46,0.95)' : 'white',
    border: isDarkMode ? '2px solid #4a5568' : '2px solid #f8f9fa',
    borderRadius: '12px',
    padding: '25px',
    marginBottom: '20px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
    cursor: 'pointer',
    color: isDarkMode ? '#ffffff' : '#333333'
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
            <div style={{ display: 'grid', gap: '20px' }}>
              {filteredClients.map(client => (
                <div 
                  key={client.id} 
                  style={clientCardStyle}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 15px 35px rgba(102, 126, 234, 0.1)';
                    e.currentTarget.style.borderColor = '#667eea';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#f8f9fa';
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', alignItems: 'start' }}>
                    <div>
                      <h4 style={{ margin: '0 0 15px 0', fontSize: '1.3rem', color: '#333' }}>
                        {client.name}
                      </h4>

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

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '120px' }}>
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