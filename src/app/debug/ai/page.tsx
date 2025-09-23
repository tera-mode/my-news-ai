'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/debug/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface AIConfig {
  gemini: {
    hasApiKey: boolean;
    apiKeyPreview: string;
    models: string[];
    currentModel: string;
    usageAreas: string[];
  };
  anthropic: {
    hasApiKey: boolean;
    apiKeyPreview: string;
    models: string[];
    currentModel: string;
    usageAreas: string[];
  };
  resend: {
    hasApiKey: boolean;
    apiKeyPreview: string;
    fromEmail: string;
    usageAreas: string[];
  };
}

interface SystemConfig {
  nodeEnv: string;
  appUrl: string;
  firebase: {
    projectId: string;
    hasAdminKey: boolean;
  };
}

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export default function DebugAIPage() {
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [testingServices, setTestingServices] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchAIConfig();
  }, []);

  const fetchAIConfig = async () => {
    try {
      const response = await fetch('/api/debug/ai', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAiConfig(data.aiConfig);
        setSystemConfig(data.systemConfig);
      } else {
        console.error('Failed to fetch AI config');
      }
    } catch (error) {
      console.error('Error fetching AI config:', error);
    } finally {
      setLoading(false);
    }
  };

  const testService = async (serviceType: string) => {
    setTestingServices(prev => ({ ...prev, [serviceType]: true }));

    try {
      const response = await fetch('/api/debug/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ testType: serviceType }),
        credentials: 'include'
      });

      const result = await response.json();
      setTestResults(prev => ({ ...prev, [serviceType]: result }));
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        [serviceType]: {
          success: false,
          message: 'テストエラー',
          error: error.message
        }
      }));
    } finally {
      setTestingServices(prev => ({ ...prev, [serviceType]: false }));
    }
  };

  const getStatusIcon = (hasKey: boolean) => {
    return hasKey ? (
      <span className="text-green-600">✓ 設定済み</span>
    ) : (
      <span className="text-red-600">✗ 未設定</span>
    );
  };

  const getTestResultIcon = (result: TestResult | undefined) => {
    if (!result) return null;
    return result.success ? (
      <span className="text-green-600">✓ 成功</span>
    ) : (
      <span className="text-red-600">✗ 失敗</span>
    );
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
            <h1 className="text-2xl font-bold text-gray-900">🤖 AI設定確認</h1>
            <p className="text-gray-600 mt-1">AIモデルと設定の状態を確認</p>
          </div>
          <Link href="/debug">
            <Button variant="outline">← デバッグトップに戻る</Button>
          </Link>
        </div>

        {/* システム情報 */}
        {systemConfig && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🔧 システム情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-700">環境:</span>
                <span className="ml-2 text-sm text-gray-600">{systemConfig.nodeEnv}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">アプリURL:</span>
                <span className="ml-2 text-sm text-gray-600">{systemConfig.appUrl}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Firebase Project:</span>
                <span className="ml-2 text-sm text-gray-600">{systemConfig.firebase.projectId}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Firebase Admin:</span>
                <span className="ml-2">{getStatusIcon(systemConfig.firebase.hasAdminKey)}</span>
              </div>
            </div>
          </Card>
        )}

        {/* AI サービス設定 */}
        {aiConfig && (
          <div className="space-y-4">
            {/* Gemini API */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">🔮 Gemini API</h3>
                <div className="flex items-center space-x-3">
                  {getTestResultIcon(testResults.gemini)}
                  <Button
                    size="sm"
                    onClick={() => testService('gemini')}
                    loading={testingServices.gemini || false}
                    disabled={!aiConfig.gemini.hasApiKey}
                  >
                    接続テスト
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">API Key:</span>
                  <span className="ml-2">{getStatusIcon(aiConfig.gemini.hasApiKey)}</span>
                  {aiConfig.gemini.hasApiKey && (
                    <span className="ml-2 text-sm text-gray-500">({aiConfig.gemini.apiKeyPreview})</span>
                  )}
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">使用中モデル:</span>
                  <span className="ml-2 text-sm text-gray-600">{aiConfig.gemini.currentModel}</span>
                </div>
              </div>

              <div className="mb-4">
                <span className="text-sm font-medium text-gray-700">利用可能モデル:</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {aiConfig.gemini.models.map(model => (
                    <span
                      key={model}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        model === aiConfig.gemini.currentModel
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {model}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-700">使用箇所:</span>
                <ul className="mt-1 text-sm text-gray-600">
                  {aiConfig.gemini.usageAreas.map(area => (
                    <li key={area} className="ml-4">• {area}</li>
                  ))}
                </ul>
              </div>

              {testResults.gemini && (
                <div className={`mt-4 p-3 rounded-md ${
                  testResults.gemini.success ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <p className={`text-sm ${
                    testResults.gemini.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {testResults.gemini.message}
                  </p>
                  {testResults.gemini.error && (
                    <p className="text-xs text-red-600 mt-1">{testResults.gemini.error}</p>
                  )}
                </div>
              )}
            </Card>

            {/* Anthropic API */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">🧠 Anthropic API</h3>
                <div className="flex items-center space-x-3">
                  {getTestResultIcon(testResults.anthropic)}
                  <Button
                    size="sm"
                    onClick={() => testService('anthropic')}
                    loading={testingServices.anthropic || false}
                    disabled={!aiConfig.anthropic.hasApiKey}
                    variant="outline"
                  >
                    接続テスト
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">API Key:</span>
                  <span className="ml-2">{getStatusIcon(aiConfig.anthropic.hasApiKey)}</span>
                  {aiConfig.anthropic.hasApiKey && (
                    <span className="ml-2 text-sm text-gray-500">({aiConfig.anthropic.apiKeyPreview})</span>
                  )}
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">モデル:</span>
                  <span className="ml-2 text-sm text-gray-600">{aiConfig.anthropic.currentModel}</span>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-700">使用箇所:</span>
                <ul className="mt-1 text-sm text-gray-600">
                  {aiConfig.anthropic.usageAreas.map(area => (
                    <li key={area} className="ml-4">• {area}</li>
                  ))}
                </ul>
              </div>

              {testResults.anthropic && (
                <div className={`mt-4 p-3 rounded-md ${
                  testResults.anthropic.success ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <p className={`text-sm ${
                    testResults.anthropic.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {testResults.anthropic.message}
                  </p>
                </div>
              )}
            </Card>

            {/* Resend API */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">📧 Resend API</h3>
                <div className="flex items-center space-x-3">
                  {getTestResultIcon(testResults.resend)}
                  <Button
                    size="sm"
                    onClick={() => testService('resend')}
                    loading={testingServices.resend || false}
                    disabled={!aiConfig.resend.hasApiKey}
                  >
                    設定確認
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">API Key:</span>
                  <span className="ml-2">{getStatusIcon(aiConfig.resend.hasApiKey)}</span>
                  {aiConfig.resend.hasApiKey && (
                    <span className="ml-2 text-sm text-gray-500">({aiConfig.resend.apiKeyPreview})</span>
                  )}
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">送信者アドレス:</span>
                  <span className="ml-2 text-sm text-gray-600">{aiConfig.resend.fromEmail}</span>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-700">使用箇所:</span>
                <ul className="mt-1 text-sm text-gray-600">
                  {aiConfig.resend.usageAreas.map(area => (
                    <li key={area} className="ml-4">• {area}</li>
                  ))}
                </ul>
              </div>

              {testResults.resend && (
                <div className={`mt-4 p-3 rounded-md ${
                  testResults.resend.success ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <p className={`text-sm ${
                    testResults.resend.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {testResults.resend.message}
                  </p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* 更新ボタン */}
        <div className="flex justify-center">
          <Button onClick={fetchAIConfig} variant="outline">
            設定を再読み込み
          </Button>
        </div>
      </div>
    </AuthGuard>
  );
}