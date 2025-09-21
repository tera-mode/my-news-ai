'use client';

import { useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';

interface MockUser {
  email: string;
  displayName: string;
  uid: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase認証が利用できない場合はモックユーザーをチェック
    if (!auth || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      console.warn('Firebase not configured, checking for mock user');
      const mockUserStr = localStorage.getItem('mockUser');
      if (mockUserStr) {
        const mockUser = JSON.parse(mockUserStr);
        setUser(mockUser);
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      // Firebase認証が利用可能な場合
      if (auth && process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        await signOut(auth);
      }

      // モックユーザーデータのクリア
      localStorage.removeItem('mockUser');
      localStorage.removeItem('mockSearchConditions');

      // ユーザー状態をクリア
      setUser(null);

      // ホームページにリダイレクト
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return { user, loading, logout };
}
