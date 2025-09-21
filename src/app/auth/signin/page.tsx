'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { createUser } from '@/lib/firestore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function SignIn() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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

    if (!formData.email) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください';
    } else if (formData.password.length < 6) {
      newErrors.password = 'パスワードは6文字以上で入力してください';
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
      // Firebase Auth ログイン処理
      await signInWithEmailAndPassword(auth, formData.email, formData.password);

      console.log('Sign in successful');

      // 成功時はダッシュボードにリダイレクト
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Sign in error:', error);

      let errorMessage = 'ログインに失敗しました。メールアドレスとパスワードを確認してください。';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'アカウントが見つかりません。新規登録をお試しください。';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'パスワードが間違っています。';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '無効なメールアドレスです。';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'ログイン試行回数が多すぎます。しばらく経ってから再度お試しください。';
      }

      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
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
        console.log('User saved to Firestore via Google signin');
      } catch (firestoreError) {
        // ユーザーが既に存在する場合やFirestoreエラーは無視
        console.warn('Firestore save failed (Google signin), but continuing:', firestoreError);
      }

      console.log('Google sign in successful:', user);

      // 成功時はダッシュボードにリダイレクト
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Google sign in error:', error);

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
            <CardTitle className="text-center">ログイン</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <div className="p-3 bg-error-50 border border-error-200 rounded text-error-700 text-sm">
                  {errors.general}
                </div>
              )}

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
                required
              />

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-secondary-600">ログイン状態を保持</span>
                </label>
                <Link
                  href={"/auth/forgot-password" as any}
                  className="text-primary-600 hover:text-primary-800"
                >
                  パスワードを忘れた方
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={isLoading}
              >
                ログイン
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
                onClick={handleGoogleSignIn}
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
                Googleでログイン
              </Button>
            </div>

            <div className="mt-6 text-center text-sm">
              <span className="text-secondary-600">アカウントをお持ちでない方は </span>
              <Link
                href="/auth/signup"
                className="text-primary-600 hover:text-primary-800 font-medium"
              >
                新規登録
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