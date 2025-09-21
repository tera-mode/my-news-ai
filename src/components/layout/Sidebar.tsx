'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
// import { useState } from 'react'; // 未使用

interface SidebarMenuItem {
  icon: string;
  label: string;
  path: string;
  divider?: boolean;
  requireAuth?: boolean;
  onClick?: () => void;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  // const [showLoginModal, setShowLoginModal] = useState(false); // 未使用

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
      alert('ログアウトに失敗しました。');
    }
  };

  const loggedInMenuItems: SidebarMenuItem[] = [
    { icon: '📊', label: 'ダッシュボード', path: '/dashboard' },
    { icon: '📈', label: '配信履歴', path: '/history' },
    { divider: true, icon: '', label: '', path: '' },
    { icon: '⚙️', label: '設定', path: '/settings' },
    { icon: '👤', label: 'アカウント', path: '/account' },
  ];

  const guestMenuItems: SidebarMenuItem[] = [
    { icon: '🏠', label: 'ホーム', path: '/' },
    { divider: true, icon: '', label: '', path: '' },
    { icon: '🔑', label: 'ログイン', path: '/auth/signin' },
    { icon: '📝', label: '新規登録', path: '/auth/signup' },
  ];

  const menuItems = user ? loggedInMenuItems : guestMenuItems;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-gradient-to-b from-primary-50 via-primary-100 to-primary-200 dark:bg-secondary-900 dark:bg-none border-r border-secondary-200 dark:border-secondary-700 h-full">
      {/* ロゴ・ブランド */}
      <div className="p-6 border-b border-secondary-200 dark:border-secondary-700">
        <Link href="/" className="flex justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">📰</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-primary-700 dark:text-primary-400">
                News AI
              </span>
              <span className="text-xs text-secondary-600 dark:text-secondary-400">
                AI情報配信
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* ナビゲーションメニュー */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item, index) => {
            if (item.divider) {
              return (
                <div
                  key={`divider-${index}`}
                  className="my-4 h-px bg-secondary-200 dark:bg-secondary-700"
                />
              );
            }

            const isActive = pathname === item.path;

            if (item.onClick) {
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200
                    text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 hover:text-secondary-900 dark:hover:text-secondary-100"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.path}
                href={item.path as any}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200
                  ${isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-r-2 border-primary-500'
                    : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 hover:text-secondary-900 dark:hover:text-secondary-100'
                  }
                `}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ユーザー情報 */}
      {user && (
        <div className="p-4 border-t border-secondary-200 dark:border-secondary-700">
          <div className="bg-secondary-50 dark:bg-secondary-700 rounded-lg p-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
                  {user.displayName || user.email}
                </p>
                <p className="text-xs text-secondary-500 dark:text-secondary-400">
                  ニュース配信中
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-xs text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200 py-1 px-2 rounded border border-secondary-300 dark:border-secondary-600 hover:bg-secondary-100 dark:hover:bg-secondary-600 transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}