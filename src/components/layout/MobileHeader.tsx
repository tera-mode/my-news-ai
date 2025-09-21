'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/Button';

export default function MobileHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
      alert('ログアウトに失敗しました。');
    }
  };

  return (
    <>
      {/* モバイル版ヘッダー */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-700 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* ロゴ */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">📰</span>
            </div>
            <span className="text-lg font-bold text-primary-700 dark:text-primary-400">
              News AI
            </span>
          </Link>

          {/* ハンバーガーメニューボタン */}
          <button
            onClick={toggleMobileMenu}
            className="p-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100"
            aria-label="メニューを開く"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* モバイルメニューオーバーレイ */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* 背景オーバーレイ */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={toggleMobileMenu}
          />

          {/* メニュー内容 */}
          <div className="relative ml-auto w-80 max-w-full bg-white dark:bg-secondary-900 h-full shadow-xl">
            {/* ヘッダー */}
            <div className="flex items-center justify-between p-4 border-b border-secondary-200 dark:border-secondary-700">
              <span className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                メニュー
              </span>
              <button
                onClick={toggleMobileMenu}
                className="p-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* ナビゲーション */}
            <nav className="p-4">
              <div className="space-y-2">
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 px-3 py-3 rounded-lg text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                      onClick={toggleMobileMenu}
                    >
                      <span className="text-lg">📊</span>
                      <span className="font-medium">ダッシュボード</span>
                    </Link>
                    <Link
                      href="/history"
                      className="flex items-center gap-3 px-3 py-3 rounded-lg text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                      onClick={toggleMobileMenu}
                    >
                      <span className="text-lg">📈</span>
                      <span className="font-medium">配信履歴</span>
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-3 py-3 rounded-lg text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                      onClick={toggleMobileMenu}
                    >
                      <span className="text-lg">⚙️</span>
                      <span className="font-medium">設定</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/"
                      className="flex items-center gap-3 px-3 py-3 rounded-lg text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                      onClick={toggleMobileMenu}
                    >
                      <span className="text-lg">🏠</span>
                      <span className="font-medium">ホーム</span>
                    </Link>
                    <div className="pt-4 space-y-2">
                      <Link href="/auth/signin" onClick={toggleMobileMenu}>
                        <Button variant="outline" className="w-full">
                          ログイン
                        </Button>
                      </Link>
                      <Link href="/auth/signup" onClick={toggleMobileMenu}>
                        <Button className="w-full">
                          新規登録
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </nav>

            {/* ユーザー情報とログアウト */}
            {user && (
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-secondary-200 dark:border-secondary-700">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
                        {user.displayName || user.email}
                      </p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full text-secondary-600 hover:text-secondary-800"
                  >
                    ログアウト
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}