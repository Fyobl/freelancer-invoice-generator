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
import { useDarkMode } from './DarkModeContext.js';

function Products({ user }) {
  const { isDarkMode } = useDarkMode();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    vat: ''
  });
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = async () => {
    try {
      const q = query(collection(db, 'products'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const productList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productList);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const addProduct = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'products'), {
        ...newProduct,
        price: parseFloat(newProduct.price),
        vat: parseFloat(newProduct.vat),
        userId: user.uid
      });
      setNewProduct({ name: '', description: '', price: '', vat: '' });
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const updateProduct = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'products', editingProduct.id), {
        name: editingProduct.name,
        description: editingProduct.description,
        price: parseFloat(editingProduct.price),
        vat: parseFloat(editingProduct.vat)
      });
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const deleteProduct = async (id) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
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

  const totalProducts = products.length;
  const avgPrice = products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0;
  const highestPrice = products.length > 0 ? Math.max(...products.map(p => p.price)) : 0;

  // Styles
  const containerStyle = {
    minHeight: '100vh',
    background: isDarkMode 
      ? 'linear-gradient(135deg, #0f1419 0%, #1a202c 100%)' 
      : 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    paddingLeft: '20px',
    paddingRight: '20px',
    paddingTop: '100px',
    paddingBottom: '60px',
    color: isDarkMode ? '#e2e8f0' : '#2d3748'
  };

  const contentStyle = {
    maxWidth: '1400px',
    margin: '0 auto'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '50px',
    color: isDarkMode ? '#ffffff' : '#1a202c'
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '30px',
    marginBottom: '50px'
  };

  const statCardStyle = {
    background: isDarkMode 
      ? 'linear-gradient(145deg, #1a202c 0%, #2d3748 100%)' 
      : 'linear-gradient(145deg, #ffffff 0%, #f7fafc 100%)',
    padding: '35px 25px',
    borderRadius: '20px',
    textAlign: 'center',
    boxShadow: isDarkMode 
      ? '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)' 
      : '0 20px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
    border: isDarkMode ? '1px solid #4a5568' : '1px solid rgba(226, 232, 240, 0.5)',
    color: isDarkMode ? '#e2e8f0' : '#2d3748',
    transition: 'transform 0.3s ease'
  };

  const formContainerStyle = {
    background: isDarkMode 
      ? 'linear-gradient(145deg, #1a202c 0%, #2d3748 100%)' 
      : 'linear-gradient(145deg, #ffffff 0%, #f7fafc 100%)',
    padding: '50px',
    borderRadius: '24px',
    marginBottom: '50px',
    boxShadow: isDarkMode 
      ? '0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)' 
      : '0 25px 50px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)',
    border: isDarkMode ? '1px solid #4a5568' : '1px solid rgba(226, 232, 240, 0.5)',
    color: isDarkMode ? '#e2e8f0' : '#2d3748'
  };

  const searchAndFilterStyle = {
    background: isDarkMode 
      ? 'linear-gradient(145deg, #1a202c 0%, #2d3748 100%)' 
      : 'linear-gradient(145deg, #ffffff 0%, #f7fafc 100%)',
    padding: '30px',
    borderRadius: '20px',
    marginBottom: '40px',
    boxShadow: isDarkMode 
      ? '0 15px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' 
      : '0 15px 30px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
    border: isDarkMode ? '1px solid #4a5568' : '1px solid rgba(226, 232, 240, 0.5)',
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
    flexWrap: 'wrap'
  };

  const inputStyle = {
    padding: '16px 20px',
    border: isDarkMode ? '2px solid #4a5568' : '2px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
    backgroundColor: isDarkMode ? '#2d3748' : '#ffffff',
    color: isDarkMode ? '#e2e8f0' : '#2d3748',
    boxSizing: 'border-box',
    outline: 'none',
    flex: '1',
    minWidth: '250px'
  };

  const selectStyle = {
    ...inputStyle,
    appearance: 'none',
    backgroundImage: isDarkMode 
      ? 'url("data:image/svg+xml;charset=UTF-8,<svg xmlns=\'http://www.w3.org/2000/svg\' fill=\'%23e2e8f0\' viewBox=\'0 0 20 20\'><path d=\'M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z\'/></svg>")' 
      : 'url("data:image/svg+xml;charset=UTF-8,<svg xmlns=\'http://www.w3.org/2000/svg\' fill=\'%232d3748\' viewBox=\'0 0 20 20\'><path d=\'M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z\'/></svg>")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 16px center',
    backgroundSize: '20px',
    minWidth: '200px'
  };

  const buttonStyle = {
    background: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '16px 32px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 10px 20px rgba(66, 153, 225, 0.3)'
  };

  const productGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '30px'
  };

  const productCardStyle = {
    background: isDarkMode 
      ? 'linear-gradient(145deg, #1a202c 0%, #2d3748 100%)' 
      : 'linear-gradient(145deg, #ffffff 0%, #f7fafc 100%)',
    border: isDarkMode ? '1px solid #4a5568' : '1px solid rgba(226, 232, 240, 0.5)',
    borderRadius: '20px',
    padding: '30px',
    transition: 'all 0.3s ease',
    boxShadow: isDarkMode 
      ? '0 15px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' 
      : '0 15px 30px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
    color: isDarkMode ? '#e2e8f0' : '#2d3748'
  };

  return (
    <div style={containerStyle}>
      <Navigation user={user} />
      <div style={contentStyle}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '3.5rem', margin: '0 0 15px 0', fontWeight: '800', letterSpacing: '-0.05em' }}>
            Products
          </h1>
          <p style={{ fontSize: '1.25rem', opacity: '0.8', margin: 0, fontWeight: '400' }}>
            Manage your product catalog and pricing
          </p>
        </div>

        <div style={statsGridStyle}>
          <div style={{...statCardStyle, borderLeft: '5px solid #4299e1'}}>
            <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>📦</div>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 10px 0', opacity: '0.8' }}>Total Products</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, color: '#4299e1' }}>{totalProducts}</p>
          </div>

          <div style={{...statCardStyle, borderLeft: '5px solid #48bb78'}}>
            <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>💰</div>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 10px 0', opacity: '0.8' }}>Average Price</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, color: '#48bb78' }}>
              £{avgPrice.toFixed(2)}
            </p>
          </div>

          <div style={{...statCardStyle, borderLeft: '5px solid #ed8936'}}>
            <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>⭐</div>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 10px 0', opacity: '0.8' }}>Highest Price</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, color: '#ed8936' }}>
              £{highestPrice.toFixed(2)}
            </p>
          </div>
        </div>

        <div style={formContainerStyle}>
          <h2 style={{ fontSize: '2rem', marginBottom: '30px', fontWeight: '700' }}>
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h2>
          <form onSubmit={editingProduct ? updateProduct : addProduct}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Product Name</label>
                <input
                  type="text"
                  value={editingProduct ? editingProduct.name : newProduct.name}
                  onChange={(e) => editingProduct 
                    ? setEditingProduct({...editingProduct, name: e.target.value})
                    : setNewProduct({...newProduct, name: e.target.value})
                  }
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Price (£)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingProduct ? editingProduct.price : newProduct.price}
                  onChange={(e) => editingProduct 
                    ? setEditingProduct({...editingProduct, price: e.target.value})
                    : setNewProduct({...newProduct, price: e.target.value})
                  }
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>VAT (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingProduct ? editingProduct.vat : newProduct.vat}
                  onChange={(e) => editingProduct 
                    ? setEditingProduct({...editingProduct, vat: e.target.value})
                    : setNewProduct({...newProduct, vat: e.target.value})
                  }
                  style={inputStyle}
                  required
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Description</label>
                <textarea
                  value={editingProduct ? editingProduct.description : newProduct.description}
                  onChange={(e) => editingProduct 
                    ? setEditingProduct({...editingProduct, description: e.target.value})
                    : setNewProduct({...newProduct, description: e.target.value})
                  }
                  style={{...inputStyle, minHeight: '100px', resize: 'vertical'}}
                  rows="3"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button type="submit" style={buttonStyle}>
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>

              {editingProduct && (
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  style={{
                    ...buttonStyle,
                    background: 'linear-gradient(135deg, #a0aec0 0%, #718096 100%)'
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div style={searchAndFilterStyle}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={inputStyle}
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={selectStyle}
          >
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
            <option value="vat">Sort by VAT</option>
          </select>
        </div>

        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '30px', fontWeight: '700' }}>Your Products</h2>
          <div style={productGridStyle}>
            {filteredAndSortedProducts.map(product => (
              <div key={product.id} style={productCardStyle}>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1.5rem', fontWeight: '700' }}>
                    {product.name}
                  </h3>
                  {product.description && (
                    <p style={{ margin: '0 0 15px 0', opacity: '0.8', lineHeight: '1.6' }}>
                      {product.description}
                    </p>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                  <div>
                    <p style={{ margin: '0 0 5px 0', fontSize: '14px', opacity: '0.8' }}>Price</p>
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#4299e1' }}>
                      £{product.price.toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <p style={{ margin: '0 0 5px 0', fontSize: '14px', opacity: '0.8' }}>VAT</p>
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#48bb78' }}>
                      {product.vat}%
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setEditingProduct(product)}
                    style={{
                      ...buttonStyle,
                      background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
                      padding: '12px 24px',
                      fontSize: '14px',
                      flex: '1'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    style={{
                      ...buttonStyle,
                      background: 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)',
                      padding: '12px 24px',
                      fontSize: '14px',
                      flex: '1'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Products;