import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase.js';
import Navigation from './Navigation.js';
import jsPDF from 'jspdf';

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
  const [userData, setUserData] = useState(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  const user = auth.currentUser;

  // Styling objects
  const containerStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minHeight: '100vh',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  };

  const contentStyle = {
    padding: '30px',
    maxWidth: '1400px',
    margin: '0 auto',
    paddingTop: '100px'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '40px',
    color: 'white',
    padding: '20px 0'
  };

  const statsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '25px',
    marginBottom: '40px'
  };

  const statCardStyle = {
    background: 'rgba(255,255,255,0.95)',
    padding: '30px',
    borderRadius: '16px',
    textAlign: 'center',
    backdropFilter: 'blur(15px)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    border: '2px solid rgba(255,255,255,0.2)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
  };

  const formStyle = {
    background: 'rgba(255,255,255,0.95)',
    padding: '40px',
    borderRadius: '20px',
    marginBottom: '40px',
    backdropFilter: 'blur(15px)',
    boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
    border: '2px solid rgba(255,255,255,0.2)'
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
    padding: '15px 30px',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
  };

  const tableStyle = {
    background: 'rgba(255,255,255,0.95)',
    borderRadius: '20px',
    overflow: 'hidden',
    backdropFilter: 'blur(15px)',
    boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
    border: '2px solid rgba(255,255,255,0.2)'
  };

  const searchFilterStyle = {
    background: 'rgba(255,255,255,0.9)',
    padding: '25px',
    borderRadius: '16px',
    marginBottom: '30px',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 15px 30px rgba(0,0,0,0.1)',
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
    flexWrap: 'wrap'
  };

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

  useEffect(() => {
    if (user) {
      fetchInvoices();
      fetchProducts();
      fetchClients();
      fetchCompanySettings();
      fetchUserData();
    }
  }, [user]);

  const fetchInvoices = async () => {
    if (!user) return;

    try {
      const q = query(collection(db, 'invoices'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      const invoiceList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setInvoices(invoiceList);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      console.log('This is likely due to Firestore security rules requiring authentication');
    }
  };

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
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = 20;

    // Professional header with gradient-like effect
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Company logo on left side of header
    if (companySettings.logo) {
      try {
        doc.addImage(companySettings.logo, 'JPEG', 15, 8, 30, 15);
      } catch (error) {
        console.log('Error adding logo to PDF:', error);
      }
    }

    // Company branding section
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    const invoiceTextX = companySettings.logo ? 55 : 20;
    doc.text('INVOICE', invoiceTextX, 25);

    // Company details on right side of header
    if (companySettings.name || companySettings.companyName) {
      doc.setFontSize(12);
      doc.text(companySettings.name || companySettings.companyName, pageWidth - 20, 15, { align: 'right' });
    }
    if (companySettings.address) {
      doc.setFontSize(10);
      doc.text(companySettings.address, pageWidth - 20, 25, { align: 'right' });
    }
    if (companySettings.email) {
      doc.text(companySettings.email, pageWidth - 20, 32, { align: 'right' });
    }

    currentY = 60;
    doc.setTextColor(0, 0, 0);

    // Invoice details section with clean layout
    doc.setFillColor(248, 249, 250);
    doc.rect(20, currentY, pageWidth - 40, 35, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(20, currentY, pageWidth - 40, 35);

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Invoice Details', 25, currentY + 12);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);

    // Left column
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 25, currentY + 22);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 25, currentY + 30);

    // Right column
    doc.text(`Due Date: ${invoice.dueDate}`, pageWidth - 120, currentY + 22);
    doc.text(`Status: ${invoice.status}`, pageWidth - 120, currentY + 30);

    currentY += 55;

    // Bill To section
    doc.setFillColor(248, 249, 250);
    doc.rect(20, currentY, pageWidth - 40, 25, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(20, currentY, pageWidth - 40, 25);

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Bill To:', 25, currentY + 12);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(invoice.clientName, 25, currentY + 20);

    currentY += 45;

    // Items/Services table header
    doc.setFillColor(41, 128, 185);
    doc.rect(20, currentY, pageWidth - 40, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Description', 25, currentY + 10);
    doc.text('Amount', pageWidth - 60, currentY + 10, { align: 'right' });

    currentY += 15;
    doc.setTextColor(0, 0, 0);

    // Service/product line
    doc.setFillColor(255, 255, 255);
    doc.rect(20, currentY, pageWidth - 40, 15, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(20, currentY, pageWidth - 40, 15);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(invoice.productName || 'Service', 25, currentY + 10);
    doc.text(`£${Number(invoice.amount).toFixed(2)}`, pageWidth - 60, currentY + 10, { align: 'right' });

    currentY += 35;

    // Financial summary section
    const summaryStartY = currentY;
    const summaryWidth = 100;
    const summaryX = pageWidth - 120;

    doc.setFillColor(248, 249, 250);
    doc.rect(summaryX, summaryStartY, summaryWidth, 45, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(summaryX, summaryStartY, summaryWidth, 45);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    // Subtotal
    doc.text('Subtotal:', summaryX + 5, summaryStartY + 10);
    doc.text(`£${Number(invoice.amount).toFixed(2)}`, summaryX + summaryWidth - 5, summaryStartY + 10, { align: 'right' });

    // VAT
    const vatAmount = Number(invoice.amount) * Number(invoice.vat) / 100;
    doc.text(`VAT (${invoice.vat}%):`, summaryX + 5, summaryStartY + 20);
    doc.text(`£${vatAmount.toFixed(2)}`, summaryX + summaryWidth - 5, summaryStartY + 20, { align: 'right' });

    // Total line
    doc.setDrawColor(41, 128, 185);
    doc.line(summaryX + 5, summaryStartY + 25, summaryX + summaryWidth - 5, summaryStartY + 25);

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    const totalAmount = Number(invoice.amount) + vatAmount;
    doc.text('Total:', summaryX + 5, summaryStartY + 35);
    doc.text(`£${totalAmount.toFixed(2)}`, summaryX + summaryWidth - 5, summaryStartY + 35, { align: 'right' });

    currentY += 65;

    // Notes section
    if (invoice.notes) {
      doc.setFillColor(248, 249, 250);
      doc.rect(20, currentY, pageWidth - 40, 30, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(20, currentY, pageWidth - 40, 30);

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Notes:', 25, currentY + 12);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);

      // Split notes into lines if too long
      const noteLines = doc.splitTextToSize(invoice.notes, pageWidth - 50);
      doc.text(noteLines, 25, currentY + 22);

      currentY += 40;
    }

    // Payment terms section
    if (companySettings.paymentTerms) {
      currentY += 10;
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Payment Terms:', 20, currentY);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      const termsLines = doc.splitTextToSize(companySettings.paymentTerms, pageWidth - 40);
      doc.text(termsLines, 20, currentY + 10);
      currentY += 10 + (termsLines.length * 5);
    }

    // Footer with company registration details
    const footerY = pageHeight - 30;
    doc.setDrawColor(41, 128, 185);
    doc.line(20, footerY, pageWidth - 20, footerY);

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);

    let footerText = [];
    if (companySettings.companyNumber) {
      footerText.push(`Company Registration: ${companySettings.companyNumber}`);
    }
    if (companySettings.vatNumber) {
      footerText.push(`VAT Number: ${companySettings.vatNumber}`);
    }

    if (footerText.length > 0) {
      doc.text(footerText.join(' | '), pageWidth / 2, footerY + 10, { align: 'center' });
    }

    // Thank you message
    doc.setTextColor(41, 128, 185);
    doc.setFontSize(10);
    doc.setFont(undefined, 'italic');
    doc.text('Thank you for your business!', pageWidth / 2, footerY + 20, { align: 'center' });

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
    <div style={containerStyle}>
      <Navigation user={user} userData={userData}/>
      <div style={contentStyle}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '300' }}>
            📊 Dashboard
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
            Welcome back, {userData?.firstName || user?.email?.split('@')[0]}! Here's your business overview.
          </p>
        </div>

        {/* Statistics Cards */}
        <div style={statsStyle}>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#667eea', fontSize: '1.1rem' }}>Total Invoices</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
              {invoices.length}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#667eea', fontSize: '1.1rem' }}>Total Revenue</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
              £{invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0).toFixed(2)}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#667eea', fontSize: '1.1rem' }}>Outstanding</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
              £{invoices.filter(inv => inv.status === 'Unpaid').reduce((sum, inv) => sum + (inv.amount || 0), 0).toFixed(2)}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 15px 0', color: '#667eea', fontSize: '1.1rem' }}>This Month</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
              £{invoices.filter(inv => {
                const invoiceDate = new Date(inv.createdAt?.seconds * 1000);
                const currentMonth = new Date().getMonth();
                return invoiceDate.getMonth() === currentMonth;
              }).reduce((sum, inv) => sum + (inv.amount || 0), 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Create Invoice Form */}
        <div style={formStyle}>
          <h2 style={{ marginTop: 0, color: '#333', fontSize: '1.8rem', marginBottom: '10px' }}>
            ✨ Create New Invoice
          </h2>
          <p style={{ color: '#666', marginBottom: '30px', fontSize: '1.1rem' }}>
            Next Invoice Number: <strong style={{ color: '#667eea' }}>INV-{String(nextInvoiceNumber).padStart(4, '0')}</strong>
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
                Select Client
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                style={selectStyle}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
              >
                <option value="">Select existing client or enter new</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.email})
                  </option>
                ))}
              </select>

              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
                Client Name *
              </label>
              <input
                placeholder="Enter client name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
              />

              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
                Select Product (Optional)
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductSelect(e.target.value)}
                style={selectStyle}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
              >
                <option value="">Select a product</option>
                {products.map(prod => (
                  <option key={prod.id} value={prod.id}>
                    {prod.name} - £{Number(prod.price).toFixed(2)}
                  </option>
                ))}
              </select>

              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
                Amount (£) *
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
                VAT (%)
              </label>
              <input
                type="number"
                placeholder="VAT percentage"
                value={vat}
                onChange={(e) => setVat(e.target.value)}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
              />

              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
              />

              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
                Status
              </label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                style={selectStyle}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>

              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
                Invoice Template
              </label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                style={selectStyle}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
              >
                <option value="standard">Standard</option>
                <option value="professional">Professional</option>
              </select>
            </div>
          </div>

          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555', marginTop: '20px' }}>
            Notes
          </label>
          <textarea
            placeholder="Add any additional notes or terms..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
          />

          <button 
            onClick={handleAddInvoice}
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 12px 25px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
            }}
          >
            🚀 Create Invoice
          </button>
        </div>

        {/* Search and Filter Section */}
        <div style={searchFilterStyle}>
          <h2 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '1.6rem', width: '100%' }}>
            📋 Invoice Management
          </h2>

          <input
            placeholder="🔍 Search invoices by client or number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, marginBottom: 0, minWidth: '300px', flex: 1 }}
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ ...selectStyle, marginBottom: 0, minWidth: '150px' }}
          >
            <option value="all">All Status</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        {/* Invoice Table */}
        {filteredInvoices.length === 0 ? (
          <div style={{ ...formStyle, textAlign: 'center', padding: '60px' }}>
            <h3 style={{ color: '#666', fontSize: '1.4rem', marginBottom: '15px' }}>
              📄 No invoices found
            </h3>
            <p style={{ color: '#999', fontSize: '1.1rem' }}>
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Create your first invoice to get started!'}
            </p>
          </div>
        ) : (<div style={tableStyle}>
            <div style={{ padding: '25px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                      <th style={{ padding: '15px', textAlign: 'left', color: 'white', fontWeight: 'bold' }}>Invoice #</th>
                      <th style={{ padding: '15px', textAlign: 'left', color: 'white', fontWeight: 'bold' }}>Client</th>
                      <th style={{ padding: '15px', textAlign: 'right', color: 'white', fontWeight: 'bold' }}>Amount</th>
                      <th style={{ padding: '15px', textAlign: 'center', color: 'white', fontWeight: 'bold' }}>Status</th>
                      <th style={{ padding: '15px', textAlign: 'center', color: 'white', fontWeight: 'bold' }}>Due Date</th>
                      <th style={{ padding: '15px', textAlign: 'center', color: 'white', fontWeight: 'bold' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((inv, index) => (
                      <tr key={inv.id} style={{ 
                        borderBottom: '1px solid #f1f3f4',
                        backgroundColor: index % 2 === 0 ? '#fafbfc' : 'white',
                        transition: 'background-color 0.2s ease'
                      }}>
                        <td style={{ padding: '15px', fontWeight: 'bold', color: '#667eea' }}>{inv.invoiceNumber}</td>
                        <td style={{ padding: '15px', color: '#333' }}>{inv.clientName}</td>
                        <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: '#333' }}>
                          £{Number(inv.amount).toFixed(2)}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <select
                            value={inv.status}
                            onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                            style={{ 
                              padding: '6px 12px', 
                              background: inv.status === 'Paid' ? '#d4edda' : inv.status === 'Overdue' ? '#f8d7da' : '#fff3cd',
                              border: '2px solid',
                              borderColor: inv.status === 'Paid' ? '#c3e6cb' : inv.status === 'Overdue' ? '#f5c6cb' : '#ffeaa7',
                              borderRadius: '8px',
                              fontWeight: 'bold',
                              fontSize: '12px'
                            }}
                          >
                            <option value="Unpaid">Unpaid</option>
                            <option value="Paid">Paid</option>
                            <option value="Overdue">Overdue</option>
                          </select>
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center', color: '#666' }}>{inv.dueDate}</td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <button
                            onClick={() => exportPDF(inv)}
                            style={{ 
                              padding: '8px 15px', 
                              background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '6px', 
                              marginRight: '8px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            📄 PDF
                          </button>
                          <button
                            onClick={() => handleDelete(inv.id)}
                            style={{ 
                              padding: '8px 15px', 
                              background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;