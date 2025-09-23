import { NextRequest, NextResponse } from 'next/server';
import { verifyDebugSession } from '@/lib/debug-auth';

export async function GET(request: NextRequest) {
  try {
    // デバッグ認証確認
    if (!verifyDebugSession(request)) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // 環境変数チェック
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    // AI設定情報
    const aiConfig = {
      gemini: {
        hasApiKey: !!geminiApiKey,
        apiKeyPreview: geminiApiKey ? `${geminiApiKey.substring(0, 8)}...` : 'なし',
        models: [
          'gemini-1.5-pro',
          'gemini-1.5-flash',
          'gemini-1.0-pro'
        ],
        currentModel: 'gemini-1.5-pro',
        usageAreas: [
          'キーワード抽出',
          'コンテンツ生成',
          'ニュース要約'
        ]
      },
      anthropic: {
        hasApiKey: !!anthropicApiKey,
        apiKeyPreview: anthropicApiKey ? `${anthropicApiKey.substring(0, 12)}...` : 'なし',
        models: [
          'claude-3-5-sonnet-20241022',
          'claude-3-haiku-20240307'
        ],
        currentModel: 'claude-3-5-sonnet-20241022',
        usageAreas: [
          '代替システム（現在未使用）'
        ]
      },
      resend: {
        hasApiKey: !!resendApiKey,
        apiKeyPreview: resendApiKey ? `${resendApiKey.substring(0, 8)}...` : 'なし',
        fromEmail: 'news@my-news-ai.com',
        usageAreas: [
          'トライアルメール送信',
          '定期メール配信'
        ]
      }
    };

    // システム設定
    const systemConfig = {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'unknown',
      firebase: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'unknown',
        hasAdminKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY
      }
    };

    return NextResponse.json({
      aiConfig,
      systemConfig,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug AI config error:', error);
    return NextResponse.json(
      { error: 'AI設定情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // デバッグ認証確認
    if (!verifyDebugSession(request)) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { testType } = await request.json();

    switch (testType) {
      case 'gemini':
        return await testGeminiConnection();
      case 'anthropic':
        return await testAnthropicConnection();
      case 'resend':
        return await testResendConnection();
      default:
        return NextResponse.json(
          { error: '無効なテストタイプです' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Debug AI test error:', error);
    return NextResponse.json(
      { error: 'AIテストに失敗しました' },
      { status: 500 }
    );
  }
}

async function testGeminiConnection() {
  try {
    const response = await fetch('/api/test/models');
    const data = await response.json();

    return NextResponse.json({
      success: response.ok,
      data,
      message: response.ok ? 'Gemini API接続成功' : 'Gemini API接続失敗'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Gemini API接続エラー'
    });
  }
}

async function testAnthropicConnection() {
  // Anthropic APIのテスト（現在は使用していないが、設定確認のため）
  return NextResponse.json({
    success: false,
    message: 'Anthropic APIは現在使用していません'
  });
}

async function testResendConnection() {
  try {
    // Resend APIの設定チェック
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        message: 'Resend API Keyが設定されていません'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Resend API設定確認済み（実際の送信テストはトライアルメール機能で確認してください）'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Resend API設定エラー'
    });
  }
}