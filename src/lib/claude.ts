import type { KeywordExtractionResult } from '@/types';

// クライアントサイド用のClaude API関数
// 実際のAPI呼び出しはNext.js API routesを通して行う

export const extractKeywordsFromCondition = async (
  description: string
): Promise<KeywordExtractionResult> => {
  try {
    const response = await fetch('/api/claude/extract-keywords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description }),
    });

    if (!response.ok) {
      throw new Error('Failed to extract keywords');
    }

    return await response.json();
  } catch (error) {
    console.error('Keyword extraction error:', error);

    // フォールバック: 簡単なキーワード抽出
    const fallbackKeywords = description
      .replace(/[。、！？]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1)
      .slice(0, 5);

    return {
      keywords: fallbackKeywords,
      categories: ['その他'],
      confidence: 0.3,
    };
  }
};

export const generateConditionSamples = async (): Promise<string[]> => {
  try {
    const response = await fetch('/api/claude/generate-samples');

    if (!response.ok) {
      throw new Error('Failed to generate samples');
    }

    const data = await response.json();
    return data.samples || [];
  } catch (error) {
    console.error('Sample generation error:', error);

    // フォールバック: 固定のサンプル
    return [
      'AI技術の最新動向と企業での活用事例',
      '日本の経済政策と金融市場への影響',
      '気候変動対策と再生可能エネルギーの進展',
      'スタートアップ企業の資金調達とIPO動向',
      '働き方改革とリモートワーク技術',
      '医療技術の革新と健康管理アプリ',
      'eスポーツ産業の成長と関連ビジネス',
      '食品安全と持続可能な農業技術',
      '宇宙開発事業と商業宇宙ビジネス',
      'サイバーセキュリティの脅威と対策技術'
    ];
  }
};