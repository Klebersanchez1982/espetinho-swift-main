import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export const signInWithEmail = async (email: string, password: string) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
};

export const registerWithEmail = async (email: string, password: string) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  return credential.user;
};

export const signOutUser = async () => {
  await signOut(auth);
};

export const subscribeAuthState = (onUser: (user: User | null) => void) =>
  onAuthStateChanged(auth, (user) => {
    onUser(user);
  });
