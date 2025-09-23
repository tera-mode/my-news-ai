import { NextRequest, NextResponse } from 'next/server';
import { verifyDebugAccess, verifyDebugSession } from '@/lib/debug-auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードが必要です' },
        { status: 400 }
      );
    }

    const authResult = verifyDebugAccess(email, password);

    if (!authResult.isValid) {
      return NextResponse.json(
        { error: authResult.message || '認証に失敗しました' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'デバッグモードにログインしました'
    });

    // デバッグセッションクッキーを設定（1時間有効）
    response.cookies.set('debug-session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // 1時間
      path: '/debug'
    });

    return response;
  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: 'デバッグモードからログアウトしました'
  });

  response.cookies.delete('debug-session');
  return response;
}

export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = verifyDebugSession(request);

    if (isAuthenticated) {
      return NextResponse.json({ authenticated: true });
    } else {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}