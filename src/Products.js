import React, { useEffect, useState } from 'react';
import { db, auth } from './firebase.js';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  updateDoc
} from 'firebase/firestore';
import Navigation from './Navigation.js';
import { useDarkMode } from './DarkModeContext.js'; // Assuming DarkModeContext is in a separate file

function Products({ user }) {
  const { isDarkMode } = useDarkMode();
  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [vat, setVat] = useState('');
  const [description, setDescription] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

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
    fetchProducts();
  }, []);

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

  const pageStyle = {
    background: isDarkMode ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minHeight: '100vh',
    padding: '20px'
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    paddingTop: '70px'
  };

  const formStyle = {
    background: isDarkMode ? 'rgba(45,55,72,0.95)' : 'rgba(255,255,255,0.95)',
    padding: '30px',
    borderRadius: '16px',
    marginBottom: '30px',
    backdropFilter: 'blur(15px)',
    boxShadow: isDarkMode ? '0 20px 40px rgba(0,0,0,0.3)' : '0 20px 40px rgba(0,0,0,0.1)',
    color: isDarkMode ? '#ffffff' : '#333333'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 15px',
    border: isDarkMode ? '2px solid #4a5568' : '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '15px',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    fontFamily: 'inherit',
    backgroundColor: isDarkMode ? '#2d3748' : '#fff',
    color: isDarkMode ? '#ffffff' : '#333333',
    boxSizing: 'border-box',
    outline: 'none',
    height: '44px',
    lineHeight: '20px',
    verticalAlign: 'top'
  };

  const selectStyle = {
    width: '100%',
    padding: '12px 15px',
    border: isDarkMode ? '2px solid #4a5568' : '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '15px',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    fontFamily: 'inherit',
    backgroundColor: isDarkMode ? '#2d3748' : '#fff',
    color: isDarkMode ? '#ffffff' : '#333333',
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

  const productCardStyle = {
    background: isDarkMode ? 'rgba(26,32,46,0.95)' : 'white',
    border: isDarkMode ? '2px solid #4a5568' : '2px solid #f8f9fa',
    borderRadius: '12px',
    padding: '25px',
    marginBottom: '20px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
    cursor: 'pointer',
    color: isDarkMode ? '#ffffff' : '#333333'
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
    background: isDarkMode ? 'rgba(26,32,46,0.95)' : 'rgba(255,255,255,0.9)',
    padding: '20px',
    borderRadius: '12px',
    textAlign: 'center',
    backdropFilter: 'blur(10px)',
    color: isDarkMode ? '#ffffff' : '#333333',
    border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : 'none'
  };

  return (
    <div style={pageStyle}>
      <Navigation user={user} />
      <div style={containerStyle}>
        <div style={formStyle}>
          <h2>Products</h2>
          {/* Search and Filter */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <input
              style={inputStyle}
              placeholder="🔍 Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              style={selectStyle}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
              <option value="vat">Sort by VAT</option>
            </select>
          </div>

          {/* Product Form */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <input
              style={inputStyle}
              placeholder="Product Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              style={inputStyle}
              placeholder="Price £ *"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <input
              style={inputStyle}
              placeholder="VAT % (optional)"
              type="number"
              step="0.01"
              value={vat}
              onChange={(e) => setVat(e.target.value)}
            />
          </div>
          <textarea
            style={{...inputStyle, height: '80px', resize: 'vertical'}}
            placeholder="Product Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div style={{ marginTop: '20px' }}>
            {editingProduct ? (
              <div>
                <button
                  onClick={updateProduct}
                  style={{...buttonStyle, background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'}}
                >
                  ✅ Update Product
                </button>
                <button
                  onClick={cancelEdit}
                  style={{...buttonStyle, background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)'}}
                >
                  ❌ Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={addProduct}
                style={buttonStyle}
              >
                ➕ Add Product
              </button>
            )}
          </div>
        </div>

        {/* Product Statistics */}
        <div style={statsStyle}>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>📦 Total Products</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: isDarkMode ? 'white' : '#333' }}>
              {products.length}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#28a745' }}>💰 Avg Price</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: isDarkMode ? 'white' : '#333' }}>
              £{products.length > 0 ? (products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2) : '0.00'}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#dc3545' }}>📈 Highest Price</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: isDarkMode ? 'white' : '#333' }}>
              £{products.length > 0 ? Math.max(...products.map(p => p.price)).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>

        {/* Product List */}
        <div style={{
          background: isDarkMode ? 'rgba(40,40,40,0.95)' : 'rgba(255,255,255,0.95)',
          padding: '30px',
          borderRadius: '16px',
          backdropFilter: 'blur(15px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 25px 0', color: isDarkMode ? '#e2e8f0' : '#333' }}>
            📋 Product Catalog
          </h2>

          {filteredAndSortedProducts.length > 0 ? (
            <div style={{ display: 'grid', gap: '20px' }}>
              {filteredAndSortedProducts.map(product => (
                <div
                  key={product.id}
                  style={productCardStyle}
                  onMouseOver={(e) => {
                    Object.assign(e.currentTarget.style, productCardHoverStyle);
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    e.currentTarget.style.borderColor = isDarkMode ? '#4a5568' : '#f8f9fa';
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', alignItems: 'start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 10px 0', color: isDarkMode ? '#e2e8f0' : '#333', fontSize: '1.2rem' }}>
                        📦 {product.name}
                      </h3>
                      {product.description && (
                        <p style={{ margin: '0 0 15px 0', color: isDarkMode ? '#a0aec0' : '#666', lineHeight: '1.5' }}>
                          {product.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <span style={{ 
                          background: '#28a745', 
                          color: 'white', 
                          padding: '4px 12px', 
                          borderRadius: '20px', 
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}>
                          💰 £{product.price.toFixed(2)}
                        </span>
                        {product.vat > 0 && (
                          <span style={{ 
                            background: '#ffc107', 
                            color: '#212529', 
                            padding: '4px 12px', 
                            borderRadius: '20px', 
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}>
                            📊 {product.vat}% VAT
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => editProduct(product)}
                        style={{
                          ...buttonStyle,
                          background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                          padding: '8px 16px',
                          fontSize: '12px',
                          marginRight: '0'
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        style={{
                          ...buttonStyle,
                          background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                          padding: '8px 16px',
                          fontSize: '12px',
                          marginRight: '0'
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: isDarkMode ? '#a0aec0' : '#666' }}>
              <p style={{ fontSize: '18px', margin: 0 }}>📦 No products found</p>
              <p style={{ margin: '10px 0 0 0' }}>
                {searchTerm ? 'Try adjusting your search terms' : 'Add your first product to get started'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Products;