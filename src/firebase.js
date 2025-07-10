import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // 👈 Add this

const firebaseConfig = {
  apiKey: "AIzaSyBm8YmvnqOh90nW4LTgckY8M7chLbVPYJk",
  authDomain: "invoice-app-adc34.firebaseapp.com",
  projectId: "invoice-app-adc34",
  storageBucket: "invoice-app-adc34.firebasestorage.app",
  messagingSenderId: "322311588382",
  appId: "1:322311588382:web:70ebaadca567f7b0bf7c0f"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app); // 👈 Export Firestore
