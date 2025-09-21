import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { KeywordExtractionResult } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json();

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    const prompt = `以下の情報収集条件から重要なキーワードを抽出し、JSON形式で返してください。

情報収集条件: "${description}"

以下のJSON形式で回答してください：
{
  "keywords": ["キーワード1", "キーワード2", "キーワード3"],
  "categories": ["関連カテゴリ1", "関連カテゴリ2"],
  "confidence": 0.85
}

キーワードは3-8個程度、カテゴリは1-3個、信頼度は0-1の間で設定してください。
カテゴリは以下から選択: テクノロジー, ビジネス, 政治, スポーツ, エンターテイメント, 健康, 科学, 社会, 経済`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      temperature: 0.3,
      system: 'あなたは情報検索の専門家です。与えられた条件から効果的な検索キーワードを抽出し、正確なJSON形式で回答してください。',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0]?.type === 'text' ? response.content[0].text : '';

    // JSONパース（エラーハンドリング付き）
    try {
      const parsed = JSON.parse(content);
      const result: KeywordExtractionResult = {
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      };

      return NextResponse.json(result);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);

      // フォールバック: 簡単なキーワード抽出
      const fallbackKeywords = description
        .replace(/[。、！？]/g, ' ')
        .split(/\s+/)
        .filter((word: string) => word.length > 1)
        .slice(0, 5);

      const fallbackResult: KeywordExtractionResult = {
        keywords: fallbackKeywords,
        categories: ['その他'],
        confidence: 0.3,
      };

      return NextResponse.json(fallbackResult);
    }
  } catch (error) {
    console.error('Claude API error:', error);
    return NextResponse.json(
      { error: 'Failed to extract keywords' },
      { status: 500 }
    );
  }
}