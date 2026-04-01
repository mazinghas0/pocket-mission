import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBudIcC1zrKzgY8m5k58lvEF30C6u024ZA',
  authDomain: 'pocket-mission.firebaseapp.com',
  projectId: 'pocket-mission',
  storageBucket: 'pocket-mission.firebasestorage.app',
  messagingSenderId: '203814836932',
  appId: '1:203814836932:web:ad008fab80add75d6e8791',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
