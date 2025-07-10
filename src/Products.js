import React, { useEffect, useState } from 'react';
import { db, auth } from './firebase.js';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';

function Products({ user }) {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [vat, setVat] = useState('');

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
    if (!name.trim() || !price.trim()) return;

    const parsedPrice = parseFloat(price);
    const parsedVat = parseFloat(vat) || 0;

    if (isNaN(parsedPrice)) {
      alert("Price must be a valid number");
      return;
    }

    await addDoc(collection(db, 'products'), {
      name: name.trim(),
      price: parsedPrice,
      vat: parsedVat,
      userId: user.uid
    });

    setName('');
    setPrice('');
    setVat('');
    fetchProducts();
  };

  const deleteProduct = async (id) => {
    await deleteDoc(doc(db, 'products', id));
    fetchProducts();
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>Product List</h2>
      <button onClick={() => signOut(auth)}>Logout</button>
      <hr />

      <h3>Add Product</h3>
      <input
        placeholder="Product Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      /><br /><br />

      <input
        placeholder="Price (£)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      /><br /><br />

      <input
        placeholder="VAT (%)"
        value={vat}
        onChange={(e) => setVat(e.target.value)}
      /><br /><br />

      <button onClick={addProduct}>Add Product</button>

      <hr />
      <h3>Your Products</h3>
      <ul>
        {products.map(p => (
          <li key={p.id}>
            {p.name} - £{p.price.toFixed(2)} {p.vat ? `(VAT: ${p.vat}%)` : ''}
            <button
              onClick={() => deleteProduct(p.id)}
              style={{
                marginLeft: 10,
                background: 'red',
                color: 'white',
                border: 'none',
                padding: '3px 8px',
                cursor: 'pointer'
              }}
            >
              ❌ Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Products;
