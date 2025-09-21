'use client';

import PageLayout from '@/components/layout/PageLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useState } from 'react';

export default function Settings() {
  const [profile, setProfile] = useState({
    displayName: 'ユーザー名',
    email: 'user@example.com',
    notifications: {
      email: true,
      browser: false,
      mobile: true
    },
    preferences: {
      language: 'ja',
      timezone: 'Asia/Tokyo',
      theme: 'light'
    }
  });

  const [apiSettings, setApiSettings] = useState({
    claudeApiKey: '',
    resendApiKey: '',
    webhookUrl: ''
  });

  const handleProfileUpdate = () => {
    // プロフィール更新ロジック
    console.log('Profile updated:', profile);
  };

  const handleApiSettingsUpdate = () => {
    // API設定更新ロジック
    console.log('API settings updated:', apiSettings);
  };

  const handleDeleteAccount = () => {
    if (confirm('本当にアカウントを削除しますか？この操作は取り消せません。')) {
      // アカウント削除ロジック
      console.log('Account deletion requested');
    }
  };

  return (
    <PageLayout
      title="設定"
      subtitle="アカウントとサービスの設定"
    >
      <div className="p-6 space-y-6 overflow-auto">
        {/* プロフィール設定 */}
        <Card>
          <CardHeader>
            <CardTitle>プロフィール設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="表示名"
                value={profile.displayName}
                onChange={(e) => setProfile({
                  ...profile,
                  displayName: e.target.value
                })}
              />
              <Input
                label="メールアドレス"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({
                  ...profile,
                  email: e.target.value
                })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-secondary-700 mb-2 block">
                  言語
                </label>
                <select
                  value={profile.preferences.language}
                  onChange={(e) => setProfile({
                    ...profile,
                    preferences: {
                      ...profile.preferences,
                      language: e.target.value
                    }
                  })}
                  className="flex h-10 w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <option value="ja">日本語</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-secondary-700 mb-2 block">
                  テーマ
                </label>
                <select
                  value={profile.preferences.theme}
                  onChange={(e) => setProfile({
                    ...profile,
                    preferences: {
                      ...profile.preferences,
                      theme: e.target.value
                    }
                  })}
                  className="flex h-10 w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <option value="light">ライト</option>
                  <option value="dark">ダーク</option>
                  <option value="system">システム</option>
                </select>
              </div>
            </div>

            <Button onClick={handleProfileUpdate}>
              プロフィールを更新
            </Button>
          </CardContent>
        </Card>

        {/* 通知設定 */}
        <Card>
          <CardHeader>
            <CardTitle>通知設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {[
                { key: 'email', label: 'メール通知', description: 'ニュース配信とシステム通知をメールで受信' },
                { key: 'browser', label: 'ブラウザ通知', description: 'ブラウザでのプッシュ通知を受信' },
                { key: 'mobile', label: 'モバイル通知', description: 'モバイルアプリでの通知を受信' }
              ].map((notification) => (
                <div key={notification.key} className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-secondary-900">
                      {notification.label}
                    </h4>
                    <p className="text-sm text-secondary-600">
                      {notification.description}
                    </p>
                  </div>
                  <button
                    onClick={() => setProfile({
                      ...profile,
                      notifications: {
                        ...profile.notifications,
                        [notification.key]: !profile.notifications[notification.key as keyof typeof profile.notifications]
                      }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      profile.notifications[notification.key as keyof typeof profile.notifications]
                        ? 'bg-primary-600'
                        : 'bg-secondary-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        profile.notifications[notification.key as keyof typeof profile.notifications]
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* API設定 */}
        <Card>
          <CardHeader>
            <CardTitle>API設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Claude API Key"
              type="password"
              value={apiSettings.claudeApiKey}
              onChange={(e) => setApiSettings({
                ...apiSettings,
                claudeApiKey: e.target.value
              })}
              placeholder="sk-ant-..."
              helperText="記事要約に使用するClaude APIキー"
            />

            <Input
              label="Resend API Key"
              type="password"
              value={apiSettings.resendApiKey}
              onChange={(e) => setApiSettings({
                ...apiSettings,
                resendApiKey: e.target.value
              })}
              placeholder="re_..."
              helperText="メール配信に使用するResend APIキー"
            />

            <Input
              label="Webhook URL"
              value={apiSettings.webhookUrl}
              onChange={(e) => setApiSettings({
                ...apiSettings,
                webhookUrl: e.target.value
              })}
              placeholder="https://your-domain.com/webhook"
              helperText="配信イベントを受信するWebhook URL（オプション）"
            />

            <Button onClick={handleApiSettingsUpdate}>
              API設定を保存
            </Button>
          </CardContent>
        </Card>

        {/* セキュリティ */}
        <Card>
          <CardHeader>
            <CardTitle>セキュリティ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 border border-secondary-200 rounded-lg">
                <h4 className="font-medium text-secondary-900 mb-2">
                  パスワード変更
                </h4>
                <p className="text-sm text-secondary-600 mb-3">
                  定期的なパスワード変更をお勧めします
                </p>
                <Button variant="outline">
                  パスワードを変更
                </Button>
              </div>

              <div className="p-4 border border-secondary-200 rounded-lg">
                <h4 className="font-medium text-secondary-900 mb-2">
                  二段階認証
                </h4>
                <p className="text-sm text-secondary-600 mb-3">
                  アカウントのセキュリティを強化できます
                </p>
                <Button variant="outline">
                  二段階認証を設定
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 危険な操作 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-error-600">危険な操作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 border border-error-200 rounded-lg bg-error-50">
              <h4 className="font-medium text-error-900 mb-2">
                アカウント削除
              </h4>
              <p className="text-sm text-error-700 mb-4">
                アカウントを削除すると、すべてのデータが永久に失われます。この操作は取り消せません。
              </p>
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
              >
                アカウントを削除
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}