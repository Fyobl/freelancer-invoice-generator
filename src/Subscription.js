
import React, { useState, useEffect } from 'react';
import Navigation from './Navigation.js';
import { getUserSubscription, upgradeSubscription, SUBSCRIPTION_PLANS } from './subscriptionService.js';

function Subscription({ user }) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const result = await getUserSubscription(user.uid);
      if (result.success) {
        setSubscription(result.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (newPlan) => {
    setUpgrading(true);
    try {
      const result = await upgradeSubscription(user.uid, newPlan);
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

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  };

  const contentStyle = {
    padding: '20px',
    maxWidth: '1200px',
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

  const planCardStyle = (isCurrentPlan) => ({
    background: isCurrentPlan ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
    color: isCurrentPlan ? 'white' : '#333',
    padding: '25px',
    borderRadius: '15px',
    border: isCurrentPlan ? '3px solid #fff' : '2px solid #e9ecef',
    textAlign: 'center',
    transition: 'transform 0.2s ease',
    position: 'relative'
  });

  const buttonStyle = {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
    color: 'white'
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

  return (
    <div style={containerStyle}>
      <Navigation user={user} />
      <div style={contentStyle}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '300' }}>
            💳 Subscription Management
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
            Manage your subscription and billing preferences
          </p>
        </div>

        {/* Current Subscription */}
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, color: '#333', fontSize: '1.5rem' }}>
            📊 Current Subscription
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
                ${subscription?.amount || 0}/month
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
              <p style={{ margin: 0, color: '#666' }}>Next Billing</p>
            </div>
          </div>
        </div>

        {/* Available Plans */}
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, color: '#333', fontSize: '1.5rem' }}>
            🚀 Available Plans
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {Object.entries(SUBSCRIPTION_PLANS).map(([planKey, plan]) => (
              <div key={planKey} style={planCardStyle(planKey === currentPlan)}>
                {planKey === currentPlan && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '20px',
                    background: '#28a745',
                    color: 'white',
                    padding: '5px 15px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    CURRENT
                  </div>
                )}
                
                <h3 style={{ fontSize: '1.5rem', margin: '0 0 10px 0' }}>
                  {plan.name}
                </h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 20px 0' }}>
                  ${plan.price}
                  <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>/month</span>
                </div>
                
                <ul style={{ 
                  listStyle: 'none', 
                  padding: 0, 
                  margin: '0 0 25px 0',
                  textAlign: 'left'
                }}>
                  {plan.features.map((feature, index) => (
                    <li key={index} style={{ 
                      padding: '8px 0',
                      borderBottom: planKey === currentPlan ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e9ecef'
                    }}>
                      ✓ {feature}
                    </li>
                  ))}
                </ul>
                
                {planKey !== currentPlan && (
                  <button
                    style={{
                      ...buttonStyle,
                      background: planKey === currentPlan ? '#6c757d' : 'linear-gradient(135deg, #007bff 0%, #6610f2 100%)',
                      opacity: upgrading ? 0.7 : 1
                    }}
                    onClick={() => handleUpgrade(planKey)}
                    disabled={upgrading || planKey === currentPlan}
                  >
                    {upgrading ? 'Upgrading...' : 'Upgrade to ' + plan.name}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Billing History */}
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, color: '#333', fontSize: '1.5rem' }}>
            📄 Billing Information
          </h2>
          <p style={{ color: '#666', lineHeight: 1.6 }}>
            Your subscription will automatically renew on <strong>{endDate.toLocaleDateString()}</strong>.
            You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
          </p>
          
          <div style={{ marginTop: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>💡 Need Help?</h4>
            <p style={{ margin: 0, color: '#666' }}>
              Contact our support team at support@yourcompany.com for any billing questions or assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Subscription;
