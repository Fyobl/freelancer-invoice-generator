
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { auth } from './firebase';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      alert('Login failed: ' + err.message);
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

  const linkStyle = {
    display: 'block',
    textAlign: 'center',
    marginTop: '15px',
    color: '#007bff',
    textDecoration: 'none'
  };

  return (
    <form onSubmit={login} style={formStyle}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={inputStyle}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={inputStyle}
        required
      />
      <button type="submit" style={buttonStyle}>Login</button>
      
      <Link to="/register" style={linkStyle}>
        Don't have an account? Sign up here
      </Link>
    </form>
  );
}

export default Login;
