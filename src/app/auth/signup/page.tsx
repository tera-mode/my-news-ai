'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { createUser } from '@/lib/firestore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function SignUp() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // エラーをクリア
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = '名前を入力してください';
    }

    if (!formData.email) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください';
    } else if (formData.password.length < 8) {
      newErrors.password = 'パスワードは8文字以上で入力してください';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'パスワードは大文字、小文字、数字を含む必要があります';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
    }

    if (!agreedToTerms) {
      newErrors.terms = '利用規約とプライバシーポリシーに同意してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log('Starting Firebase auth...');
      console.log('Auth object:', auth);
      console.log('Form data:', { email: formData.email, displayName: formData.displayName });

      // Firebaseが利用できない場合のフォールバック
      if (!auth || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        console.warn('Firebase is not properly configured. Using mock authentication.');

        // モック認証（開発用）
        localStorage.setItem('mockUser', JSON.stringify({
          email: formData.email,
          displayName: formData.displayName,
          uid: 'mock-' + Date.now()
        }));

        alert('開発モード: モック認証でダッシュボードに移動します');
        router.push('/dashboard');
        return;
      }

      // Firebase Auth 新規登録処理
      console.log('Creating user with email and password...');
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      console.log('User credential created:', userCredential);

      // プロフィール更新
      console.log('Updating profile...');
      await updateProfile(userCredential.user, {
        displayName: formData.displayName
      });
      console.log('Profile updated');

      // Firestoreにユーザー情報を保存（エラーでも続行）
      console.log('Saving to Firestore...');
      try {
        await createUser({
          email: formData.email,
          displayName: formData.displayName,
          photoURL: null
        });
        console.log('User saved to Firestore');
      } catch (firestoreError) {
        console.warn('Firestore save failed, but continuing:', firestoreError);
        // Firestoreエラーでも認証は成功しているので続行
      }

      console.log('User created successfully:', userCredential.user);

      // 成功時はダッシュボードにリダイレクト
      console.log('Redirecting to dashboard...');
      router.push('/dashboard');
      console.log('Router.push called');
    } catch (error: any) {
      console.error('Sign up error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error object:', error);

      let errorMessage = '登録に失敗しました。しばらく経ってから再度お試しください。';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'このメールアドレスは既に使用されています。';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'パスワードが弱すぎます。より強力なパスワードを設定してください。';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '無効なメールアドレスです。';
      }

      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setIsLoading(true);

      // Google認証処理
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Firestoreにユーザー情報を保存（新規ユーザーの場合）
      try {
        await createUser({
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL
        });
        console.log('User saved to Firestore via Google');
      } catch (firestoreError) {
        // ユーザーが既に存在する場合やFirestoreエラーは無視
        console.warn('Firestore save failed (Google), but continuing:', firestoreError);
      }

      console.log('Google sign up successful:', user);

      // 成功時はダッシュボードにリダイレクト
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Google sign up error:', error);

      let errorMessage = 'Googleログインに失敗しました。';

      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'ログインがキャンセルされました。';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'ポップアップがブロックされました。ポップアップを許可してください。';
      }

      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">📰</span>
            </div>
            <span className="text-2xl font-bold text-primary-700">News AI</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">新規登録</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <div className="p-3 bg-error-50 border border-error-200 rounded text-error-700 text-sm">
                  {errors.general}
                </div>
              )}

              <Input
                label="名前"
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                {...(errors.displayName && { error: errors.displayName })}
                placeholder="田中太郎"
                required
              />

              <Input
                label="メールアドレス"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                {...(errors.email && { error: errors.email })}
                placeholder="your@email.com"
                required
              />

              <Input
                label="パスワード"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                {...(errors.password && { error: errors.password })}
                placeholder="••••••••"
                helperText="8文字以上、大文字・小文字・数字を含む"
                required
              />

              <Input
                label="パスワード（確認）"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                {...(errors.confirmPassword && { error: errors.confirmPassword })}
                placeholder="••••••••"
                required
              />

              <div className="space-y-3">
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-secondary-600">
                    <Link href="/terms" className="text-primary-600 hover:text-primary-800">
                      利用規約
                    </Link>
                    および
                    <Link href="/privacy" className="text-primary-600 hover:text-primary-800">
                      プライバシーポリシー
                    </Link>
                    に同意します
                  </span>
                </label>
                {errors.terms && (
                  <p className="text-sm text-error-600">{errors.terms}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={isLoading}
              >
                アカウント作成
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-secondary-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-secondary-500">または</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={handleGoogleSignUp}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Googleで登録
              </Button>
            </div>

            <div className="mt-6 text-center text-sm">
              <span className="text-secondary-600">すでにアカウントをお持ちですか？ </span>
              <Link
                href="/auth/signin"
                className="text-primary-600 hover:text-primary-800 font-medium"
              >
                ログイン
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-xs text-secondary-500">
          <Link href="/" className="hover:text-secondary-700">
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}