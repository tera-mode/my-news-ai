'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function Terms() {
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
            <CardTitle>利用規約</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p className="text-secondary-600 mb-6">
              最終更新日: 2024年12月
            </p>

            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-secondary-900 mb-3">第1条（適用）</h2>
                <p className="text-secondary-700">
                  本利用規約（以下「本規約」といいます。）は、当社が提供するNews AIサービス（以下「本サービス」といいます。）の利用条件を定めるものです。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-secondary-900 mb-3">第2条（利用登録）</h2>
                <p className="text-secondary-700">
                  本サービスの利用を希望する方は、本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-secondary-900 mb-3">第3条（禁止事項）</h2>
                <p className="text-secondary-700 mb-3">
                  ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
                </p>
                <ul className="list-disc list-inside text-secondary-700 space-y-1">
                  <li>法令または公序良俗に違反する行為</li>
                  <li>犯罪行為に関連する行為</li>
                  <li>当社、本サービスの他のユーザー、または第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                  <li>当社のサービスの運営を妨害するおそれのある行為</li>
                  <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-secondary-900 mb-3">第4条（本サービスの提供の停止等）</h2>
                <p className="text-secondary-700">
                  当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-secondary-900 mb-3">第5条（著作権）</h2>
                <p className="text-secondary-700">
                  本サービスによって提供される情報、データ、画像等に関する著作権は、当社または当該情報等を提供した第三者に帰属します。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-secondary-900 mb-3">第6条（免責事項）</h2>
                <p className="text-secondary-700">
                  当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-secondary-900 mb-3">第7条（サービス内容の変更等）</h2>
                <p className="text-secondary-700">
                  当社は、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
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