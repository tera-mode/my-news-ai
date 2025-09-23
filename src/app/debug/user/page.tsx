'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/debug/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string | null;
  lastLoginAt: string | null;
  conditionCount: number;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  totalConditions: number;
  usersWithConditions: number;
}

export default function DebugUserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/debug/users', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setStats(data.stats);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const response = await fetch('/api/debug/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId }),
        credentials: 'include'
      });

      if (response.ok) {
        await fetchUsers(); // リフレッシュ
        setShowDeleteModal(false);
        setSelectedUser(null);
      } else {
        const data = await response.json();
        alert(data.error || 'ユーザーの削除に失敗しました');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('ユーザーの削除中にエラーが発生しました');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ja-JP');
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">👥 ユーザー管理</h1>
            <p className="text-gray-600 mt-1">登録ユーザーの管理と統計</p>
          </div>
          <Link href="/debug">
            <Button variant="outline">← デバッグトップに戻る</Button>
          </Link>
        </div>

        {/* 統計情報 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
              <div className="text-sm text-gray-600">総ユーザー数</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
              <div className="text-sm text-gray-600">アクティブユーザー (30日)</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.totalConditions}</div>
              <div className="text-sm text-gray-600">総検索条件数</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.usersWithConditions}</div>
              <div className="text-sm text-gray-600">条件設定済みユーザー</div>
            </Card>
          </div>
        )}

        {/* 検索バー */}
        <Card className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="メールアドレスまたは名前で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button onClick={fetchUsers} variant="outline">
              更新
            </Button>
          </div>
        </Card>

        {/* ユーザー一覧 */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ユーザー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    登録日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最終ログイン
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    検索条件数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.displayName || 'No Name'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.lastLoginAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.conditionCount > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.conditionCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDeleteModal(true);
                        }}
                      >
                        削除
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? '検索条件に一致するユーザーが見つかりません' : 'ユーザーが見つかりません'}
            </div>
          )}
        </Card>

        {/* 削除確認モーダル */}
        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ユーザー削除の確認
              </h3>
              <p className="text-gray-600 mb-6">
                ユーザー「{selectedUser.email}」とその検索条件をすべて削除しますか？
                この操作は取り消せません。
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedUser(null);
                  }}
                >
                  キャンセル
                </Button>
                <Button
                  variant="danger"
                  onClick={() => deleteUser(selectedUser.id)}
                >
                  削除する
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}