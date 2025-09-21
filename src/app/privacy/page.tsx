'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">📰</span>
            </div>
            <span className="text-2xl font-bold text-primary-700">News AI</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>プライバシーポリシー</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p className="text-secondary-600 mb-6">
              最終更新日: 2024年12月
            </p>

            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-secondary-900 mb-3">1. 収集する情報</h2>
                <p className="text-secondary-700 mb-3">
                  当社は、本サービスの提供において、以下の情報を収集いたします。
                </p>
                <ul className="list-disc list-inside text-secondary-700 space-y-1">
                  <li>アカウント情報（メールアドレス、氏名等）</li>
                  <li>サービス利用履歴</li>
                  <li>設定した検索条件および興味のあるカテゴリ</li>
                  <li>デバイス情報およびアクセスログ</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-secondary-900 mb-3">2. 情報の利用目的</h2>
                <p className="text-secondary-700 mb-3">
                  収集した個人情報は、以下の目的で利用いたします。
                </p>
                <ul className="list-disc list-inside text-secondary-700 space-y-1">
                  <li>本サービスの提供・運営のため</li>
                  <li>ユーザーの設定に基づいたニュース配信のため</li>
                  <li>サービス改善および新機能開発のため</li>
                  <li>お問い合わせへの対応のため</li>
                  <li>利用規約違反への対応のため</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-secondary-900 mb-3">3. 情報の第三者提供</h2>
                <p className="text-secondary-700">
                  当社は、以下の場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。
                </p>
                <ul className="list-disc list-inside text-secondary-700 space-y-1 mt-3">
                  <li>法令に基づく場合</li>
                  <li>人の生命、身体または財産の保護のために必要がある場合</li>
                  <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-secondary-900 mb-3">4. Cookieの使用</h2>
                <p className="text-secondary-700">
                  本サービスは、ユーザーの利便性向上のためにCookieを使用する場合があります。Cookieを無効にしてもサービスをご利用いただけますが、一部機能が制限される場合があります。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-secondary-900 mb-3">5. 個人情報の安全管理</h2>
                <p className="text-secondary-700">
                  当社は、個人情報の漏洩、滅失または毀損の防止その他の個人情報の安全管理のために必要かつ適切な措置を講じます。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-secondary-900 mb-3">6. 個人情報の開示・訂正等</h2>
                <p className="text-secondary-700">
                  ユーザーは、当社の保有する自己の個人情報について、開示、訂正、追加、削除、利用停止、消去および第三者提供の停止を請求することができます。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-secondary-900 mb-3">7. プライバシーポリシーの変更</h2>
                <p className="text-secondary-700">
                  本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく、変更することができるものとします。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-secondary-900 mb-3">8. お問い合わせ窓口</h2>
                <p className="text-secondary-700">
                  本ポリシーに関するお問い合わせは、本サービス内のお問い合わせフォームからご連絡ください。
                </p>
              </section>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link
            href="/auth/signup"
            className="text-primary-600 hover:text-primary-800 font-medium"
          >
            ← 新規登録に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}