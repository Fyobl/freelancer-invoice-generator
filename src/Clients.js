
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

function Clients() {
  const [clients, setClients] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState(null);

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

  return (
    <div>
      <Navigation user={user} />
      <div style={{ padding: '30px', fontFamily: 'Arial' }}>
        <h2>Client Management</h2>

        <div style={{ background: '#f8f9fa', padding: '20px', marginBottom: '30px', borderRadius: '5px' }}>
          <h3>{editingId ? 'Edit Client' : 'Add New Client'}</h3>
          
          <input
            placeholder="Client Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: '8px', margin: '5px 0' }}
          />
          
          <input
            placeholder="Email *"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '8px', margin: '5px 0' }}
          />
          
          <input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ width: '100%', padding: '8px', margin: '5px 0' }}
          />
          
          <textarea
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={{ width: '100%', padding: '8px', margin: '5px 0', height: '60px' }}
          />
          
          <textarea
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: '100%', padding: '8px', margin: '5px 0', height: '60px' }}
          />
          
          <div>
            <button
              onClick={editingId ? updateClient : addClient}
              style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', marginRight: '10px' }}
            >
              {editingId ? 'Update Client' : 'Add Client'}
            </button>
            
            {editingId && (
              <button
                onClick={resetForm}
                style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none' }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <h3>Your Clients ({clients.length})</h3>
        
        {clients.length === 0 ? (
          <p>No clients yet. Add your first client above!</p>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {clients.map(client => (
              <div key={client.id} style={{ 
                background: 'white', 
                border: '1px solid #ddd', 
                padding: '20px', 
                borderRadius: '5px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <h4 style={{ margin: '0 0 10px 0' }}>{client.name}</h4>
                <p><strong>Email:</strong> {client.email}</p>
                {client.phone && <p><strong>Phone:</strong> {client.phone}</p>}
                {client.address && <p><strong>Address:</strong> {client.address}</p>}
                {client.notes && <p><strong>Notes:</strong> {client.notes}</p>}
                
                <div style={{ marginTop: '15px' }}>
                  <button
                    onClick={() => editClient(client)}
                    style={{ padding: '5px 10px', background: '#28a745', color: 'white', border: 'none', marginRight: '10px' }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => deleteClient(client.id)}
                    style={{ padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none' }}
                  >
                    ❌ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Clients;
