'use client';

import PageLayout from '@/components/layout/PageLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

export default function History() {
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const deliveryHistory = [
    {
      id: 1,
      date: '2024-01-20',
      time: '08:00',
      articles: 8,
      openRate: 82,
      categories: ['テクノロジー', 'ビジネス'],
      status: 'delivered'
    },
    {
      id: 2,
      date: '2024-01-19',
      time: '08:00',
      articles: 6,
      openRate: 75,
      categories: ['テクノロジー', 'ビジネス'],
      status: 'delivered'
    },
    {
      id: 3,
      date: '2024-01-18',
      time: '08:00',
      articles: 10,
      openRate: 88,
      categories: ['テクノロジー', 'ビジネス', '科学'],
      status: 'delivered'
    },
    {
      id: 4,
      date: '2024-01-17',
      time: '08:00',
      articles: 7,
      openRate: 0,
      categories: ['テクノロジー'],
      status: 'failed'
    },
    {
      id: 5,
      date: '2024-01-16',
      time: '08:00',
      articles: 9,
      openRate: 79,
      categories: ['ビジネス', '経済'],
      status: 'delivered'
    }
  ];

  const totalDeliveries = deliveryHistory.length;
  const successfulDeliveries = deliveryHistory.filter(h => h.status === 'delivered').length;
  const averageOpenRate = deliveryHistory
    .filter(h => h.status === 'delivered')
    .reduce((acc, h) => acc + h.openRate, 0) / successfulDeliveries;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === 'delivered') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
          配信済み
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-error-100 text-error-800">
        配信失敗
      </span>
    );
  };

  return (
    <PageLayout
      title="配信履歴"
      subtitle="過去のニュース配信履歴と統計"
    >
      <div className="p-6 space-y-6 overflow-auto">
        {/* 統計概要 */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600">総配信数</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {totalDeliveries}
                  </p>
                </div>
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">📧</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600">成功率</p>
                  <p className="text-2xl font-bold text-success-600">
                    {Math.round((successfulDeliveries / totalDeliveries) * 100)}%
                  </p>
                </div>
                <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">✅</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600">平均開封率</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {Math.round(averageOpenRate)}%
                  </p>
                </div>
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">📊</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600">今月の配信</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {deliveryHistory.length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">📅</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* フィルター */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>配信履歴</CardTitle>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'すべて' },
                  { value: 'week', label: '1週間' },
                  { value: 'month', label: '1ヶ月' }
                ].map((period) => (
                  <button
                    key={period.value}
                    onClick={() => setSelectedPeriod(period.value)}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      selectedPeriod === period.value
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-secondary-600 hover:bg-secondary-100'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deliveryHistory.map((delivery) => (
                <div
                  key={delivery.id}
                  className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-center min-w-0">
                      <div className="text-sm font-medium text-secondary-900">
                        {formatDate(delivery.date)}
                      </div>
                      <div className="text-xs text-secondary-500">
                        {delivery.time}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(delivery.status)}
                        <span className="text-sm text-secondary-600">
                          {delivery.articles}件の記事を配信
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {delivery.categories.map((category) => (
                          <span
                            key={category}
                            className="news-badge text-xs"
                          >
                            {category}
                          </span>
                        ))}
                      </div>

                      {delivery.status === 'delivered' && (
                        <div className="text-sm text-secondary-600">
                          開封率: <span className="font-medium">{delivery.openRate}%</span>
                        </div>
                      )}

                      {delivery.status === 'failed' && (
                        <div className="text-sm text-error-600">
                          配信に失敗しました
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      詳細
                    </Button>
                    {delivery.status === 'failed' && (
                      <Button variant="outline" size="sm">
                        再送信
                      </Button>
                    )}
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