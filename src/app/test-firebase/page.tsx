'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function TestFirebase() {
  const [status, setStatus] = useState<string>('初期化中...');
  const [authStatus, setAuthStatus] = useState<string>('確認中...');
  const [firestoreStatus, setFirestoreStatus] = useState<string>('確認中...');

  useEffect(() => {
    // Firebase初期化テスト
    try {
      console.log('Auth:', auth);
      console.log('Firestore:', db);
      console.log('Environment variables:', {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) + '...',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });

      if (auth) {
        setAuthStatus('✅ Firebase Auth 初期化成功');
      } else {
        setAuthStatus('❌ Firebase Auth 初期化失敗');
      }

      if (db) {
        setFirestoreStatus('✅ Firestore 初期化成功');
      } else {
        setFirestoreStatus('❌ Firestore 初期化失敗');
      }

      setStatus('✅ Firebase設定チェック完了');
    } catch (error) {
      console.error('Firebase initialization error:', error);
      setStatus('❌ Firebase設定エラー: ' + error);
    }
  }, []);

  const testConnection = async () => {
    try {
      setStatus('接続テスト中...');

      // 環境変数チェック
      const requiredEnvVars = [
        'NEXT_PUBLIC_FIREBASE_API_KEY',
        'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
        'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
        'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
        'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
        'NEXT_PUBLIC_FIREBASE_APP_ID'
      ];

      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

      if (missingVars.length > 0) {
        setStatus(`❌ 環境変数が不足: ${missingVars.join(', ')}`);
        return;
      }

      // Firebase接続テスト
      const user = auth.currentUser;
      console.log('Current user:', user);

      setStatus('✅ Firebase接続テスト成功');
    } catch (error) {
      console.error('Connection test error:', error);
      setStatus('❌ 接続テストエラー: ' + error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Firebase設定テスト</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">初期化状態</h3>
              <p className="text-sm">{status}</p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Firebase Auth</h3>
              <p className="text-sm">{authStatus}</p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Firestore</h3>
              <p className="text-sm">{firestoreStatus}</p>
            </div>

            <div>
              <h3 className="font-medium mb-2">環境変数</h3>
              <div className="text-sm space-y-1">
                <p>API Key: {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ 設定済み' : '❌ 未設定'}</p>
                <p>Auth Domain: {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ 設定済み' : '❌ 未設定'}</p>
                <p>Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ 設定済み' : '❌ 未設定'}</p>
                <p>Storage Bucket: {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '✅ 設定済み' : '❌ 未設定'}</p>
                <p>Messaging Sender ID: {process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? '✅ 設定済み' : '❌ 未設定'}</p>
                <p>App ID: {process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✅ 設定済み' : '❌ 未設定'}</p>
              </div>
            </div>

            <Button onClick={testConnection} className="w-full">
              接続テスト実行
            </Button>

            <div className="mt-6 text-center">
              <a href="/auth/signup" className="text-primary-600 hover:text-primary-800">
                ← 新規登録ページに戻る
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}