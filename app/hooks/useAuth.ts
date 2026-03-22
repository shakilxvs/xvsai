'use client';
import { useState, useEffect } from 'react';
import { auth, googleProvider, db } from '@/app/lib/firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { UserStatus } from '@/app/lib/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [rejectionNote, setRejectionNote] = useState<string>('');
  const [statusLoading, setStatusLoading] = useState(false);

  const ADMIN_EMAIL = 'shakilxvs@gmail.com';

  const checkOrCreateUserDoc = async (u: User, provider: 'google' | 'email') => {
    setStatusLoading(true);
    try {
      const ref = doc(db, 'users', u.uid);
      const snap = await getDoc(ref);

      // Admin always approved
      if (u.email === ADMIN_EMAIL) {
        if (!snap.exists()) {
          await setDoc(ref, {
            uid: u.uid,
            email: u.email,
            displayName: u.displayName ?? 'Shakil',
            photoURL: u.photoURL ?? null,
            status: 'approved',
            provider,
            createdAt: serverTimestamp(),
            lastActive: serverTimestamp(),
          });
        } else {
          await updateDoc(ref, { lastActive: serverTimestamp() });
        }
        setUserStatus('approved');
        setStatusLoading(false);
        return;
      }

      if (!snap.exists()) {
        // Check auto-approve setting
        let autoApprove = false;
        try {
          const settingsSnap = await getDoc(doc(db, 'admin', 'settings'));
          autoApprove = settingsSnap.data()?.autoApprove ?? false;
        } catch {}

        await setDoc(ref, {
          uid: u.uid,
          email: u.email ?? '',
          displayName: u.displayName ?? u.email?.split('@')[0] ?? 'User',
          photoURL: u.photoURL ?? null,
          status: autoApprove ? 'approved' : 'pending',
          provider,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
        });
        setUserStatus(autoApprove ? 'approved' : 'pending');
      } else {
        await updateDoc(ref, { lastActive: serverTimestamp() });
        const status = snap.data()?.status as UserStatus ?? 'pending';
        setUserStatus(status);
        setRejectionNote(snap.data()?.rejectionNote ?? '');
      }
    } catch (err) {
      console.error('User doc error:', err);
      setUserStatus('pending');
    }
    setStatusLoading(false);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const provider = u.providerData[0]?.providerId === 'google.com' ? 'google' : 'email';
        await checkOrCreateUserDoc(u, provider);
      } else {
        setUserStatus(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') throw err;
    }
  };

  const registerWithEmail = async (email: string, password: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(cred.user);
    await checkOrCreateUserDoc(cred.user, 'email');
    return cred.user;
  };

  const signInWithEmail = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
    setUserStatus(null);
  };

  const isAdmin = user?.email === ADMIN_EMAIL;
  const isApproved = userStatus === 'approved' || isAdmin;

  return {
    user, loading, userStatus, statusLoading, rejectionNote,
    isAdmin, isApproved,
    signInWithGoogle, registerWithEmail, signInWithEmail,
    resetPassword, logout,
  };
}
