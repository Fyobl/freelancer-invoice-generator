import { doc, setDoc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.js';

export const SUBSCRIPTION_PLANS = {
  trial: {
    name: 'Free Trial',
    price: 0,
    duration: 7, // days
    invoiceLimit: 5,
    features: [
      '5 invoices per trial',
      'Basic invoice templates',
      'Client management',
      'Email integration'
    ]
  },
  premium: {
    name: 'Easy Invoice Subscription',
    price: 9.99,
    duration: 30, // days (monthly)
    invoiceLimit: -1, // unlimited
    features: [
      'Unlimited invoices',
      'Professional templates',
      'Advanced client management',
      'Email integration',
      'Business reports',
      'Product catalog',
      'Company branding',
      'Priority support'
    ]
  }
};

export const createSubscription = async (userId, plan = 'trial', trialDays = 7) => {
  try {
    const planDetails = SUBSCRIPTION_PLANS[plan];
    const startDate = new Date();
    const endDate = new Date(startDate);

    // Use custom trial days if provided for trial, otherwise use plan duration
    const duration = plan === 'trial' ? trialDays : planDetails.duration;
    endDate.setDate(endDate.getDate() + duration);

    const subscriptionData = {
      userId,
      plan,
      status: plan === 'trial' ? 'trial' : 'active',
      amount: planDetails.price,
      startDate: startDate,
      endDate: endDate,
      nextBilling: endDate,
      invoiceCount: 0,
      invoiceLimit: planDetails.invoiceLimit,
      trialDays: plan === 'trial' ? trialDays : null,
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

export const grantTrialFromAdmin = async (userId, trialDays) => {
  try {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + trialDays);

    const updates = {
      plan: 'trial',
      status: 'trial',
      amount: 0,
      endDate: endDate,
      nextBilling: endDate,
      invoiceLimit: 5,
      trialDays: trialDays,
      invoiceCount: 0 // Reset invoice count for new trial
    };

    await updateSubscription(userId, updates);
    return { success: true };
  } catch (error) {
    console.error('Error granting trial:', error);
    return { success: false, error: error.message };
  }
};