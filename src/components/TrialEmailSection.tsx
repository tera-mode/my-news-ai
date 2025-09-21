'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import type { SearchCondition } from '@/types';

interface TrialEmailSectionProps {
  userEmail: string;
  userDisplayName: string;
  searchConditions: SearchCondition[];
}

export default function TrialEmailSection({
  userEmail,
  userDisplayName,
  searchConditions
}: TrialEmailSectionProps) {
  const [email, setEmail] = useState(userEmail);
  const [isEditing, setIsEditing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSendTrialEmail = async () => {
    if (!email || searchConditions.length === 0) {
      setMessage({
        type: 'error',
        text: searchConditions.length === 0
          ? '検索条件を設定してからトライアルメールを送信してください。'
          : 'メールアドレスを入力してください。'
      });
      return;
    }

    setIsSending(true);
    setMessage(null);

    try {
      const response = await fetch('/api/email/trial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          searchConditions,
          userDisplayName,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: result.message || 'トライアルメールを送信しました！'
        });
      } else {
        throw new Error(result.error || 'メール送信に失敗しました');
      }
    } catch (error) {
      console.error('Trial email error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'メール送信に失敗しました'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleEmailEdit = () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-xl">📧</span>
          トライアルメール送信
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-secondary-600 mb-4">
          設定した検索条件に基づくサンプルニュースレポートを今すぐお試しいただけます。
        </div>

        {/* 配信先メールアドレス */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-secondary-700">
            配信先メールアドレス
          </label>
          <div className="flex gap-2">
            {isEditing ? (
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1"
              />
            ) : (
              <div className="flex-1 px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-md text-secondary-700">
                {email}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleEmailEdit}
              className="shrink-0"
            >
              {isEditing ? '保存' : '編集'}
            </Button>
          </div>
        </div>

        {/* 検索条件数の表示 */}
        <div className="bg-primary-50 border border-primary-200 rounded-md p-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-primary-600 font-medium">
              設定済み検索条件: {searchConditions.length}件
            </span>
          </div>
          {searchConditions.length > 0 && (
            <div className="mt-2 text-xs text-primary-600">
              {searchConditions.slice(0, 2).map((condition) => (
                <div key={condition.id} className="truncate">
                  • {condition.description}
                </div>
              ))}
              {searchConditions.length > 2 && (
                <div className="text-primary-500">
                  ...他 {searchConditions.length - 2}件
                </div>
              )}
            </div>
          )}
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div
            className={`p-3 rounded-md text-sm ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* 送信ボタン */}
        <Button
          onClick={handleSendTrialEmail}
          loading={isSending}
          disabled={isSending || searchConditions.length === 0}
          className="w-full"
        >
          {isSending ? 'トライアルメール送信中...' : 'トライアルメールを送信'}
        </Button>

        {searchConditions.length === 0 && (
          <div className="text-xs text-secondary-500 text-center">
            まず上記で検索条件を設定してください
          </div>
        )}
      </CardContent>
    </Card>
  );
}