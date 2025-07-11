import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

function Register({ onRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');

  const register = async (e) => {
    e.preventDefault();
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      
      // Save additional user info to Firestore
      await setDoc(doc(db, 'users', userCred.user.uid), {
        firstName,
        lastName,
        phone,
        companyName,
        email,
        createdAt: new Date()
      });
      
      onRegister(userCred.user);
    } catch (err) {
      alert('Registration failed: ' + err.message);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    margin: '8px 0',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    boxSizing: 'border-box'
  };

  const formStyle = {
    maxWidth: '400px',
    margin: '50px auto',
    padding: '30px',
    background: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '10px'
  };

  return (
    <form onSubmit={register} style={formStyle}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Create Account</h2>
      
      <input
        type="text"
        placeholder="First Name *"
        value={firstName}
        onChange={e => setFirstName(e.target.value)}
        style={inputStyle}
        required
      />
      
      <input
        type="text"
        placeholder="Last Name *"
        value={lastName}
        onChange={e => setLastName(e.target.value)}
        style={inputStyle}
        required
      />
      
      <input
        type="email"
        placeholder="Email *"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={inputStyle}
        required
      />
      
      <input
        type="tel"
        placeholder="Phone Number *"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        style={inputStyle}
        required
      />
      
      <input
        type="text"
        placeholder="Company Name *"
        value={companyName}
        onChange={e => setCompanyName(e.target.value)}
        style={inputStyle}
        required
      />
      
      <input
        type="password"
        placeholder="Password *"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={inputStyle}
        required
      />
      
      <button type="submit" style={buttonStyle}>Sign Up</button>
    </form>
  );
}

export default Register;
