'use client';

import PageLayout from '@/components/layout/PageLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import SearchConditionForm from '@/components/SearchConditionForm';
import TrialEmailSection from '@/components/TrialEmailSection';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { saveSearchConditions, getUserSearchConditions } from '@/lib/firestore';
import type { SearchConditionInput, SearchCondition } from '@/types';

export default function Dashboard() {
  const { user } = useAuth();
  const [categories, setCategories] = useState(['テクノロジー', 'ビジネス']);
  const [frequency, setFrequency] = useState('daily');
  const [email, setEmail] = useState('user@example.com');
  const [searchConditions, setSearchConditions] = useState<SearchCondition[]>([]);
  const [showConditionForm, setShowConditionForm] = useState(false);
  const [loadingConditions, setLoadingConditions] = useState(false);

  const handleAddCategory = (category: string) => {
    if (category && !categories.includes(category)) {
      setCategories([...categories, category]);
    }
  };

  const handleRemoveCategory = (category: string) => {
    setCategories(categories.filter(c => c !== category));
  };

  const availableCategories = [
    'テクノロジー', 'ビジネス', '政治', 'スポーツ',
    'エンターテイメント', '健康', '科学', '社会', '経済'
  ];

  // 既存の検索条件を読み込み
  useEffect(() => {
    const loadSearchConditions = async () => {
      if (!user?.uid) return;

      setLoadingConditions(true);
      try {
        // モックユーザーの場合はローカルストレージから読み込み
        if (user.uid.startsWith('mock-')) {
          const mockConditionsStr = localStorage.getItem('mockSearchConditions');
          if (mockConditionsStr) {
            const mockConditions = JSON.parse(mockConditionsStr);
            setSearchConditions(mockConditions.map((condition: any, index: number) => ({
              id: `mock-${index}`,
              userId: user.uid,
              description: condition.description,
              priority: condition.priority,
              keywords: condition.keywords,
              extractedKeywords: condition.keywords,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            })));
          }
        } else {
          // Firebase読み込み
          const conditions = await getUserSearchConditions(user.uid);
          setSearchConditions(conditions);
        }
      } catch (error) {
        console.error('Failed to load search conditions:', error);
      } finally {
        setLoadingConditions(false);
      }
    };

    loadSearchConditions();
  }, [user]);

  // 検索条件保存ハンドラー
  const handleSaveConditions = async (conditions: SearchConditionInput[]) => {
    if (!user?.uid) {
      alert('ユーザーがログインしていません。');
      return;
    }

    try {
      // モックユーザーの場合はローカルストレージに保存
      if (user.uid.startsWith('mock-')) {
        localStorage.setItem('mockSearchConditions', JSON.stringify(conditions));
        setSearchConditions(conditions.map((condition, index) => ({
          id: `mock-${index}`,
          userId: user.uid,
          description: condition.description,
          priority: condition.priority,
          keywords: condition.keywords,
          extractedKeywords: condition.keywords,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })));
        setShowConditionForm(false);
        alert('検索条件を保存しました（開発モード）。');
        return;
      }

      // Firebase保存
      await saveSearchConditions(user.uid, conditions);
      // 保存後に最新の条件を再読み込み
      const updatedConditions = await getUserSearchConditions(user.uid);
      setSearchConditions(updatedConditions);
      setShowConditionForm(false);
      alert('検索条件を保存しました。');
    } catch (error) {
      console.error('Failed to save search conditions:', error);
      alert('検索条件の保存に失敗しました。');
    }
  };

  return (
    <PageLayout
      title="ダッシュボード"
      subtitle="ニュース配信の設定と管理"
    >
      <div className="p-6 space-y-6 overflow-auto">
        {/* 設定概要 */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-primary-600">📊</span>
                配信状況
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success-600 mb-1">
                アクティブ
              </div>
              <p className="text-sm text-secondary-600">
                毎日午前8時に配信中
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-primary-600">📈</span>
                今月の配信数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary-600 mb-1">
                15
              </div>
              <p className="text-sm text-secondary-600">
                平均開封率: 78%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-primary-600">🎯</span>
                選択カテゴリ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary-800 mb-1">
                {categories.length}
              </div>
              <p className="text-sm text-secondary-600">
                個のカテゴリを配信
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 情報収集条件設定 */}
        {showConditionForm ? (
          <SearchConditionForm
            onSave={handleSaveConditions}
            existingConditions={searchConditions.map(condition => ({
              description: condition.description,
              priority: condition.priority,
              keywords: condition.keywords
            }))}
            maxConditions={3}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>情報収集条件</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConditionForm(true)}
                >
                  {searchConditions.length > 0 ? '条件を編集' : '条件を設定'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingConditions ? (
                <div className="text-center py-8">
                  <div className="text-secondary-600">条件を読み込み中...</div>
                </div>
              ) : searchConditions.length > 0 ? (
                <div className="space-y-4">
                  {searchConditions.map((condition, index) => (
                    <div key={condition.id} className="border border-secondary-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-secondary-900">
                          条件 {index + 1}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          condition.priority === 1
                            ? 'bg-error-100 text-error-800'
                            : condition.priority === 2
                            ? 'bg-warning-100 text-warning-800'
                            : 'bg-success-100 text-success-800'
                        }`}>
                          {condition.priority === 1 ? '高優先度' : condition.priority === 2 ? '中優先度' : '低優先度'}
                        </span>
                      </div>
                      <p className="text-secondary-700 mb-3">{condition.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {condition.keywords.map((keyword, keywordIndex) => (
                          <span
                            key={keywordIndex}
                            className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-sm"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-secondary-600 mb-4">
                    まだ情報収集条件が設定されていません
                  </div>
                  <Button onClick={() => setShowConditionForm(true)}>
                    最初の条件を設定
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* トライアルメール送信 */}
        {user && (
          <TrialEmailSection
            userEmail={user.email || 'user@example.com'}
            userDisplayName={user.displayName || 'ユーザー'}
            searchConditions={searchConditions}
          />
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* 配信設定 */}
          <Card>
            <CardHeader>
              <CardTitle>配信設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-secondary-700 mb-2 block">
                  配信先メールアドレス
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-secondary-700 mb-2 block">
                  配信頻度
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['daily', 'weekly', 'monthly'].map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setFrequency(freq)}
                      className={`p-2 text-sm rounded border transition-colors ${
                        frequency === freq
                          ? 'bg-primary-50 border-primary-300 text-primary-700'
                          : 'border-secondary-300 hover:bg-secondary-50'
                      }`}
                    >
                      {freq === 'daily' ? '毎日' : freq === 'weekly' ? '週1回' : '月1回'}
                    </button>
                  ))}
                </div>
              </div>

              <Button className="w-full">
                配信設定を保存
              </Button>
            </CardContent>
          </Card>

          {/* カテゴリ選択 */}
          <Card>
            <CardHeader>
              <CardTitle>興味のあるカテゴリ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <span
                    key={category}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                  >
                    {category}
                    <button
                      onClick={() => handleRemoveCategory(category)}
                      className="ml-1 text-primary-600 hover:text-primary-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div>
                <label className="text-sm font-medium text-secondary-700 mb-2 block">
                  カテゴリを追加
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableCategories
                    .filter(cat => !categories.includes(cat))
                    .map((category) => (
                    <button
                      key={category}
                      onClick={() => handleAddCategory(category)}
                      className="p-2 text-sm text-left border border-secondary-300 rounded hover:bg-secondary-50 transition-colors"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 最近の記事プレビュー */}
        <Card>
          <CardHeader>
            <CardTitle>最新のニュース</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  title: 'OpenAI、GPT-5の開発を発表',
                  summary: '次世代の大規模言語モデルGPT-5の開発が進行中であることを発表。より高精度な推論と多言語対応を実現予定。',
                  category: 'テクノロジー',
                  time: '2時間前'
                },
                {
                  title: '日本の半導体産業、復活の兆し',
                  summary: '政府の支援策により、国内半導体メーカーの設備投資が増加。TSMCの工場建設も追い風に。',
                  category: 'ビジネス',
                  time: '4時間前'
                },
                {
                  title: 'リモートワーク導入企業が過去最高',
                  summary: '2024年の調査で、リモートワークを導入している企業が85%に達し、働き方の多様化が進む。',
                  category: 'ビジネス',
                  time: '6時間前'
                }
              ].map((article, index) => (
                <div key={index} className="border-l-4 border-primary-200 pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-secondary-900 mb-1">
                        {article.title}
                      </h3>
                      <p className="text-sm text-secondary-600 mb-2">
                        {article.summary}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="news-badge">
                          {article.category}
                        </span>
                        <span className="text-secondary-500">
                          {article.time}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}