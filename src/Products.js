import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { db, auth } from './firebase.js';
import Navigation from './Navigation.js';

function Products({ user }) {
  const [products, setProducts] = useState([]);
  const [userData, setUserData] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [vat, setVat] = useState('');
  const [description, setDescription] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [expandedProducts, setExpandedProducts] = useState({});

  const fetchProducts = async () => {
    const q = query(collection(db, 'products'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setProducts(data);
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchUserData();
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

  const addProduct = async () => {
    if (!name.trim() || !price.trim()) {
      alert("Please fill in product name and price");
      return;
    }

    const parsedPrice = parseFloat(price);
    const parsedVat = parseFloat(vat) || 0;

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      alert("Price must be a valid positive number");
      return;
    }

    if (parsedVat < 0 || parsedVat > 100) {
      alert("VAT must be between 0 and 100%");
      return;
    }

    await addDoc(collection(db, 'products'), {
      name: name.trim(),
      price: parsedPrice,
      vat: parsedVat,
      description: description.trim(),
      userId: user.uid,
      createdAt: new Date()
    });

    setName('');
    setPrice('');
    setVat('');
    setDescription('');
    fetchProducts();
  };

  const updateProduct = async () => {
    if (!name.trim() || !price.trim()) {
      alert("Please fill in product name and price");
      return;
    }

    const parsedPrice = parseFloat(price);
    const parsedVat = parseFloat(vat) || 0;

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      alert("Price must be a valid positive number");
      return;
    }

    await updateDoc(doc(db, 'products', editingProduct.id), {
      name: name.trim(),
      price: parsedPrice,
      vat: parsedVat,
      description: description.trim()
    });

    setEditingProduct(null);
    setName('');
    setPrice('');
    setVat('');
    setDescription('');
    fetchProducts();
  };

  const deleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await deleteDoc(doc(db, 'products', id));
      fetchProducts();
    }
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    setVat(product.vat.toString());
    setDescription(product.description || '');
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setVat('');
    setDescription('');
  };

  const filteredAndSortedProducts = products
    .filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price') return b.price - a.price;
      if (sortBy === 'vat') return b.vat - a.vat;
      return 0;
    });

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: 'Arial, sans-serif'
  };

  const contentStyle = {
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '40px',
    color: 'white'
  };

  const cardStyle = {
    background: 'white',
    borderRadius: '15px',
    padding: '30px',
    marginBottom: '30px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    border: 'none'
  };

  const inputStyle = {
    width: '100%',
    padding: '15px 18px',
    border: '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '16px',
    marginBottom: '15px',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
    height: '52px',
    lineHeight: '20px',
    verticalAlign: 'top',
    display: 'block'
  };

  const selectStyle = {
    width: '100%',
    padding: '15px 18px',
    border: '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '16px',
    marginBottom: '15px',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
    height: '52px',
    lineHeight: '20px',
    verticalAlign: 'top',
    appearance: 'none',
    display: 'block'
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

  const productCardStyle = {
    background: 'white',
    border: '2px solid #f8f9fa',
    borderRadius: '12px',
    padding: '25px',
    marginBottom: '20px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
    cursor: 'pointer'
  };

  const productCardHoverStyle = {
    transform: 'translateY(-5px)',
    boxShadow: '0 15px 35px rgba(102, 126, 234, 0.1)',
    borderColor: '#667eea'
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

  return (
    <div style={containerStyle}>
      <Navigation user={user} />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', paddingTop: '100px' }}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: 'bold' }}>
            📦 Product Management
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
            Hello {userData?.firstName || user?.email?.split('@')[0]}! Manage your products and services efficiently
          </p>
        </div>

        {/* Statistics */}
        <div style={statsStyle}>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Total Products</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
              {products.length}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Average Price</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
              £{products.length > 0 ? (products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2) : '0.00'}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Highest Price</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
              £{products.length > 0 ? Math.max(...products.map(p => p.price)).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>

        {/* Add/Edit Product Form */}
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, color: '#333', fontSize: '1.5rem' }}>
            {editingProduct ? '✏️ Edit Product' : '➕ Add New Product'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                Product Name *
              </label>
              <input
                style={inputStyle}
                placeholder="Enter product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                Price (£) *
              </label>
              <input
                style={inputStyle}
                placeholder="0.00"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                VAT (%)
              </label>
              <input
                style={inputStyle}
                placeholder="20"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={vat}
                onChange={(e) => setVat(e.target.value)}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
              />
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
              Description
            </label>
            <textarea
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              placeholder="Product description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
          </div>

          <div style={{ marginTop: '25px' }}>
            {editingProduct ? (
              <>
                <button
                  style={buttonStyle}
                  onClick={updateProduct}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  💾 Update Product
                </button>
                <button
                  style={{ ...buttonStyle, background: '#6c757d' }}
                  onClick={cancelEdit}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  ❌ Cancel
                </button>
              </>
            ) : (
              <button
                style={buttonStyle}
                onClick={addProduct}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                ➕ Add Product
              </button>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div style={cardStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                🔍 Search Products
              </label>
              <input
                style={inputStyle}
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                🔄 Sort By
              </label>
              <select
                style={selectStyle}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
              >
                <option value="name">Name (A-Z)</option>
                <option value="price">Price (High to Low)</option>
                <option value="vat">VAT (High to Low)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products List */}
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, color: '#333', fontSize: '1.5rem' }}>
            📋 Your Products ({filteredAndSortedProducts.length})
          </h2>

          {filteredAndSortedProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📦</div>
              <h3>No products found</h3>
              <p>{searchTerm ? 'Try adjusting your search terms' : 'Add your first product to get started!'}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {filteredAndSortedProducts.map(product => (
                <div
                  key={product.id}
                  style={{
                    background: 'white',
                    border: '2px solid #f8f9fa',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Product Header - Always Visible */}
                  <div 
                    style={{
                      padding: '20px',
                      background: expandedProducts[product.id] ? '#f8f9fa' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: expandedProducts[product.id] ? '1px solid #e9ecef' : 'none'
                    }}
                    onClick={() => setExpandedProducts(prev => ({
                      ...prev,
                      [product.id]: !prev[product.id]
                    }))}
                  >
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', fontSize: '1.3rem', color: '#333' }}>
                        {product.name}
                      </h4>
                      <p style={{ margin: 0, color: '#667eea', fontSize: '1.1rem', fontWeight: 'bold' }}>
                        £{product.price.toFixed(2)}
                        {product.vat > 0 && (
                          <span style={{ 
                            fontSize: '0.8rem',
                            color: '#666',
                            marginLeft: '8px'
                          }}>
                            (+{product.vat}% VAT)
                          </span>
                        )}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {product.vat > 0 && (
                        <span style={{ 
                          background: '#e9ecef',
                          color: '#495057',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          VAT: {product.vat}%
                        </span>
                      )}
                      <span style={{ 
                        fontSize: '1.2rem',
                        color: '#667eea',
                        transform: expandedProducts[product.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }}>
                        ▼
                      </span>
                    </div>
                  </div>

                  {/* Product Details - Collapsible */}
                  {expandedProducts[product.id] && (
                    <div style={{ padding: '20px', background: 'white' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>
                                £{product.price.toFixed(2)}
                              </span>
                              {product.vat > 0 && (
                                <span style={{ 
                                  background: '#e9ecef', 
                                  padding: '4px 8px', 
                                  borderRadius: '12px', 
                                  fontSize: '12px',
                                  color: '#495057',
                                  fontWeight: 'bold'
                                }}>
                                  VAT: {product.vat}%
                                </span>
                              )}
                            </div>

                            {product.vat > 0 && (
                              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                <strong>Total with VAT: £{(product.price * (1 + product.vat / 100)).toFixed(2)}</strong>
                              </div>
                            )}
                          </div>

                          {product.description && (
                            <p style={{ 
                              margin: 0, 
                              color: '#666', 
                              fontSize: '0.9rem', 
                              lineHeight: '1.4',
                              background: '#f8f9fa',
                              padding: '10px',
                              borderRadius: '6px'
                            }}>
                              {product.description}
                            </p>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              editProduct(product);
                            }}
                            style={{
                              background: '#28a745',
                              color: 'white',
                              border: 'none',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteProduct(product.id);
                            }}
                            style={{
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
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

export default Products;