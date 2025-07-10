
import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase.js';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import jsPDF from 'jspdf';
import Navigation from './Navigation.js';

function Dashboard() {
  const [clientName, setClientName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [vat, setVat] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('Unpaid');
  const [notes, setNotes] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [template, setTemplate] = useState('standard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(1);
  const [companySettings, setCompanySettings] = useState({});

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    // Fetch invoices
    const invoicesQuery = query(collection(db, 'invoices'), where('userId', '==', user.uid));
    const invoicesSnapshot = await getDocs(invoicesQuery);
    const invoicesData = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setInvoices(invoicesData);

    // Calculate next invoice number
    const invoiceNumbers = invoicesData
      .map(inv => parseInt(inv.invoiceNumber?.replace('INV-', '') || '0'))
      .filter(num => !isNaN(num));
    const maxNumber = invoiceNumbers.length > 0 ? Math.max(...invoiceNumbers) : 0;
    setNextInvoiceNumber(maxNumber + 1);

    // Fetch products
    const productsQuery = query(collection(db, 'products'), where('userId', '==', user.uid));
    const productsSnapshot = await getDocs(productsQuery);
    const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setProducts(productsData);

    // Fetch clients
    const clientsQuery = query(collection(db, 'clients'), where('userId', '==', user.uid));
    const clientsSnapshot = await getDocs(clientsQuery);
    const clientsData = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setClients(clientsData);

    // Fetch company settings
    const companyQuery = query(collection(db, 'companySettings'), where('userId', '==', user.uid));
    const companySnapshot = await getDocs(companyQuery);
    if (!companySnapshot.empty) {
      const companyData = companySnapshot.docs[0].data();
      setCompanySettings(companyData);
    }
  };

  const handleAddInvoice = async () => {
    if (!clientName || !amount) return;

    const invoiceNumber = `INV-${String(nextInvoiceNumber).padStart(4, '0')}`;
    
    const newInvoice = {
      userId: user.uid,
      clientName,
      clientId: selectedClientId || null,
      amount: parseFloat(amount),
      vat: parseFloat(vat) || 0,
      dueDate,
      status,
      notes,
      template,
      productId: selectedProductId || null,
      createdAt: serverTimestamp(),
      invoiceNumber
    };

    const docRef = await addDoc(collection(db, 'invoices'), newInvoice);
    setInvoices(prev => [...prev, { ...newInvoice, id: docRef.id }]);
    setNextInvoiceNumber(prev => prev + 1);

    // Reset form
    resetForm();
  };

  const handleStatusChange = async (invoiceId, newStatus) => {
    await updateDoc(doc(db, 'invoices', invoiceId), { status: newStatus });
    setInvoices(prev => prev.map(inv => 
      inv.id === invoiceId ? { ...inv, status: newStatus } : inv
    ));
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      await deleteDoc(doc(db, 'invoices', id));
      setInvoices(prev => prev.filter(inv => inv.id !== id));
    }
  };

  const handleClientSelect = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setSelectedClientId(clientId);
      setClientName(client.name);
    } else {
      setSelectedClientId('');
      setClientName('');
    }
  };

  const handleProductSelect = (id) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    setSelectedProductId(id);
    setAmount(product.price || '');
    setVat(product.vat || '');
  };

  const resetForm = () => {
    setClientName('');
    setSelectedClientId('');
    setAmount('');
    setVat('');
    setDueDate('');
    setStatus('Unpaid');
    setNotes('');
    setSelectedProductId('');
  };

  const exportPDF = (invoice) => {
    const doc = new jsPDF();
    
    let currentY = 20;

    // Add company logo if available
    if (companySettings.logo) {
      try {
        doc.addImage(companySettings.logo, 'JPEG', 20, currentY, 40, 20);
        currentY += 25;
      } catch (error) {
        console.log('Error adding logo to PDF:', error);
      }
    }

    // Company information header
    if (companySettings.name) {
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text(companySettings.name, 20, currentY);
      currentY += 8;
    }

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    if (companySettings.address) {
      doc.text(companySettings.address, 20, currentY);
      currentY += 5;
    }
    if (companySettings.city) {
      doc.text(`${companySettings.city}, ${companySettings.postcode || ''}`, 20, currentY);
      currentY += 5;
    }
    if (companySettings.country) {
      doc.text(companySettings.country, 20, currentY);
      currentY += 5;
    }
    if (companySettings.email) {
      doc.text(`Email: ${companySettings.email}`, 20, currentY);
      currentY += 5;
    }
    if (companySettings.phone) {
      doc.text(`Phone: ${companySettings.phone}`, 20, currentY);
      currentY += 5;
    }
    if (companySettings.website) {
      doc.text(`Website: ${companySettings.website}`, 20, currentY);
      currentY += 5;
    }
    if (companySettings.vatNumber) {
      doc.text(`VAT: ${companySettings.vatNumber}`, 20, currentY);
      currentY += 5;
    }
    if (companySettings.companyNumber) {
      doc.text(`Company No: ${companySettings.companyNumber}`, 20, currentY);
      currentY += 5;
    }

    currentY += 10;

    // Invoice template styling
    if (template === 'professional') {
      // Professional template
      doc.setFillColor(41, 128, 185);
      doc.rect(0, currentY, 210, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text('INVOICE', 20, currentY + 10);
      doc.setTextColor(0, 0, 0);
      currentY += 20;
    } else {
      // Standard template
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('INVOICE', 20, currentY);
      currentY += 10;
    }

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, currentY);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, currentY + 10);
    doc.text(`Due Date: ${invoice.dueDate}`, 20, currentY + 20);
    
    currentY += 40;
    doc.setFont(undefined, 'bold');
    doc.text(`Bill To:`, 20, currentY);
    doc.setFont(undefined, 'normal');
    doc.text(`${invoice.clientName}`, 20, currentY + 10);
    
    currentY += 30;
    doc.text(`Amount: £${Number(invoice.amount).toFixed(2)}`, 20, currentY);
    doc.text(`VAT (${invoice.vat}%): £${(Number(invoice.amount) * Number(invoice.vat) / 100).toFixed(2)}`, 20, currentY + 10);
    doc.setFont(undefined, 'bold');
    doc.text(`Total: £${(Number(invoice.amount) + (Number(invoice.amount) * Number(invoice.vat) / 100)).toFixed(2)}`, 20, currentY + 20);
    doc.setFont(undefined, 'normal');
    doc.text(`Status: ${invoice.status}`, 20, currentY + 30);
    
    if (invoice.notes) {
      currentY += 50;
      doc.setFont(undefined, 'bold');
      doc.text(`Notes:`, 20, currentY);
      doc.setFont(undefined, 'normal');
      doc.text(`${invoice.notes}`, 20, currentY + 10);
    }

    doc.save(`${invoice.invoiceNumber}_${invoice.clientName}.pdf`);
  };

  // Filter invoices based on search and status
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <Navigation user={user} />
      <div style={{ padding: '30px', fontFamily: 'Arial' }}>
        <h2>Invoice Dashboard</h2>

        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: '#e3f2fd', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Total Invoices</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{invoices.length}</p>
          </div>
          <div style={{ background: '#e8f5e8', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Total Revenue</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
              £{invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0).toFixed(2)}
            </p>
          </div>
          <div style={{ background: '#fff3e0', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Unpaid</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
              £{invoices.filter(inv => inv.status === 'Unpaid').reduce((sum, inv) => sum + (inv.amount || 0), 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Create Invoice Form */}
        <div style={{ background: '#f8f9fa', padding: '20px', marginBottom: '30px', borderRadius: '8px' }}>
          <h3>Create New Invoice</h3>
          <p>Next Invoice Number: <strong>INV-{String(nextInvoiceNumber).padStart(4, '0')}</strong></p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div>
              <label>Select Client</label><br />
              <select
                value={selectedClientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                style={{ width: '100%', padding: '8px', margin: '5px 0' }}
              >
                <option value="">Select existing client or enter new</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.email})
                  </option>
                ))}
              </select>

              <label>Client Name</label><br />
              <input
                placeholder="Client Name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                style={{ width: '100%', padding: '8px', margin: '5px 0' }}
              /><br />

              <label>Select Product (Optional)</label><br />
              <select
                value={selectedProductId}
                onChange={(e) => handleProductSelect(e.target.value)}
                style={{ width: '100%', padding: '8px', margin: '5px 0' }}
              >
                <option value="">Select a product</option>
                {products.map(prod => (
                  <option key={prod.id} value={prod.id}>
                    {prod.name} - £{Number(prod.price).toFixed(2)}
                  </option>
                ))}
              </select><br />

              <label>Amount (£)</label><br />
              <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ width: '100%', padding: '8px', margin: '5px 0' }}
              /><br />
            </div>

            <div>
              <label>VAT (%)</label><br />
              <input
                type="number"
                placeholder="VAT"
                value={vat}
                onChange={(e) => setVat(e.target.value)}
                style={{ width: '100%', padding: '8px', margin: '5px 0' }}
              /><br />

              <label>Due Date</label><br />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{ width: '100%', padding: '8px', margin: '5px 0' }}
              /><br />

              <label>Status</label><br />
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                style={{ width: '100%', padding: '8px', margin: '5px 0' }}
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select><br />

              <label>Invoice Template</label><br />
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                style={{ width: '100%', padding: '8px', margin: '5px 0' }}
              >
                <option value="standard">Standard</option>
                <option value="professional">Professional</option>
              </select><br />
            </div>
          </div>

          <label>Notes</label><br />
          <textarea
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: '100%', padding: '8px', margin: '5px 0', height: '60px' }}
          /><br />

          <button 
            onClick={handleAddInvoice}
            style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Create Invoice
          </button>
        </div>

        {/* Invoice List with Filters */}
        <h3>Invoice Management</h3>
        
        <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
          <input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px', width: '300px' }}
          />
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '8px' }}
          >
            <option value="all">All Status</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        {filteredInvoices.length === 0 ? (
          <p>No invoices found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Invoice #</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Client</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Due Date</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px' }}>{inv.invoiceNumber}</td>
                    <td style={{ padding: '12px' }}>{inv.clientName}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>£{Number(inv.amount).toFixed(2)}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <select
                        value={inv.status}
                        onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                        style={{ 
                          padding: '4px 8px', 
                          background: inv.status === 'Paid' ? '#d4edda' : inv.status === 'Overdue' ? '#f8d7da' : '#fff3cd',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      >
                        <option value="Unpaid">Unpaid</option>
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{inv.dueDate}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => exportPDF(inv)}
                        style={{ 
                          padding: '4px 8px', 
                          background: '#28a745', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px', 
                          marginRight: '5px' 
                        }}
                      >
                        📄 PDF
                      </button>
                      <button
                        onClick={() => handleDelete(inv.id)}
                        style={{ 
                          padding: '4px 8px', 
                          background: '#dc3545', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px' 
                        }}
                      >
                        ❌
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
