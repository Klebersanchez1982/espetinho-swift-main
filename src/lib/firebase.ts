import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const sanitize = (value: string | undefined) => value?.trim() || '';

const apiKey = sanitize(import.meta.env.VITE_FIREBASE_API_KEY);
const authDomain = sanitize(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
const projectId = sanitize(import.meta.env.VITE_FIREBASE_PROJECT_ID);
const storageBucket = sanitize(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);
const messagingSenderId = sanitize(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID);
const appId = sanitize(import.meta.env.VITE_FIREBASE_APP_ID);

const requiredEnv = {
  VITE_FIREBASE_API_KEY: apiKey,
  VITE_FIREBASE_AUTH_DOMAIN: authDomain,
  VITE_FIREBASE_PROJECT_ID: projectId,
  VITE_FIREBASE_STORAGE_BUCKET: storageBucket,
  VITE_FIREBASE_MESSAGING_SENDER_ID: messagingSenderId,
  VITE_FIREBASE_APP_ID: appId,
};

const missingFirebaseEnv = Object.entries(requiredEnv)
  .filter(([, value]) => !value)
  .map(([key]) => key);

const apiKeyLooksQuoted =
  apiKey.startsWith('"') ||
  apiKey.endsWith('"') ||
  apiKey.startsWith("'") ||
  apiKey.endsWith("'") ||
  apiKey.endsWith(',');

const apiKeyFormatInvalid = apiKey.length > 0 && !/^AIza[0-9A-Za-z_-]{35}$/.test(apiKey);

export const firebaseConfigError =
  missingFirebaseEnv.length > 0
    ? `Configuracao Firebase ausente: ${missingFirebaseEnv.join(', ')}`
    : apiKeyLooksQuoted
      ? 'VITE_FIREBASE_API_KEY parece conter aspas ou virgula. Salve apenas o valor puro no GitHub Secret.'
      : apiKeyFormatInvalid
        ? 'VITE_FIREBASE_API_KEY com formato invalido. Copie novamente da configuracao Web do Firebase.'
    : null;

if (firebaseConfigError) {
  console.error(firebaseConfigError);
}

const firebaseConfig = {
  apiKey: apiKey || 'missing-api-key',
  authDomain: authDomain || 'missing.firebaseapp.com',
  projectId: projectId || 'missing-project-id',
  storageBucket: storageBucket || 'missing.appspot.com',
  messagingSenderId: messagingSenderId || '0',
  appId: appId || 'missing-app-id',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);

export let analytics: ReturnType<typeof getAnalytics> | null = null;

if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(firebaseApp);
    }
  });
}
