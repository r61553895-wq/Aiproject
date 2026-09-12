import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocFromServer,
} from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Firestore connection

export interface UserAccountData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  tokenBalance: number;
}

/**
 * Sign in using Google Popup
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign out
 */
export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Sync user profile and token balance with Firestore.
 * If new user: initializes with starter tokens (10,000).
 * If existing: loads stored token balance.
 */
export async function syncUserProfile(user: User, localTokensFallback: number): Promise<number> {
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();
      const serverBalance = typeof data.tokenBalance === 'number' ? data.tokenBalance : localTokensFallback;
      await updateDoc(userRef, {
        lastActiveAt: new Date().toISOString(),
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
      });
      return serverBalance;
    } else {
      // First-time registration with Google: grant 10,000 free tokens!
      const initialBalance = 10000;
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        tokenBalance: initialBalance,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      });
      return initialBalance;
    }
  } catch (err) {
    console.error('Failed to sync user profile with Firestore:', err);
    return localTokensFallback;
  }
}

/**
 * Update token balance in Firestore
 */
export async function saveUserTokenBalance(userId: string, newBalance: number): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      tokenBalance: newBalance,
      lastActiveAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to update token balance in Firestore:', err);
  }
}

export { onAuthStateChanged };
export type { User };
