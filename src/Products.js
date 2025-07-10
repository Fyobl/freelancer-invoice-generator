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
    minHeight: '100vh',
    padding: '20px'
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto'
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
    <div style={pageStyle}>
      <Navigation user={user} />
      <div style={containerStyle}>
        <div style={formStyle}>
          <h2>Products</h2>
          {/* Product Form */}
          <input
            style={inputStyle}
            placeholder="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            style={inputStyle}
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            style={inputStyle}
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <button onClick={addProduct}>Add Product</button>
        </div>
        {/* Product List */}
        <div>
          {products.map(product => (
            <div key={product.id}>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <p>{product.price}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Products;