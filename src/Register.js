
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { auth, db } from './firebase.js';
import { createSubscription } from './subscriptionService.js';

function Register({ onRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('trial');

  const register = async (e) => {
    e.preventDefault();
    setLoading(true);
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

      // Create subscription based on selection
      await createSubscription(userCred.user.uid, selectedPlan, 7);
      
      onRegister(userCred.user);
    } catch (err) {
      alert('Registration failed: ' + err.message);
      setLoading(false);
    }
  };

  const containerStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minHeight: '100vh',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  };

  const formContainerStyle = {
    background: 'rgba(255,255,255,0.95)',
    padding: '40px',
    borderRadius: '20px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
    backdropFilter: 'blur(15px)',
    border: '2px solid rgba(255,255,255,0.2)',
    width: '100%',
    maxWidth: '500px',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '30px',
    color: '#2c3e50'
  };

  const titleStyle = {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '10px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  };

  const subtitleStyle = {
    fontSize: '16px',
    color: '#666',
    marginBottom: '0'
  };

  const inputStyle = {
    width: '100%',
    padding: '15px 20px',
    margin: '10px 0',
    border: '2px solid #e1e5e9',
    borderRadius: '12px',
    fontSize: '16px',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease'
  };

  const buttonStyle = {
    width: '100%',
    padding: '18px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '20px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
    opacity: loading ? 0.7 : 1
  };

  const linkStyle = {
    textAlign: 'center',
    marginTop: '25px',
    color: '#666',
    fontSize: '16px'
  };

  const linkButtonStyle = {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: 'bold',
    marginLeft: '5px',
    transition: 'color 0.2s ease'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    margin: '10px 0'
  };

  return (
    <div style={containerStyle}>
      <div style={formContainerStyle}>
        <div style={headerStyle}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>📄</div>
          <h1 style={titleStyle}>Create Your Account</h1>
          <p style={subtitleStyle}>Join Easy Invoice and start managing your business today</p>
        </div>
        
        <form onSubmit={register}>
          <div style={gridStyle}>
            <input
              type="text"
              placeholder="First Name *"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              style={inputStyle}
              required
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e1e5e9';
                e.target.style.boxShadow = 'none';
                e.target.style.transform = 'translateY(0)';
              }}
            />
            
            <input
              type="text"
              placeholder="Last Name *"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              style={inputStyle}
              required
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e1e5e9';
                e.target.style.boxShadow = 'none';
                e.target.style.transform = 'translateY(0)';
              }}
            />
          </div>
          
          <input
            type="email"
            placeholder="Email Address *"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
            required
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e1e5e9';
              e.target.style.boxShadow = 'none';
              e.target.style.transform = 'translateY(0)';
            }}
          />
          
          <input
            type="tel"
            placeholder="Phone Number *"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            style={inputStyle}
            required
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e1e5e9';
              e.target.style.boxShadow = 'none';
              e.target.style.transform = 'translateY(0)';
            }}
          />
          
          <input
            type="text"
            placeholder="Company Name *"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            style={inputStyle}
            required
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e1e5e9';
              e.target.style.boxShadow = 'none';
              e.target.style.transform = 'translateY(0)';
            }}
          />
          
          <input
            type="password"
            placeholder="Password *"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle}
            required
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e1e5e9';
              e.target.style.boxShadow = 'none';
              e.target.style.transform = 'translateY(0)';
            }}
          />

          <div style={{ margin: '20px 0' }}>
            <h3 style={{ color: '#333', marginBottom: '15px', textAlign: 'center' }}>Choose Your Plan</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div 
                onClick={() => setSelectedPlan('trial')}
                style={{
                  border: selectedPlan === 'trial' ? '3px solid #667eea' : '2px solid #e1e5e9',
                  borderRadius: '10px',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: selectedPlan === 'trial' ? '#f8f9ff' : 'white'
                }}
              >
                <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Free Trial</h4>
                <p style={{ margin: '0 0 10px 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>£0</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>7 days free</p>
              </div>

              <div 
                onClick={() => setSelectedPlan('premium')}
                style={{
                  border: selectedPlan === 'premium' ? '3px solid #667eea' : '2px solid #e1e5e9',
                  borderRadius: '10px',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: selectedPlan === 'premium' ? '#f8f9ff' : 'white'
                }}
              >
                <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Premium</h4>
                <p style={{ margin: '0 0 10px 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>£16.99</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>per month</p>
              </div>
            </div>
          </div>
          
          <button 
            type="submit" 
            style={buttonStyle}
            disabled={loading}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 12px 30px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
              }
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div style={linkStyle}>
          Already have an account?
          <Link 
            to="/login" 
            style={linkButtonStyle}
            onMouseOver={(e) => {
              e.target.style.color = '#764ba2';
            }}
            onMouseOut={(e) => {
              e.target.style.color = '#667eea';
            }}
          >
            Sign In
          </Link>
        </div>
        
        <div style={{ ...linkStyle, marginTop: '15px' }}>
          <Link 
            to="/" 
            style={{
              ...linkButtonStyle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              width: 'fit-content'
            }}
            onMouseOver={(e) => {
              e.target.style.color = '#764ba2';
            }}
            onMouseOut={(e) => {
              e.target.style.color = '#667eea';
            }}
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
