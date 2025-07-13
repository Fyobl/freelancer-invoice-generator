
import { doc, setDoc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.js';

export const SUBSCRIPTION_PLANS = {
  trial: {
    name: 'Trial',
    price: 0,
    duration: 14, // days
    features: ['5 invoices per month', 'Basic templates', 'Email support'],
    invoiceLimit: 5
  },
  basic: {
    name: 'Basic',
    price: 9.99,
    duration: 30, // days
    features: ['50 invoices per month', 'All templates', 'Email support', 'Basic reports'],
    invoiceLimit: 50
  },
  pro: {
    name: 'Pro',
    price: 19.99,
    duration: 30, // days
    features: ['Unlimited invoices', 'All templates', 'Priority support', 'Advanced reports', 'API access'],
    invoiceLimit: -1 // unlimited
  },
  enterprise: {
    name: 'Enterprise',
    price: 49.99,
    duration: 30, // days
    features: ['Everything in Pro', 'Custom branding', 'Dedicated support', 'Custom integrations'],
    invoiceLimit: -1 // unlimited
  }
};

export const createSubscription = async (userId, plan = 'trial') => {
  try {
    const planDetails = SUBSCRIPTION_PLANS[plan];
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + planDetails.duration);

    const subscriptionData = {
      userId,
      plan,
      status: 'active',
      amount: planDetails.price,
      startDate: startDate,
      endDate: endDate,
      nextBilling: endDate,
      invoiceCount: 0,
      invoiceLimit: planDetails.invoiceLimit,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, 'subscriptions', userId), subscriptionData);
    return { success: true, subscription: subscriptionData };
  } catch (error) {
    console.error('Error creating subscription:', error);
    return { success: false, error: error.message };
  }
};

export const getUserSubscription = async (userId) => {
  try {
    const subscriptionDoc = await getDoc(doc(db, 'subscriptions', userId));
    if (subscriptionDoc.exists()) {
      return { success: true, subscription: subscriptionDoc.data() };
    } else {
      // Create trial subscription if none exists
      return await createSubscription(userId, 'trial');
    }
  } catch (error) {
    console.error('Error getting subscription:', error);
    return { success: false, error: error.message };
  }
};

export const updateSubscription = async (userId, updates) => {
  try {
    const subscriptionRef = doc(db, 'subscriptions', userId);
    await updateDoc(subscriptionRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating subscription:', error);
    return { success: false, error: error.message };
  }
};

export const incrementInvoiceCount = async (userId) => {
  try {
    const subscriptionResult = await getUserSubscription(userId);
    if (!subscriptionResult.success) {
      return subscriptionResult;
    }

    const subscription = subscriptionResult.subscription;
    const newCount = (subscription.invoiceCount || 0) + 1;

    // Check if user has reached their limit
    if (subscription.invoiceLimit !== -1 && newCount > subscription.invoiceLimit) {
      return { 
        success: false, 
        error: 'Invoice limit reached. Please upgrade your subscription.',
        limitReached: true 
      };
    }

    await updateSubscription(userId, { invoiceCount: newCount });
    return { success: true, newCount };
  } catch (error) {
    console.error('Error incrementing invoice count:', error);
    return { success: false, error: error.message };
  }
};

export const checkSubscriptionStatus = async (userId) => {
  try {
    const subscriptionResult = await getUserSubscription(userId);
    if (!subscriptionResult.success) {
      return subscriptionResult;
    }

    const subscription = subscriptionResult.subscription;
    const now = new Date();
    const endDate = subscription.endDate?.toDate ? subscription.endDate.toDate() : new Date(subscription.endDate);

    // Check if subscription has expired
    if (now > endDate && subscription.status === 'active') {
      await updateSubscription(userId, { status: 'expired' });
      return { 
        success: true, 
        subscription: { ...subscription, status: 'expired' },
        expired: true 
      };
    }

    return { success: true, subscription, expired: false };
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return { success: false, error: error.message };
  }
};

export const upgradeSubscription = async (userId, newPlan) => {
  try {
    const planDetails = SUBSCRIPTION_PLANS[newPlan];
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + planDetails.duration);

    const updates = {
      plan: newPlan,
      amount: planDetails.price,
      endDate: endDate,
      nextBilling: endDate,
      invoiceLimit: planDetails.invoiceLimit,
      status: 'active'
    };

    await updateSubscription(userId, updates);
    return { success: true };
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    return { success: false, error: error.message };
  }
};
