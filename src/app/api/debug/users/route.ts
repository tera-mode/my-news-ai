import { NextRequest, NextResponse } from 'next/server';
import { verifyDebugSession } from '@/lib/debug-auth';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // デバッグ認証確認
    if (!verifyDebugSession(request)) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // Firebase Admin SDK が利用できない場合
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK が設定されていません' },
        { status: 503 }
      );
    }

    // ユーザー一覧を取得
    const usersSnapshot = await adminDb.collection('users').orderBy('createdAt', 'desc').get();

    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString() || null,
      lastLoginAt: doc.data().lastLoginAt?.toDate()?.toISOString() || null
    }));

    // 検索条件も取得
    const conditionsSnapshot = await adminDb.collection('searchConditions').get();
    const userConditionCounts = conditionsSnapshot.docs.reduce((acc, doc) => {
      const userId = doc.data().userId;
      acc[userId] = (acc[userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // ユーザーに条件数を追加
    const usersWithStats = users.map(user => ({
      ...user,
      conditionCount: userConditionCounts[user.id] || 0
    }));

    // 統計情報を計算
    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(user =>
        user.lastLoginAt &&
        new Date(user.lastLoginAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length,
      totalConditions: conditionsSnapshot.size,
      usersWithConditions: Object.keys(userConditionCounts).length
    };

    return NextResponse.json({
      users: usersWithStats,
      stats
    });

  } catch (error) {
    console.error('Debug users fetch error:', error);
    return NextResponse.json(
      { error: 'ユーザー情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // デバッグ認証確認
    if (!verifyDebugSession(request)) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // Firebase Admin SDK が利用できない場合
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK が設定されていません' },
        { status: 503 }
      );
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    // ユーザーの検索条件を削除
    const conditionsSnapshot = await adminDb.collection('searchConditions')
      .where('userId', '==', userId)
      .get();

    const batch = adminDb.batch();
    conditionsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // ユーザー情報を削除
    batch.delete(adminDb.collection('users').doc(userId));

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: 'ユーザーが削除されました'
    });

  } catch (error) {
    console.error('Debug user delete error:', error);
    return NextResponse.json(
      { error: 'ユーザーの削除に失敗しました' },
      { status: 500 }
    );
  }
}