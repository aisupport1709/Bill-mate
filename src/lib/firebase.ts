import { initializeApp } from 'firebase/app';
import { browserLocalPersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyCuDLfyyXlVMYSqa3GTL5DzNO1Kw3LRdCo',
  authDomain: 'bill-mate-7c433.firebaseapp.com',
  projectId: 'bill-mate-7c433',
  storageBucket: 'bill-mate-7c433.firebasestorage.app',
  messagingSenderId: '1069135179209',
  appId: '1:1069135179209:web:cfbb717c6e978128264c18',
};

export const isFirebaseConfigured = !firebaseConfig.apiKey.startsWith('PASTE_');

const app = initializeApp(firebaseConfig);

function buildAuth() {
  if (Platform.OS === 'web') {
    return initializeAuth(app, { persistence: browserLocalPersistence });
  }
  // React Native — lazy-require so the web bundle never pulls in AsyncStorage.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getReactNativePersistence } = require('firebase/auth');
  return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
}

export const auth = buildAuth();

export const db = getFirestore(app);
