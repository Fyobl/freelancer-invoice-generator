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
  serverTimestamp
} from 'firebase/firestore';
function Clients({ user }) {
  const isDarkMode = false;
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const fetchClients = async () => {
    if (!user) return;

    try {
      const q = query(collection(db, 'clients'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const addClient = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addDoc(collection(db, 'clients'), {
        ...formData,
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: ''
      });
      setShowModal(false);
      fetchClients();
    } catch (error) {
      console.error('Error adding client:', error);
    }
  };

  const deleteClient = async (id) => {
    try {
      await deleteDoc(doc(db, 'clients', id));
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    padding: '25px',
    borderRadius: '16px',
    textAlign: 'center',
    boxShadow: isDarkMode 
      ? '0 20px 40px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.3)' 
      : '0 20px 40px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.05)',
    border: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0'
  };

  const searchStyle = {
    background: isDarkMode 
      ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' 
      : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    padding: '25px',
    borderRadius: '16px',
    marginBottom: '30px',
    boxShadow: isDarkMode 
      ? '0 20px 40px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.3)' 
      : '0 20px 40px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.05)',
    border: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: isDarkMode ? '1px solid #475569' : '1px solid #cbd5e1',
    background: isDarkMode ? '#374151' : '#ffffff',
    color: isDarkMode ? '#f1f5f9' : '#1e293b',
    fontSize: '16px'
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

  const clientsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '25px',
    marginTop: '30px'
  };

  const clientCardStyle = {
    background: isDarkMode 
      ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' 
      : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    padding: '25px',
    borderRadius: '16px',
    boxShadow: isDarkMode 
      ? '0 20px 40px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.3)' 
      : '0 20px 40px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.05)',
    border: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0',
    transition: 'transform 0.2s ease'
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

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={contentStyle}>
          <div style={headerStyle}>
            <h1 style={{ fontSize: '2.5rem', margin: 0 }}>👥 Loading Clients...</h1>
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
            👥 Client Management
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
            Manage your client relationships and contact information
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

        <button style={buttonStyle} onClick={() => setShowModal(true)}>
          ➕ Add New Client
        </button>

        {/* Clients Grid */}
        <div style={clientsGridStyle}>
          {filteredClients.map((client) => (
            <div key={client.id} style={clientCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: '#667eea', fontSize: '1.3rem' }}>
                  {client.name}
                </h3>
                <button
                  onClick={() => deleteClient(client.id)}
                  style={{
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Delete
                </button>
              </div>

              <div>
                {client.email && (
                  <p style={{ margin: '0 0 10px 0', color: isDarkMode ? '#e5e7eb' : '#666' }}>
                    <strong>📧 Email:</strong> {client.email}
                  </p>
                )}
                {client.phone && (
                  <p style={{ margin: '0 0 10px 0', color: isDarkMode ? '#e5e7eb' : '#666' }}>
                    <strong>📞 Phone:</strong> {client.phone}
                  </p>
                )}
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
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: isDarkMode ? '#9ca3af' : '#666' }}>
            <h3>No clients found</h3>
            <p>Add your first client to get started!</p>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div style={modalStyle}>
            <div style={modalContentStyle}>
              <h2 style={{ marginTop: 0 }}>Add New Client</h2>
              <form onSubmit={addClient}>
                <input
                  type="text"
                  placeholder="Client Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{ ...inputStyle, marginBottom: '15px' }}
                  required
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={{ ...inputStyle, marginBottom: '15px' }}
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  style={{ ...inputStyle, marginBottom: '15px' }}
                />
                <textarea
                  placeholder="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  style={{ ...inputStyle, marginBottom: '15px', minHeight: '80px' }}
                />
                <textarea
                  placeholder="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  style={{ ...inputStyle, marginBottom: '15px', minHeight: '80px' }}
                />
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button type="submit" style={buttonStyle}>
                    Add Client
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

export default Clients;