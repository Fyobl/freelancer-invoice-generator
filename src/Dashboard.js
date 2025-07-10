import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase.js';
import { signOut } from 'firebase/auth';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import jsPDF from 'jspdf';

function Dashboard() {
  const [clientName, setClientName] = useState('');
  const [amount, setAmount] = useState('');
  const [vat, setVat] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('Unpaid');
  const [notes, setNotes] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const fetchInvoices = async () => {
      const q = query(collection(db, 'invoices'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvoices(docs);
    };

    const fetchProducts = async () => {
      const q = query(collection(db, 'products'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(docs);
    };

    fetchInvoices();
    fetchProducts();
  }, [user]);

  const handleAddInvoice = async () => {
    if (!clientName || !amount) return;

    const newInvoice = {
      userId: user.uid,
      clientName,
      amount: parseFloat(amount),
      vat: parseFloat(vat),
      dueDate,
      status,
      notes,
      createdAt: serverTimestamp(),
      invoiceNumber: 'INV-' + Date.now().toString().slice(-6)
    };

    const docRef = await addDoc(collection(db, 'invoices'), newInvoice);
    setInvoices(prev => [...prev, { ...newInvoice, id: docRef.id }]);

    // Reset form
    setClientName('');
    setAmount('');
    setVat('');
    setDueDate('');
    setStatus('Unpaid');
    setNotes('');
    setSelectedProductId('');
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'invoices', id));
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const handleProductSelect = (id) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    setSelectedProductId(id);
    setAmount(product.price || '');
    setVat(product.vat || '');
  };

  const exportPDF = (invoice) => {
    const doc = new jsPDF();
    doc.text('Invoice', 10, 10);
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 10, 20);
    doc.text(`Client: ${invoice.clientName}`, 10, 30);
    doc.text(`Amount: £${Number(invoice.amount).toFixed(2)}`, 10, 40);
    doc.text(`VAT: ${invoice.vat}%`, 10, 50);
    doc.text(`Due Date: ${invoice.dueDate}`, 10, 60);
    doc.text(`Status: ${invoice.status}`, 10, 70);
    doc.text(`Notes: ${invoice.notes}`, 10, 80);
    doc.save(`${invoice.clientName}_invoice.pdf`);
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial' }}>
      <h2>Welcome, {user?.email}</h2>
      <button onClick={handleLogout}>Logout</button>
      <hr />

      <h3>Create Invoice</h3>

      <label>Client Name</label><br />
      <input
        placeholder="Client Name"
        value={clientName}
        onChange={(e) => setClientName(e.target.value)}
      /><br /><br />

      <label>Select Product</label><br />
      <select
        value={selectedProductId}
        onChange={(e) => handleProductSelect(e.target.value)}
      >
        <option value="">Select a product</option>
        {products.map(prod => (
          <option key={prod.id} value={prod.id}>
            {prod.name} - £{Number(prod.price).toFixed(2)}
          </option>
        ))}
      </select><br /><br />

      <label>Amount (£)</label><br />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      /><br /><br />

      <label>VAT (%)</label><br />
      <input
        type="number"
        placeholder="VAT"
        value={vat}
        onChange={(e) => setVat(e.target.value)}
      /><br /><br />

      <label>Due Date</label><br />
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      /><br /><br />

      <label>Status</label><br />
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="Unpaid">Unpaid</option>
        <option value="Paid">Paid</option>
        <option value="Overdue">Overdue</option>
      </select><br /><br />

      <label>Notes</label><br />
      <textarea
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      /><br /><br />

      <button onClick={handleAddInvoice}>Add Invoice</button>

      <hr />
      <h3>Invoices</h3>

      {invoices.length === 0 ? (
        <p>No invoices yet.</p>
      ) : (
        <ul>
          {invoices.map(inv => (
            <li key={inv.id} style={{ marginBottom: '12px' }}>
              <strong>{inv.clientName}</strong> (#{inv.invoiceNumber}) - £{Number(inv.amount).toFixed(2)}<br />
              Status: {inv.status} | Due: {inv.dueDate}<br />
              {inv.notes && <span>{inv.notes}<br /></span>}
              <button
                onClick={() => handleDelete(inv.id)}
                style={{ background: 'red', color: 'white', border: 'none', padding: '4px 10px', marginTop: '4px' }}
              >
                ❌ Delete
              </button>
              <button
                onClick={() => exportPDF(inv)}
                style={{ marginLeft: '10px', padding: '4px 10px' }}
              >
                📄 Export PDF
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Dashboard;
