
import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from './firebase.js';
import Navigation from './Navigation.js';

function RecycleBin({ user }) {
  const [deletedItems, setDeletedItems] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [restoreConfirmation, setRestoreConfirmation] = useState({ show: false, item: null });
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, item: null });

  useEffect(() => {
    if (user) {
      fetchDeletedItems();
      fetchUserData();
      // Clean up expired items
      cleanupExpiredItems();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
      if (!userDoc.empty) {
        setUserData(userDoc.docs[0].data());
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchDeletedItems = async () => {
    try {
      const q = query(collection(db, 'recycleBin'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDeletedItems(data);
    } catch (error) {
      console.error('Error fetching deleted items:', error);
    }
  };

  const cleanupExpiredItems = async () => {
    try {
      const q = query(collection(db, 'recycleBin'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const now = new Date();
      
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        if (data.expiresAt && data.expiresAt.toDate() < now) {
          await deleteDoc(doc(db, 'recycleBin', docSnapshot.id));
        }
      }
      
      fetchDeletedItems();
    } catch (error) {
      console.error('Error cleaning up expired items:', error);
    }
  };

  const restoreItem = async (item) => {
    setLoading(true);
    try {
      // Restore to original collection
      const restoreData = { ...item };
      delete restoreData.id;
      delete restoreData.originalId;
      delete restoreData.originalCollection;
      delete restoreData.deletedAt;
      delete restoreData.expiresAt;
      
      await addDoc(collection(db, item.originalCollection), restoreData);
      
      // Remove from recycle bin
      await deleteDoc(doc(db, 'recycleBin', item.id));
      
      fetchDeletedItems();
      setRestoreConfirmation({ show: false, item: null });
    } catch (error) {
      console.error('Error restoring item:', error);
    }
    setLoading(false);
  };

  const confirmRestore = (item) => {
    setRestoreConfirmation({ show: true, item });
  };

  const permanentlyDelete = async (item) => {
    try {
      await deleteDoc(doc(db, 'recycleBin', item.id));
      fetchDeletedItems();
      setDeleteConfirmation({ show: false, item: null });
    } catch (error) {
      console.error('Error permanently deleting item:', error);
    }
  };

  const confirmPermanentDelete = (item) => {
    setDeleteConfirmation({ show: true, item });
  };

  const getDaysRemaining = (expiresAt) => {
    if (!expiresAt) return 0;
    const now = new Date();
    const expires = expiresAt.toDate();
    const diff = expires - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // Styles
  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '40px',
    color: 'white'
  };

  const cardStyle = {
    background: 'white',
    borderRadius: '15px',
    padding: '30px',
    marginBottom: '30px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    border: 'none'
  };

  const itemCardStyle = {
    background: 'white',
    border: '2px solid #f8f9fa',
    borderRadius: '12px',
    padding: '25px',
    marginBottom: '20px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease'
  };

  const buttonStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    marginRight: '10px'
  };

  return (
    <div style={containerStyle}>
      <Navigation user={user} />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', paddingTop: '100px' }}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '300' }}>
            🗑️ Recycle Bin
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: 0 }}>
            Hello {userData?.firstName || user?.email?.split('@')[0]}! Manage your deleted items here
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, color: '#333', fontSize: '1.5rem' }}>
            📋 Deleted Items ({deletedItems.length})
          </h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Items are automatically deleted after 7 days. You can restore or permanently delete them before then.
          </p>

          {deletedItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🗑️</div>
              <h3>No deleted items found</h3>
              <p>Your recycle bin is empty!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {deletedItems.map(item => (
                <div
                  key={item.id}
                  style={itemCardStyle}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 15px 35px rgba(102, 126, 234, 0.1)';
                    e.currentTarget.style.borderColor = '#667eea';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#f8f9fa';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div>
                      <h3 style={{ margin: 0, color: '#333', fontSize: '1.2rem' }}>
                        {item.originalCollection === 'invoices' ? '📄' : '💰'} {item.invoiceNumber || item.quoteNumber}
                      </h3>
                      <p style={{ margin: '5px 0', color: '#666', fontSize: '1rem' }}>{item.clientName}</p>
                      <p style={{ margin: '5px 0', color: '#666', fontSize: '0.9rem' }}>
                        Type: {item.originalCollection === 'invoices' ? 'Invoice' : 'Quote'}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        background: getDaysRemaining(item.expiresAt) <= 1 ? '#dc3545' : '#ffc107',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {getDaysRemaining(item.expiresAt)} days left
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                    <div>
                      <p style={{ margin: '5px 0', color: '#666' }}>
                        <strong>Amount:</strong> £{parseFloat(item.amount || 0).toFixed(2)}
                      </p>
                      <p style={{ margin: '5px 0', color: '#666' }}>
                        <strong>Deleted:</strong> {item.deletedAt?.toDate().toLocaleDateString() || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: '5px 0', color: '#666' }}>
                        <strong>Expires:</strong> {item.expiresAt?.toDate().toLocaleDateString() || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => confirmRestore(item)}
                      disabled={loading}
                      style={{
                        ...buttonStyle,
                        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                        opacity: loading ? 0.6 : 1,
                        cursor: loading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      ↩️ Restore
                    </button>
                    <button
                      onClick={() => confirmPermanentDelete(item)}
                      style={{
                        ...buttonStyle,
                        background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
                      }}
                    >
                      🗑️ Delete Forever
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Restore Confirmation Modal */}
        {restoreConfirmation.show && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              border: '2px solid #28a745'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>↩️</div>
              <h2 style={{ color: '#333', marginBottom: '15px', fontSize: '1.4rem' }}>
                Confirm Restore
              </h2>
              <p style={{ color: '#666', marginBottom: '25px', lineHeight: '1.5' }}>
                Are you sure you want to restore <strong>{restoreConfirmation.item?.invoiceNumber || restoreConfirmation.item?.quoteNumber}</strong>?
                <br />This will move it back to your active {restoreConfirmation.item?.originalCollection === 'invoices' ? 'invoices' : 'quotes'}.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={() => restoreItem(restoreConfirmation.item)}
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'transform 0.2s ease',
                    opacity: loading ? 0.6 : 1
                  }}
                  onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-1px)')}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  {loading ? '⏳ Restoring...' : '↩️ Restore Item'}
                </button>
                <button
                  onClick={() => setRestoreConfirmation({ show: false, item: null })}
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'transform 0.2s ease',
                    opacity: loading ? 0.6 : 1
                  }}
                  onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-1px)')}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Permanent Delete Confirmation Modal */}
        {deleteConfirmation.show && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              border: '2px solid #dc3545'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>⚠️</div>
              <h2 style={{ color: '#333', marginBottom: '15px', fontSize: '1.4rem' }}>
                Permanent Deletion
              </h2>
              <p style={{ color: '#666', marginBottom: '25px', lineHeight: '1.5' }}>
                Are you sure you want to permanently delete <strong>{deleteConfirmation.item?.invoiceNumber || deleteConfirmation.item?.quoteNumber}</strong>?
                <br /><span style={{ color: '#dc3545', fontWeight: 'bold' }}>This action cannot be undone!</span>
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={() => permanentlyDelete(deleteConfirmation.item)}
                  style={{
                    background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  🗑️ Delete Forever
                </button>
                <button
                  onClick={() => setDeleteConfirmation({ show: false, item: null })}
                  style={{
                    background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecycleBin;
