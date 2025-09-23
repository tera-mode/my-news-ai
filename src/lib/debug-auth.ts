import { NextRequest, NextResponse } from 'next/server';

export interface DebugAuthResult {
  isValid: boolean;
  isAdmin: boolean;
  message?: string;
}

export function verifyDebugAccess(email: string, password: string): DebugAuthResult {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return {
      isValid: false,
      isAdmin: false,
      message: '管理者認証が設定されていません'
    };
  }

  if (email === adminEmail && password === adminPassword) {
    return {
      isValid: true,
      isAdmin: true
    };
  }

  return {
    isValid: false,
    isAdmin: false,
    message: 'メールアドレスまたはパスワードが正しくありません'
  };
}

export function isAdminUser(email?: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  return email === adminEmail;
}

export function createDebugAuthResponse(message: string, status: number = 401): NextResponse {
  return NextResponse.json(
    { error: message },
    { status }
  );
}

export function verifyDebugSession(request: NextRequest): boolean {
  const debugSession = request.cookies.get('debug-session');
  return debugSession?.value === 'authenticated';
}