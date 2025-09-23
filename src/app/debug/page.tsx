'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/debug/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ProcessStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'error';
  result?: any;
  error?: string | undefined;
}

export default function DebugPage() {
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([
    {
      id: 'extract-keywords',
      name: 'キーワード抽出',
      description: 'ユーザー入力からAIがキーワードを抽出',
      status: 'pending'
    },
    {
      id: 'fetch-news',
      name: 'ニュース取得',
      description: 'RSSフィードからニュース記事を取得',
      status: 'pending'
    },
    {
      id: 'filter-articles',
      name: '記事フィルタリング',
      description: 'キーワードに基づいて記事をフィルタリング',
      status: 'pending'
    },
    {
      id: 'generate-content',
      name: 'コンテンツ生成',
      description: 'AIが記事をまとめてメール用コンテンツを生成',
      status: 'pending'
    },
    {
      id: 'send-email',
      name: 'メール送信',
      description: 'Resend APIでメールを送信',
      status: 'pending'
    }
  ]);

  const [testInput, setTestInput] = useState('');
  const [testEmail, setTestEmail] = useState('tera.mode@gmail.com');

  const runProcess = async () => {
    if (!testInput.trim()) {
      alert('テスト用の検索条件を入力してください');
      return;
    }

    // プロセスをリセット
    setProcessSteps(prev => prev.map(step => ({
      ...step,
      status: 'pending' as const,
      result: undefined,
      error: undefined
    })));

    for (let i = 0; i < processSteps.length; i++) {
      const step = processSteps[i];
      if (!step) continue;

      setProcessSteps(prev => prev.map(s =>
        s.id === step.id ? { ...s, status: 'running' as const } : s
      ));

      try {
        let result: any;

        switch (step.id) {
          case 'extract-keywords':
            result = await testKeywordExtraction(testInput);
            break;
          case 'fetch-news':
            result = await testNewsFetching();
            break;
          case 'filter-articles':
            result = await testArticleFiltering(testInput);
            break;
          case 'generate-content':
            result = await testContentGeneration(testInput);
            break;
          case 'send-email':
            result = await testEmailSending(testEmail, testInput);
            break;
        }

        setProcessSteps(prev => prev.map(s =>
          s.id === step.id ? { ...s, status: 'success' as const, result } : s
        ));
      } catch (error: any) {
        setProcessSteps(prev => prev.map(s =>
          s.id === step.id ? { ...s, status: 'error' as const, error: error.message } : s
        ));
        break; // エラーが発生したら処理を停止
      }

      // 次のステップまで少し待機
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const testKeywordExtraction = async (input: string) => {
    const response = await fetch('/api/claude/extract-keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput: input })
    });

    if (!response.ok) {
      throw new Error(`キーワード抽出エラー: ${response.status}`);
    }

    return await response.json();
  };

  const testNewsFetching = async () => {
    const response = await fetch('/api/news/search?limit=5');

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorDetails = errorData.details || errorData.error || `HTTP ${response.status}`;
      throw new Error(`ニュース取得エラー: ${response.status} - ${errorDetails}`);
    }

    const result = await response.json();

    // 記事が空の場合は失敗として扱う
    if (!result.articles || result.articles.length === 0) {
      const errorInfo = result.errors ? JSON.stringify(result.errors, null, 2) : '記事が見つかりませんでした';
      throw new Error(`ニュース取得に失敗しました: ${errorInfo}`);
    }

    return result;
  };

  const testArticleFiltering = async (input: string) => {
    const response = await fetch('/api/news/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchConditions: [{
          description: input,
          keywords: input.split(' ').slice(0, 5), // GETと同じキーワード処理
          categories: ['テクノロジー']
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorDetails = errorData.details || errorData.error || `HTTP ${response.status}`;
      throw new Error(`記事フィルタリングエラー: ${response.status} - ${errorDetails}`);
    }

    const result = await response.json();

    // 記事が空の場合は失敗として扱う
    if (!result.articles || result.articles.length === 0) {
      const errorInfo = result.errors ? JSON.stringify(result.errors, null, 2) : '条件に合う記事が見つかりませんでした';
      throw new Error(`記事フィルタリングに失敗しました: ${errorInfo}`);
    }

    return result;
  };

  const testContentGeneration = async (input: string) => {
    const response = await fetch('/api/claude/generate-samples', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput: input })
    });

    if (!response.ok) {
      throw new Error(`コンテンツ生成エラー: ${response.status}`);
    }

    return await response.json();
  };

  const testEmailSending = async (email: string, input: string) => {
    const response = await fetch('/api/email/trial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        searchConditions: [{
          description: input,
          keywords: [input],
          categories: ['テクノロジー']
        }],
        userDisplayName: 'デバッグテストユーザー'
      })
    });

    if (!response.ok) {
      throw new Error(`メール送信エラー: ${response.status}`);
    }

    return await response.json();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>;
      case 'success':
        return <div className="text-green-600">✓</div>;
      case 'error':
        return <div className="text-red-600">✗</div>;
      default:
        return <div className="text-gray-400">○</div>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* ナビゲーション */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/debug/user">
            <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">👥 ユーザー管理</h3>
              <p className="text-gray-600">登録ユーザーの管理・統計</p>
            </Card>
          </Link>

          <Link href="/debug/ai">
            <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🤖 AI設定</h3>
              <p className="text-gray-600">AIモデルと設定の確認</p>
            </Card>
          </Link>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🔧 システム情報</h3>
            <p className="text-gray-600">サーバー状態・パフォーマンス</p>
          </Card>
        </div>

        {/* プロセステスト */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">🧪 プロセステスト</h2>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                テスト用検索条件
              </label>
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="例: 人工知能の最新動向について"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                テスト送信先メールアドレス
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <Button
              onClick={runProcess}
              disabled={processSteps.some(step => step.status === 'running')}
              className="w-full md:w-auto"
            >
              プロセステスト実行
            </Button>
          </div>

          {/* プロセス進行状況 */}
          <div className="space-y-3">
            {processSteps.map((step, index) => (
              <div
                key={step.id}
                className={`border rounded-lg p-4 ${getStatusColor(step.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getStatusIcon(step.status)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {index + 1}. {step.name}
                      </h3>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  </div>
                </div>

                {step.result && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">結果:</h4>
                    <pre className="text-xs text-gray-600 overflow-x-auto">
                      {JSON.stringify(step.result, null, 2)}
                    </pre>
                  </div>
                )}

                {step.error && (
                  <div className="mt-3 p-3 bg-red-50 rounded-md">
                    <h4 className="text-sm font-medium text-red-700 mb-2">エラー:</h4>
                    <p className="text-sm text-red-600">{step.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AuthGuard>
  );
}