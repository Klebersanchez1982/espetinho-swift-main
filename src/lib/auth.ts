import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { deleteApp, initializeApp } from 'firebase/app';
import { auth, firebaseApp } from '@/lib/firebase';

export const APP_USER_EMAIL_DOMAIN = 'nabrasa.local';
export const MASTER_USERNAME = 'master';
export const MASTER_DEFAULT_PASSWORD = 'Master@2026!';

export const normalizeUsername = (username: string) => username.trim().toLowerCase();

export const usernameToEmail = (username: string) => {
  const normalized = normalizeUsername(username);
  return `${normalized}@${APP_USER_EMAIL_DOMAIN}`;
};

const getFirebaseErrorCode = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code?: unknown }).code ?? '');
  }

  return '';
};

export const signInWithEmail = async (email: string, password: string) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
};

export const signInWithUsername = async (username: string, password: string) => {
  const normalized = normalizeUsername(username);
  const email = normalized.includes('@') ? normalized : usernameToEmail(normalized);
  return signInWithEmail(email, password);
};

export const registerWithEmail = async (email: string, password: string) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  return credential.user;
};

export const createAuthUserWithUsername = async (username: string, password: string) => {
  const normalized = normalizeUsername(username);
  if (!/^[a-z0-9._-]{3,40}$/.test(normalized)) {
    throw new Error('Usuario invalido. Use 3-40 caracteres: letras, numeros, ponto, underline ou hifen.');
  }

  const email = usernameToEmail(normalized);
  const secondaryAppName = `provision-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const secondaryApp = initializeApp(firebaseApp.options, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    return { uid: credential.user.uid, email, username: normalized };
  } catch (error) {
    const code = getFirebaseErrorCode(error);
    if (code === 'auth/email-already-in-use') {
      throw new Error('Usuario ja existe. Escolha outro nome de usuario.');
    }
    if (code === 'auth/weak-password') {
      throw new Error('Senha fraca. Use ao menos 6 caracteres.');
    }
    throw error;
  } finally {
    await signOut(secondaryAuth).catch(() => undefined);
    await deleteApp(secondaryApp).catch(() => undefined);
  }
};

export const signInOrCreateMaster = async () => {
  const email = usernameToEmail(MASTER_USERNAME);

  try {
    return await signInWithEmail(email, MASTER_DEFAULT_PASSWORD);
  } catch (error) {
    const code = getFirebaseErrorCode(error);
    // Com Email Enumeration Protection, Firebase pode retornar invalid-credential
    // mesmo quando o usuario ainda nao existe.
    if (code !== 'auth/user-not-found' && code !== 'auth/invalid-credential') {
      throw error;
    }
  }

  try {
    const credential = await registerWithEmail(email, MASTER_DEFAULT_PASSWORD);
    return credential;
  } catch (error) {
    const code = getFirebaseErrorCode(error);
    if (code === 'auth/email-already-in-use' || code === 'auth/invalid-credential') {
      throw new Error('Conta master ja existe com credenciais diferentes. Use o botao de master ou ajuste a senha no Firebase Auth.');
    }

    throw error;
  }
};

export const signOutUser = async () => {
  await signOut(auth);
};

export const subscribeAuthState = (onUser: (user: User | null) => void) =>
  onAuthStateChanged(auth, (user) => {
    onUser(user);
  });
