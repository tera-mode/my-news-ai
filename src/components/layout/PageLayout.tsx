'use client';

import { ReactNode } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import MobileHeader from '@/components/layout/MobileHeader';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/Button';

interface PageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export default function PageLayout({ children, title, subtitle, className }: PageLayoutProps) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
      alert('ログアウトに失敗しました。');
    }
  };

  return (
    <div className="h-screen flex overflow-hidden pt-14 md:pt-0" style={{height: '100dvh'}}>
      {/* PC版サイドバー */}
      <Sidebar />

      {/* モバイル版ヘッダー */}
      <MobileHeader />

      {/* メインコンテンツエリア */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* PC版ヘッダー */}
        <header className="hidden md:block border-b bg-white dark:bg-secondary-900 border-secondary-200 dark:border-secondary-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-secondary-800 dark:text-secondary-100">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-secondary-600 dark:text-secondary-300">{subtitle}</p>
              )}
            </div>

            {/* ユーザー情報とログアウト */}
            {user && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-secondary-800 dark:text-secondary-100">
                    {user.displayName || 'ユーザー'}
                  </div>
                  <div className="text-xs text-secondary-600 dark:text-secondary-400">
                    {user.email}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-secondary-600 hover:text-secondary-800"
                >
                  ログアウト
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* メインコンテンツ */}
        <div className={`flex-1 flex flex-col min-h-0 ${className || ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
}