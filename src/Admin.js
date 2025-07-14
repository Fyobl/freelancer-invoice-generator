
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase.js';
import Navigation from './Navigation.js';
import { grantTrialFromAdmin } from './subscriptionService.js';
import PDFTemplateCreator from './PDFTemplateCreator.js';

function Admin({ user }) {
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [trialUserId, setTrialUserId] = useState(null);
  const [trialDays, setTrialDays] = useState(7);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionUserId, setSubscriptionUserId] = useState(null);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [blockedUsers, setBlockedUsers] = useState([]);

  // Check if current user is admin
  const adminEmails = ['fyobl007@gmail.com', 'fyobl_ben@hotmail.com'];
  const isAdmin = adminEmails.includes(user?.email);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);

      // Fetch subscription data
      const subscriptionsSnapshot = await getDocs(collection(db, 'subscriptions'));
      const subscriptionsData = subscriptionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubscriptions(subscriptionsData);

      // Fetch blocked users
      const blockedSnapshot = await getDocs(collection(db, 'blockedUsers'));
      const blockedData = blockedSnapshot.docs.map(doc => doc.id);
      setBlockedUsers(blockedData);

      // Calculate analytics
      const totalUsers = usersData.length;
      const activeSubscriptions = subscriptionsData.filter(sub => sub.status === 'active').length;
      const monthlyRevenue = subscriptionsData
        .filter(sub => sub.status === 'active')
        .reduce((sum, sub) => sum + (sub.amount || 0), 0);

      setAnalytics({
        totalUsers,
        activeSubscriptions,
        monthlyRevenue,
        trialUsers: subscriptionsData.filter(sub => sub.status === 'trial').length,
        cancelledUsers: subscriptionsData.filter(sub => sub.status === 'cancelled').length,
        blockedUsers: blockedData.length
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserSubscription = async (userId, newStatus, newPlan = null) => {
    try {
      const subscriptionRef = doc(db, 'subscriptions', userId);
      const updateData = { status: newStatus };
      
      if (newPlan) {
        updateData.plan = newPlan;
        updateData.amount = getPlanPrice(newPlan);
      }
      
      await updateDoc(subscriptionRef, updateData);
      fetchAdminData();
      setSuccessMessage('Subscription updated successfully');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error updating subscription:', error);
      setSuccessMessage('Error updating subscription');
      setShowSuccessModal(true);
    }
  };

  const getPlanPrice = (plan) => {
    const prices = {
      'basic': 9.99,
      'pro': 19.99,
      'enterprise': 49.99
    };
    return prices[plan] || 0;
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        await deleteDoc(doc(db, 'subscriptions', userId));
        fetchAdminData();
        setSuccessMessage('User deleted successfully');
        setShowSuccessModal(true);
      } catch (error) {
        console.error('Error deleting user:', error);
        setSuccessMessage('Error deleting user');
        setShowSuccessModal(true);
      }
    }
  };

  const grantTrial = (userId) => {
    setTrialUserId(userId);
    setShowTrialModal(true);
  };

  const grantSubscription = (userId) => {
    setSubscriptionUserId(userId);
    // Set default end date to 30 days from now
    const defaultEndDate = new Date();
    defaultEndDate.setDate(defaultEndDate.getDate() + 30);
    setSubscriptionEndDate(defaultEndDate.toISOString().split('T')[0]);
    setShowSubscriptionModal(true);
  };

  const confirmGrantTrial = async () => {
    try {
      await grantTrialFromAdmin(trialUserId, trialDays);
      setShowTrialModal(false);
      setTrialUserId(null);
      setTrialDays(7);
      fetchAdminData();
      setSuccessMessage(`Trial granted successfully for ${trialDays} days`);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error granting trial:', error);
      setSuccessMessage('Error granting trial');
      setShowSuccessModal(true);
    }
  };

  const confirmGrantSubscription = async () => {
    try {
      const endDate = new Date(subscriptionEndDate);
      const subscriptionRef = doc(db, 'subscriptions', subscriptionUserId);
      
      const subscriptionData = {
        plan: 'premium',
        status: 'active',
        amount: 9.99,
        endDate: endDate,
        nextBilling: endDate,
        invoiceLimit: -1, // unlimited
        invoiceCount: 0,
        updatedAt: new Date()
      };
      
      await updateDoc(subscriptionRef, subscriptionData);
      
      setShowSubscriptionModal(false);
      setSubscriptionUserId(null);
      setSubscriptionEndDate('');
      fetchAdminData();
      setSuccessMessage(`Subscription granted successfully until ${endDate.toLocaleDateString()}`);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error granting subscription:', error);
      setSuccessMessage('Error granting subscription');
      setShowSuccessModal(true);
    }
  };

  const toggleBlockUser = async (userId, currentlyBlocked) => {
    try {
      if (currentlyBlocked) {
        // Unblock user
        await deleteDoc(doc(db, 'blockedUsers', userId));
        setSuccessMessage('User unblocked successfully');
      } else {
        // Block user
        await updateDoc(doc(db, 'blockedUsers', userId), {
          blockedAt: new Date(),
          blockedBy: user.uid
        });
        setSuccessMessage('User blocked successfully');
      }
      
      fetchAdminData();
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error blocking/unblocking user:', error);
      setSuccessMessage('Error updating user block status');
      setShowSuccessModal(true);
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  };

  const contentStyle = {
    padding: '20px',
    maxWidth: '1400px',
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

  const tabStyle = {
    display: 'flex',
    background: 'rgba(255,255,255,0.9)',
    borderRadius: '15px',
    padding: '5px',
    marginBottom: '30px',
    backdropFilter: 'blur(10px)'
  };

  const tabButtonStyle = (active) => ({
    flex: 1,
    padding: '15px 20px',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    background: active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
    color: active ? 'white' : '#666',
    fontWeight: active ? 'bold' : 'normal'
  });

  const cardStyle = {
    background: 'rgba(255,255,255,0.95)',
    padding: '25px',
    borderRadius: '15px',
    marginBottom: '25px',
    backdropFilter: 'blur(15px)',
    border: '2px solid rgba(255,255,255,0.2)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
  };

  const statCardStyle = {
    background: 'rgba(255,255,255,0.9)',
    padding: '25px',
    borderRadius: '15px',
    textAlign: 'center',
    backdropFilter: 'blur(10px)',
    border: '2px solid rgba(255,255,255,0.2)'
  };

  const buttonStyle = {
    padding: '8px 16px',
    margin: '0 5px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s ease'
  };

  if (!isAdmin) {
    return (
      <div style={containerStyle}>
        <Navigation user={user} />
        <div style={contentStyle}>
          <div style={headerStyle}>
            <h1>🚫 Access Denied</h1>
            <p>You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={containerStyle}>
        <Navigation user={user} />
        <div style={contentStyle}>
          <div style={headerStyle}>
            <h1>Loading Admin Portal...</h1>
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
            ⚡ Admin Portal
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
            Manage users, subscriptions, and monitor app performance
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={tabStyle}>
          <button
            style={tabButtonStyle(activeTab === 'dashboard')}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            style={tabButtonStyle(activeTab === 'users')}
            onClick={() => setActiveTab('users')}
          >
            👥 Users
          </button>
          <button
            style={tabButtonStyle(activeTab === 'subscriptions')}
            onClick={() => setActiveTab('subscriptions')}
          >
            💳 Subscriptions
          </button>
          <button
            style={tabButtonStyle(activeTab === 'analytics')}
            onClick={() => setActiveTab('analytics')}
          >
            📈 Analytics
          </button>
          <button
            style={tabButtonStyle(activeTab === 'pdfTemplates')}
            onClick={() => setActiveTab('pdfTemplates')}
          >
            🎨 PDF Templates
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={statCardStyle}>
                <h3 style={{ fontSize: '2rem', margin: '0 0 10px 0', color: '#667eea' }}>
                  {analytics.totalUsers}
                </h3>
                <p style={{ margin: 0, color: '#666', fontSize: '1.1rem' }}>Total Users</p>
              </div>
              <div style={statCardStyle}>
                <h3 style={{ fontSize: '2rem', margin: '0 0 10px 0', color: '#28a745' }}>
                  {analytics.activeSubscriptions}
                </h3>
                <p style={{ margin: 0, color: '#666', fontSize: '1.1rem' }}>Active Subscriptions</p>
              </div>
              <div style={statCardStyle}>
                <h3 style={{ fontSize: '2rem', margin: '0 0 10px 0', color: '#ffc107' }}>
                  £{analytics.monthlyRevenue?.toFixed(2)}
                </h3>
                <p style={{ margin: 0, color: '#666', fontSize: '1.1rem' }}>Monthly Revenue</p>
              </div>
              <div style={statCardStyle}>
                <h3 style={{ fontSize: '2rem', margin: '0 0 10px 0', color: '#17a2b8' }}>
                  {analytics.trialUsers}
                </h3>
                <p style={{ margin: 0, color: '#666', fontSize: '1.1rem' }}>Trial Users</p>
              </div>
              <div style={statCardStyle}>
                <h3 style={{ fontSize: '2rem', margin: '0 0 10px 0', color: '#dc3545' }}>
                  {analytics.blockedUsers}
                </h3>
                <p style={{ margin: 0, color: '#666', fontSize: '1.1rem' }}>Blocked Users</p>
              </div>
            </div>

            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, color: '#333', fontSize: '1.5rem' }}>
                🎯 Quick Actions
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <button
                  style={{
                    ...buttonStyle,
                    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                    color: 'white',
                    padding: '15px',
                    fontSize: '16px'
                  }}
                  onClick={() => setActiveTab('users')}
                >
                  👥 Manage Users
                </button>
                <button
                  style={{
                    ...buttonStyle,
                    background: 'linear-gradient(135deg, #007bff 0%, #6610f2 100%)',
                    color: 'white',
                    padding: '15px',
                    fontSize: '16px'
                  }}
                  onClick={() => setActiveTab('subscriptions')}
                >
                  💳 View Subscriptions
                </button>
                <button
                  style={{
                    ...buttonStyle,
                    background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
                    color: 'white',
                    padding: '15px',
                    fontSize: '16px'
                  }}
                  onClick={fetchAdminData}
                >
                  🔄 Refresh Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, color: '#333', fontSize: '1.5rem' }}>
              👥 User Management
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Company</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Plan</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const userSub = subscriptions.find(sub => sub.userId === user.id);
                    return (
                      <tr key={user.id}>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {user.firstName} {user.lastName}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{user.email}</td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{user.companyName}</td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            background: userSub?.plan === 'premium' ? '#d4edda' : '#fff3cd',
                            color: userSub?.plan === 'premium' ? '#155724' : '#856404'
                          }}>
                            {userSub?.plan === 'premium' ? 'Subscribed' : userSub?.plan || 'trial'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            background: blockedUsers.includes(user.id) ? '#f8d7da' : '#d4edda',
                            color: blockedUsers.includes(user.id) ? '#721c24' : '#155724'
                          }}>
                            {blockedUsers.includes(user.id) ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          <button
                            style={{
                              ...buttonStyle,
                              background: '#007bff',
                              color: 'white'
                            }}
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                            }}
                          >
                            View
                          </button>
                          <button
                            style={{
                              ...buttonStyle,
                              background: '#28a745',
                              color: 'white'
                            }}
                            onClick={() => grantTrial(user.id)}
                          >
                            Grant Trial
                          </button>
                          <button
                            style={{
                              ...buttonStyle,
                              background: '#ffc107',
                              color: 'black'
                            }}
                            onClick={() => grantSubscription(user.id)}
                          >
                            Grant Subscription
                          </button>
                          <button
                            style={{
                              ...buttonStyle,
                              background: blockedUsers.includes(user.id) ? '#ffc107' : '#fd7e14',
                              color: 'white'
                            }}
                            onClick={() => toggleBlockUser(user.id, blockedUsers.includes(user.id))}
                          >
                            {blockedUsers.includes(user.id) ? 'Unblock' : 'Block'}
                          </button>
                          <button
                            style={{
                              ...buttonStyle,
                              background: '#dc3545',
                              color: 'white'
                            }}
                            onClick={() => deleteUser(user.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, color: '#333', fontSize: '1.5rem' }}>
              💳 Subscription Management
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>User</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Plan</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Next Billing</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map(sub => {
                    const user = users.find(u => u.id === sub.userId);
                    return (
                      <tr key={sub.id}>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {user?.firstName} {user?.lastName}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{sub.plan === 'premium' ? 'Subscribed' : sub.plan}</td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            background: sub.status === 'active' ? '#d4edda' : sub.status === 'trial' ? '#fff3cd' : '#f8d7da',
                            color: sub.status === 'active' ? '#155724' : sub.status === 'trial' ? '#856404' : '#721c24'
                          }}>
                            {sub.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>£{sub.amount}</td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {sub.nextBilling?.toDate?.()?.toLocaleDateString() || 'N/A'}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          <select
                            onChange={(e) => updateUserSubscription(sub.userId, e.target.value)}
                            style={{ marginRight: '5px', padding: '4px' }}
                          >
                            <option value="">Change Status</option>
                            <option value="active">Active</option>
                            <option value="trial">Trial</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div>
            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, color: '#333', fontSize: '1.5rem' }}>
                📈 Revenue Analytics
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.8rem', color: '#28a745', margin: '0 0 5px 0' }}>
                    £{analytics.monthlyRevenue?.toFixed(2)}
                  </h3>
                  <p style={{ margin: 0, color: '#666' }}>Monthly Recurring Revenue</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.8rem', color: '#007bff', margin: '0 0 5px 0' }}>
                    £{(analytics.monthlyRevenue * 12)?.toFixed(2)}
                  </h3>
                  <p style={{ margin: 0, color: '#666' }}>Annual Recurring Revenue</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.8rem', color: '#ffc107', margin: '0 0 5px 0' }}>
                    £{(analytics.monthlyRevenue / (analytics.activeSubscriptions || 1))?.toFixed(2)}
                  </h3>
                  <p style={{ margin: 0, color: '#666' }}>Average Revenue Per User</p>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, color: '#333', fontSize: '1.5rem' }}>
                📊 User Metrics
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.8rem', color: '#17a2b8', margin: '0 0 5px 0' }}>
                    {((analytics.activeSubscriptions / analytics.totalUsers) * 100)?.toFixed(1)}%
                  </h3>
                  <p style={{ margin: 0, color: '#666' }}>Conversion Rate</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.8rem', color: '#6f42c1', margin: '0 0 5px 0' }}>
                    {analytics.trialUsers}
                  </h3>
                  <p style={{ margin: 0, color: '#666' }}>Active Trials</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.8rem', color: '#dc3545', margin: '0 0 5px 0' }}>
                    {analytics.cancelledUsers}
                  </h3>
                  <p style={{ margin: 0, color: '#666' }}>Cancelled Users</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PDF Templates Tab */}
        {activeTab === 'pdfTemplates' && (
          <div style={{ margin: '-25px', padding: '0' }}>
            <PDFTemplateCreator user={user} />
          </div>
        )}

        {/* User Detail Modal */}
        {showUserModal && selectedUser && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '15px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <h2 style={{ marginTop: 0, color: '#333' }}>👤 User Details</h2>
              <div style={{ marginBottom: '15px' }}>
                <strong>Name:</strong> {selectedUser.firstName} {selectedUser.lastName}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Email:</strong> {selectedUser.email}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Company:</strong> {selectedUser.companyName}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Joined:</strong> {selectedUser.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  style={{
                    ...buttonStyle,
                    background: '#6c757d',
                    color: 'white',
                    flex: 1
                  }}
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedUser(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Trial Grant Modal */}
        {showTrialModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '15px',
              maxWidth: '400px',
              width: '90%'
            }}>
              <h2 style={{ marginTop: 0, color: '#333' }}>🎁 Grant Trial Access</h2>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                How many days of trial access would you like to grant?
              </p>
              
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#555' }}>
                Trial Days
              </label>
              <input
                type="number"
                value={trialDays}
                onChange={(e) => setTrialDays(parseInt(e.target.value) || 1)}
                min="1"
                max="365"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '16px',
                  marginBottom: '20px',
                  boxSizing: 'border-box'
                }}
              />
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  style={{
                    ...buttonStyle,
                    background: '#28a745',
                    color: 'white',
                    flex: 1
                  }}
                  onClick={confirmGrantTrial}
                >
                  Grant Trial
                </button>
                <button
                  style={{
                    ...buttonStyle,
                    background: '#6c757d',
                    color: 'white',
                    flex: 1
                  }}
                  onClick={() => {
                    setShowTrialModal(false);
                    setTrialUserId(null);
                    setTrialDays(7);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Grant Modal */}
        {showSubscriptionModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '15px',
              maxWidth: '450px',
              width: '90%'
            }}>
              <h2 style={{ marginTop: 0, color: '#333' }}>💳 Grant Subscription Access</h2>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                Select the end date for the subscription. The user will have full access until this date.
              </p>
              
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#555' }}>
                Subscription End Date
              </label>
              <input
                type="date"
                value={subscriptionEndDate}
                onChange={(e) => setSubscriptionEndDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '16px',
                  marginBottom: '20px',
                  boxSizing: 'border-box'
                }}
              />

              <div style={{
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #e9ecef'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>Subscription Details:</h4>
                <p style={{ margin: '0 0 5px 0', color: '#6c757d' }}>• Plan: Easy Invoice Subscription</p>
                <p style={{ margin: '0 0 5px 0', color: '#6c757d' }}>• Price: £9.99/month</p>
                <p style={{ margin: '0 0 5px 0', color: '#6c757d' }}>• Features: Unlimited invoices & all features</p>
                <p style={{ margin: '0', color: '#6c757d' }}>• End Date: {subscriptionEndDate ? new Date(subscriptionEndDate).toLocaleDateString() : 'Not selected'}</p>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  style={{
                    ...buttonStyle,
                    background: '#007bff',
                    color: 'white',
                    flex: 1
                  }}
                  onClick={confirmGrantSubscription}
                  disabled={!subscriptionEndDate}
                >
                  Grant Subscription
                </button>
                <button
                  style={{
                    ...buttonStyle,
                    background: '#6c757d',
                    color: 'white',
                    flex: 1
                  }}
                  onClick={() => {
                    setShowSubscriptionModal(false);
                    setSubscriptionUserId(null);
                    setSubscriptionEndDate('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success/Error Modal */}
        {showSuccessModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '15px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>
                {successMessage.includes('Error') ? '❌' : '✅'}
              </div>
              <h2 style={{ 
                marginTop: 0, 
                color: successMessage.includes('Error') ? '#dc3545' : '#28a745',
                fontSize: '1.5rem',
                marginBottom: '15px'
              }}>
                {successMessage.includes('Error') ? 'Error' : 'Success!'}
              </h2>
              <p style={{ 
                color: '#666', 
                marginBottom: '25px',
                lineHeight: '1.5'
              }}>
                {successMessage}
              </p>
              
              <button
                style={{
                  ...buttonStyle,
                  background: successMessage.includes('Error') ? '#dc3545' : '#28a745',
                  color: 'white',
                  padding: '12px 30px',
                  fontSize: '16px',
                  width: '100%'
                }}
                onClick={() => {
                  setShowSuccessModal(false);
                  setSuccessMessage('');
                }}
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
