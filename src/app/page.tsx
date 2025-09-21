import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      {/* ヘッダー */}
      <header className="relative z-10">
        <div className="container-news">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">📰</span>
              </div>
              <span className="text-2xl font-bold text-primary-700">News AI</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/signin">
                <Button variant="ghost">ログイン</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>無料で始める</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ヒーローセクション */}
      <main className="relative">
        <div className="container-news">
          <div className="py-20 text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="gradient-text">AI駆動の</span>
              <br />
              <span className="text-secondary-900">ニュース配信</span>
            </h1>
            <p className="text-xl text-secondary-600 mb-8 max-w-3xl mx-auto">
              最新のAI技術で重要なニュースを自動収集・要約し、
              <br />
              あなたのニーズに合わせてカスタマイズされた情報を配信します
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  無料で始める
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  デモを見る
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 特徴セクション */}
        <div className="bg-white py-20">
          <div className="container-news">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-secondary-900 mb-4">
                なぜNews AIを選ぶのか
              </h2>
              <p className="text-lg text-secondary-600">
                従来のニュースアプリとは一線を画すAI機能
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                  AI自動要約
                </h3>
                <p className="text-secondary-600">
                  Claude AIが長い記事を重要なポイントに絞って要約。忙しい日常でも効率的に情報収集。
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                  カスタム配信
                </h3>
                <p className="text-secondary-600">
                  関心のあるカテゴリと配信頻度を設定して、あなただけのニュースレターを受信。
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                  詳細分析
                </h3>
                <p className="text-secondary-600">
                  配信履歴と読了率を追跡し、より良いコンテンツ配信のための洞察を提供。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTAセクション */}
        <div className="news-gradient py-20">
          <div className="container-news text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              今すぐ始めて、情報収集を効率化しましょう
            </h2>
            <p className="text-primary-100 text-lg mb-8">
              無料プランで全機能をお試しいただけます
            </p>
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary">
                無料アカウント作成
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-secondary-900 text-secondary-300 py-12">
        <div className="container-news">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">📰</span>
              </div>
              <span className="text-xl font-bold text-white">News AI</span>
            </div>
            <p className="text-sm">
              © 2024 News AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
