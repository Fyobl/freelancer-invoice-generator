import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import Navigation from './Navigation.js';
import { getUserSubscription, upgradeSubscription, checkSubscriptionStatus, SUBSCRIPTION_PLANS } from './subscriptionService.js';
import { auth } from './firebase.js';

function Subscription({ user }) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const result = await checkSubscriptionStatus(user.uid);
      if (result.success) {
        setSubscription(result.subscription);
        setIsExpired(result.expired || result.subscription.status === 'expired');
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const result = await upgradeSubscription(user.uid, 'premium');
      if (result.success) {
        alert('Subscription upgraded successfully!');
        fetchSubscription();
      } else {
        alert('Error upgrading subscription: ' + result.error);
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      alert('Error upgrading subscription');
    } finally {
      setUpgrading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  };

  const contentStyle = {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
    paddingTop: '100px'
  };

  const headerStyle = {
    background: 'rgba(255,255,255,0.95)',
    padding: '30px',
    borderRadius: '20px',
    marginBottom: '30px',
    textAlign: 'center',
    backdropFilter: 'blur(15px)',
    border: '2px solid rgba(255,255,255,0.2)'
  };

  const cardStyle = {
    background: 'rgba(255,255,255,0.95)',
    padding: '25px',
    borderRadius: '15px',
    marginBottom: '25px',
    backdropFilter: 'blur(15px)',
    border: '2px solid rgba(255,255,255,0.2)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
  };

  const buttonStyle = {
    padding: '15px 30px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
    margin: '10px'
  };

  const expiredModalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  };

  const modalContentStyle = {
    background: 'white',
    padding: '40px',
    borderRadius: '15px',
    textAlign: 'center',
    maxWidth: '500px',
    width: '90%'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <Navigation user={user} />
        <div style={contentStyle}>
          <div style={headerStyle}>
            <h1>Loading Subscription...</h1>
          </div>
        </div>
      </div>
    );
  }

  const currentPlan = subscription?.plan || 'trial';
  const endDate = subscription?.endDate?.toDate ? subscription.endDate.toDate() : new Date(subscription?.endDate);
  const premiumPlan = SUBSCRIPTION_PLANS.premium;

  // Show expired modal if subscription is expired
  if (isExpired && currentPlan === 'trial') {
    return (
      <div style={containerStyle}>
        <Navigation user={user} />
        <div style={expiredModalStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>⚠️ Trial Expired</h2>
            <p style={{ color: '#666', marginBottom: '30px', lineHeight: 1.6 }}>
              Your free trial has ended. Please upgrade to continue using our invoice management system.
            </p>

            <div style={{ border: '2px solid #007bff', borderRadius: '10px', padding: '20px', marginBottom: '30px' }}>
              <h3 style={{ color: '#007bff', margin: '0 0 15px 0' }}>{premiumPlan.name}</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333', marginBottom: '15px' }}>
                £{premiumPlan.price}/month
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, textAlign: 'left' }}>
                {premiumPlan.features.map((feature, index) => (
                  <li key={index} style={{ padding: '5px 0', color: '#666' }}>
                    ✓ {feature}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              style={{
                ...buttonStyle,
                background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                color: 'white',
                width: '100%',
                marginBottom: '15px'
              }}
            >
              {upgrading ? 'Processing...' : 'Upgrade Now'}
            </button>

            <button
              onClick={handleLogout}
              style={{
                ...buttonStyle,
                background: '#6c757d',
                color: 'white',
                width: '100%'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <Navigation user={user} />
      <div style={contentStyle}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '300' }}>
            💳 Subscription
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
            Manage your subscription
          </p>
        </div>

        {/* Current Subscription */}
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, color: '#333', fontSize: '1.5rem' }}>
            📊 Current Plan
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <h3 style={{ color: '#667eea', margin: '0 0 5px 0' }}>
                {SUBSCRIPTION_PLANS[currentPlan]?.name}
              </h3>
              <p style={{ margin: 0, color: '#666' }}>Current Plan</p>
            </div>
            <div>
              <h3 style={{ color: '#28a745', margin: '0 0 5px 0' }}>
                £{subscription?.amount || 0}/month
              </h3>
              <p style={{ margin: 0, color: '#666' }}>Monthly Cost</p>
            </div>
            <div>
              <h3 style={{ color: '#ffc107', margin: '0 0 5px 0' }}>
                {subscription?.invoiceCount || 0}
                {subscription?.invoiceLimit === -1 ? '' : `/${subscription?.invoiceLimit || 0}`}
              </h3>
              <p style={{ margin: 0, color: '#666' }}>Invoices Used</p>
            </div>
            <div>
              <h3 style={{ color: '#17a2b8', margin: '0 0 5px 0' }}>
                {endDate.toLocaleDateString()}
              </h3>
              <p style={{ margin: 0, color: '#666' }}>
                {currentPlan === 'trial' ? 'Trial Ends' : 'Next Billing'}
              </p>
            </div>
          </div>
        </div>

        {/* Upgrade Section */}
        {currentPlan === 'trial' && (
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, color: '#333', fontSize: '1.5rem' }}>
              🚀 Upgrade to Premium
            </h2>

            <div style={{ border: '2px solid #007bff', borderRadius: '15px', padding: '25px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.5rem', margin: '0 0 10px 0', color: '#007bff' }}>
                {premiumPlan.name}
              </h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 20px 0', color: '#333' }}>
                £{premiumPlan.price}
                <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>/month</span>
              </div>

              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                margin: '0 0 25px 0',
                textAlign: 'left'
              }}>
                {premiumPlan.features.map((feature, index) => (
                  <li key={index} style={{ 
                    padding: '8px 0',
                    borderBottom: '1px solid #e9ecef',
                    color: '#666'
                  }}>
                    ✓ {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                style={{
                  ...buttonStyle,
                  background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                  color: 'white',
                  opacity: upgrading ? 0.7 : 1
                }}
              >
                {upgrading ? 'Upgrading...' : 'Upgrade to Premium'}
              </button>
            </div>
          </div>
        )}

        {/* Premium Status */}
        {currentPlan === 'premium' && (
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, color: '#333', fontSize: '1.5rem' }}>
              ✨ Premium Member
            </h2>
            <p style={{ color: '#666', lineHeight: 1.6 }}>
              You're enjoying all premium features! Your subscription will automatically renew on <strong>{endDate.toLocaleDateString()}</strong>.
            </p>

            <div style={{ marginTop: '20px', padding: '20px', background: '#d4edda', borderRadius: '10px', border: '1px solid #c3e6cb' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>💡 Need Help?</h4>
              <p style={{ margin: 0, color: '#155724' }}>
                Contact our support team for any questions or assistance.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Subscription;